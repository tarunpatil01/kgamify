const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const Company = require('../models/Company');
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
    const pendingCompanies = await Company.find({ approved: false });
    res.json(pendingCompanies);
  } catch {
    // Silent error handling; don't expose details to client
    res.status(500).json({ message: 'Server error' });
  }
});

// Get approved companies (protected)
router.get('/approved-companies', adminAuth, async (req, res) => {
  try {
    const approvedCompanies = await Company.find({ approved: true });
    res.json(approvedCompanies);
  } catch {
    // Silent error handling; don't expose details to client
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

    // Store message then remove account
    if (reason) {
      company.adminMessages = company.adminMessages || [];
      company.adminMessages.push({ type: 'deny', message: reason });
    }
    company.status = 'denied';
    await company.save();

    // Send denial email
    if (company.email) {
      sendEmail(company.email, 'custom', {
        subject: 'KGamify Registration Denied',
        html: `<div style="font-family: Arial, sans-serif;">
          <h2 style="color:#dc2626;">Registration Denied</h2>
          <p>Hi ${company.companyName},</p>
          <p>Your registration was denied.${reason ? ` Reason: <strong>${reason}</strong>.` : ''}</p>
          <p>You may re-register after addressing the issues.</p>
        </div>`
      }).catch(() => {});
    }

    // Finally delete company
    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: 'Company denied and removed' });
  } catch {
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
    company.adminMessages = company.adminMessages || [];
    if (reason) {
      company.adminMessages.push({ type: 'hold', message: reason });
    }
    await company.save();

    res.json({ message: 'Company put on hold', company });
  } catch {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
