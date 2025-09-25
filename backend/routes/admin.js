/* eslint-disable no-console */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Company = require('../models/Company');
const mongoose = require('mongoose');
const Admin = require('../models/Admin');
const { adminAuth } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');
const { auditLogger } = require('../middleware/auditLogger');

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Get pending companies (protected)
router.get('/pending-companies', adminAuth, async (req, res) => {
  try {
    // Explicitly use status = pending (legacy records without status but !approved also included)
    const pendingCompanies = await Company.find({ $or: [ { status: 'pending' }, { status: { $exists: false }, approved: false } ] });
    res.json(pendingCompanies);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get approved companies (protected) – matches frontend call /approved-companies
router.get('/approved-companies', adminAuth, async (req, res) => {
  try {
    /*
      Legacy records might have:
        - approved: true, status missing
        - approved: true, status still 'pending'
      Current logic: treat any approved:true that is NOT hold/denied as approved.
      (Hold/Denied always have approved:false in current flows, but we explicitly exclude for safety.)
      After data normalization, all should be status:'approved'.
    */
  const approvedCompanies = await Company.find({
      approved: true,
      $or: [
        { status: 'approved' },
        { status: { $exists: false } },
        { status: null },
        { status: 'pending' } // fallback for legacy inconsistent entries
      ]
    });

    // If we got mixed legacy statuses, optionally map them client-side; here we just return.
    res.json(approvedCompanies);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// All companies with filters/sorting for admin portal
router.get('/companies', adminAuth, async (req, res) => {
  try {
    const { status, q, sort = 'createdAt', order = 'desc' } = req.query;
    const filter = {};
    if (status && ['pending', 'approved', 'hold', 'denied'].includes(status)) {
      filter.status = status;
    }
    if (q) {
      filter.$or = [
        { companyName: { $regex: new RegExp(q, 'i') } },
        { email: { $regex: new RegExp(q, 'i') } },
        { industry: { $regex: new RegExp(q, 'i') } },
      ];
    }
    // Map to real fields; createdAt is available by default timestamps? If not, fallback to _id time
    const sortField = sort === 'name' ? 'companyName' : (sort === 'status' ? 'status' : (sort === 'updatedAt' ? 'updatedAt' : '_id'));
    const sortOrder = String(order).toLowerCase() === 'asc' ? 1 : -1;
    const list = await Company.find(filter).sort({ [sortField]: sortField === '_id' ? sortOrder : sortOrder });
    res.json(list);
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin login route with database-stored credentials
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    
    // Find admin by email
    const admin = await Admin.findOne({ email, active: true });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Update last login time
    admin.lastLogin = Date.now();
    await admin.save();
    
    // Create token with admin info
    const token = jwt.sign(
      { 
        admin: { 
          id: admin._id,
          role: admin.role 
        } 
      },
      process.env.JWT_SECRET || 'temporarysecret',
      { expiresIn: '8h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role
      }
    });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve company route (protected)
router.post('/approve-company/:id', adminAuth, auditLogger({
  action: 'approve_company',
  entityType: 'company'
}), async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { approved: true, status: 'approved' },
      { new: true }
    );
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    // Fire-and-forget approval email (don't block response)
    if (company?.email) {
      sendEmail(company.email, 'companyApproved', {
        companyName: company.companyName,
        contactName: company.contactName,
        loginUrl: process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : undefined,
      }).catch(() => {});
    }

    res.json({ message: 'Company approved successfully', company });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

// Deny company with reason (protected)
router.post('/deny-company/:id', adminAuth, auditLogger({
  action: 'deny_company',
  entityType: 'company'
}), async (req, res) => {
  try {
    const { reason } = req.body || {};
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    // Store message & retain account with denied status (do NOT delete)
    if (!Array.isArray(company.adminMessages)) {
      company.adminMessages = [];
    }
    if (reason && String(reason).trim().length) {
      company.adminMessages.push({ type: 'deny', message: String(reason).trim() });
    }
    company.status = 'denied';
    company.approved = false;
  // Validate only modified fields to avoid failing on legacy invalid values
  await company.save({ validateModifiedOnly: true });

    // Send denial email (non-blocking)
    if (company.email) {
      sendEmail(company.email, 'custom', {
  subject: 'kGamify Registration Denied',
        html: `<div style="font-family: Arial, sans-serif;">
          <h2 style="color:#dc2626;">Registration Denied</h2>
          <p>Hi ${company.companyName},</p>
          <p>Your registration was denied.${reason ? ` Reason: <strong>${String(reason).trim()}</strong>.` : ''}</p>
          <p>You will not be able to log in. You may re-register after addressing the issues.</p>
        </div>`
      }).catch(() => {});
    }

    res.json({ message: 'Company denied', company });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('PUT ON HOLD error:', err);
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Hold company with reason (protected)
router.post('/hold-company/:id', adminAuth, auditLogger({
  action: 'hold_company',
  entityType: 'company'
}), async (req, res) => {
  try {
    const { reason } = req.body || {};
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    company.status = 'hold';
    company.approved = false;
    if (!Array.isArray(company.adminMessages)) {
      company.adminMessages = [];
    }
    if (reason) {
      company.adminMessages.push({ type: 'hold', message: reason });
    }
  // Validate only modified fields to avoid failing on legacy invalid values
  await company.save({ validateModifiedOnly: true });

    // Email the company about hold status with link to messages
    if (company.email) {
      const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
      const messagesUrl = `${frontend.replace(/\/$/, '')}/messages`;
      sendEmail(company.email, 'custom', {
  subject: 'kGamify Account On Hold',
        html: `<div style="font-family: Arial, sans-serif;">
          <h2 style="color:#d97706;">Account On Hold</h2>
          <p>Hi ${company.companyName},</p>
          <p>Your account has been placed on hold.${reason ? ` Reason: <strong>${String(reason).trim()}</strong>.` : ''}</p>
          <p>Please <a href="${messagesUrl}">log in and check messages</a> from admin for details and next steps.</p>
        </div>`
      }).catch(() => {});
    }

    res.json({ message: 'Company put on hold', company });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('REVOKE ACCESS error:', err);
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Revoke access: move an approved company back to pending without deleting
router.post('/revoke-access/:id', adminAuth, auditLogger({
  action: 'revoke_company_access',
  entityType: 'company'
}), async (req, res) => {
  try {
    // Validate ID upfront to avoid CastError -> 500
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid company id' });
    }
    const { reason } = req.body || {};
    const id = req.params.id;
    const company = await Company.findById(id);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    // If adminMessages is not an array (legacy/bad data), coerce it safely first
    if (!Array.isArray(company.adminMessages)) {
      await Company.updateOne({ _id: id }, { $set: { adminMessages: [] } });
    }

    // Apply updates with minimal validation scope
    const updateOps = {
      $set: { approved: false, status: 'hold' },
    };
    if (reason && String(reason).trim()) {
      updateOps.$push = { adminMessages: { type: 'hold', message: `Access revoked: ${String(reason).trim()}`, createdAt: new Date() } };
    }

    const updated = await Company.findByIdAndUpdate(id, updateOps, {
      new: true,
      runValidators: true,
      context: 'query'
    });

    res.json({ message: 'Company access revoked and moved to hold', company: updated });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('REVOKE ACCESS error:', err);
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Messaging endpoints (admin perspective)
// Get messages for a given company id
router.get('/company/:id/messages', adminAuth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id, { adminMessages: 1, companyName: 1, email: 1, lastAdminReadAt: 1 });
    if (!company) return res.status(404).json({ message: 'Company not found' });
    // Get ALL messages without pagination to ensure complete chat history access
    const msgs = Array.isArray(company.adminMessages) ? company.adminMessages.sort((a,b)=> new Date(a.createdAt||0) - new Date(b.createdAt||0)) : [];
    // update read timestamp
    await Company.updateOne({ _id: company._id }, { $set: { lastAdminReadAt: new Date() } }).catch(()=>{});
    res.json({ company: { id: company._id, companyName: company.companyName, email: company.email }, messages: msgs });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});
// Post a reply message to a company
router.post('/company/:id/messages', adminAuth, async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ message: 'Message is required' });
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });
    if (!Array.isArray(company.adminMessages)) company.adminMessages = [];
    const msgDoc = { type: 'info', message: String(message).slice(0, 2000), from: 'admin', createdAt: new Date() };
    company.adminMessages.push(msgDoc);
    await company.save({ validateModifiedOnly: true });
    
    // Debug logging for message saving verification
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[ADMIN MESSAGE SAVED] To: ${company.companyName} | Total messages: ${company.adminMessages.length} | Latest: "${msgDoc.message.substring(0, 50)}..."`);
    }
    
    // We purposefully do not set lastCompanyReadAt here so UI can show unread for company
    // Emit real-time event via Socket.IO (room: company:<id>)
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`company:${company._id}`).emit('message:new', { companyId: String(company._id), message: msgDoc });
      }
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Socket emit error (admin -> company):', e);
      }
    }
    // Fire-and-forget email notification to company about new message
    if (company?.email) {
      try {
        const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
        const messagesUrl = `${frontend.replace(/\/$/, '')}/messages`;
        // don't block response
        sendEmail(company.email, 'newAdminMessage', {
          companyName: company.companyName,
          message: msgDoc.message,
          messagesUrl
        }).catch(() => {});
      } catch (e) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Email send error (admin message notification):', e);
        }
      }
    }
    res.status(201).json({ message: 'Reply sent', data: msgDoc });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
