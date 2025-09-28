/* eslint-disable no-console */
const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const { upload, cloudinary } = require('../config/cloudinary');
const bcrypt = require('bcryptjs');
const { getDocumentUrl, getDocumentDownloadUrl } = require('../utils/documentHelper');
const { sendEmail } = require('../utils/emailService');
// Plan limits (can be adjusted later or moved to config)
const PLAN_LIMITS = { free: 1, silver: 5, gold: 20 };
// Messaging additions

// Middleware to authenticate company
const authenticateCompany = async (req, res, next) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const company = await Company.findOne({ email });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    req.user = { email: company.email };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Regular company registration
router.post('/', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'documents', maxCount: 1 }
]), async (req, res) => {
  try {

    // Check for existing company with same email or username
    const { email, Username } = req.body;
    const existingCompany = await Company.findOne({
      $or: [
        { email },
        { Username }
      ]
    });
    if (existingCompany) {
      // Clean up uploaded files if a conflict exists
      if (req.files?.logo) {
        try {
          await cloudinary.uploader.destroy(req.files.logo[0].filename);
  } catch {
          // ignore cleanup failure
        }
      }
      if (req.files?.documents) {
        try {
          await cloudinary.uploader.destroy(req.files.documents[0].filename);
  } catch {
          // ignore cleanup failure
        }
      }
      const conflictField = existingCompany.email === email ? 'Email' : 'Username';
      return res.status(400).json({ error: `${conflictField} already registered` });
    }

    // Parse socialMediaLinks if it's provided as a string
    const companyData = { ...req.body };
    if (companyData.socialMediaLinks && typeof companyData.socialMediaLinks === 'string') {
      try {
        companyData.socialMediaLinks = JSON.parse(companyData.socialMediaLinks);
      } catch (error) {
        console.error('Error parsing socialMediaLinks:', error);
        return res.status(400).json({ error: 'Invalid socialMediaLinks format' });
      }
    }

    const newCompany = new Company({
      ...companyData,
      // Ensure optional fields exist for minimal registration
      contactName: companyData.contactName || undefined,
      phone: companyData.phone || undefined,
      address: companyData.address || undefined,
      size: companyData.size || undefined,
      registrationNumber: companyData.registrationNumber ? companyData.registrationNumber : undefined,
      logo: req.files?.logo ? req.files.logo[0].path : null,
      documents: req.files?.documents ? req.files.documents[0].path : null,
      approved: false,
      profileCompleted: false
    });

    await newCompany.save(); // Password will be hashed by pre-save hook
    res.status(201).json({ message: 'Company registration request sent for approval' });
  } catch (error) {
    console.error('Server error:', error);
    // Handle duplicate key error for unique Username/email
    if (error?.code === 11000) {
      const key = Object.keys(error.keyPattern || {})[0] || 'Field';
      return res.status(400).json({ error: `${key} already registered` });
    }
    res.status(400).json({ error: error.message });
  }
});

const jwt = require('jsonwebtoken');

// Login a company (only regular companies now)
router.post('/login', async (req, res) => {
  try {
    const { identifier, email, password } = req.body;
    const userIdentifier = identifier || email; // backwards compatibility
    
    if (!userIdentifier || !password) {
      return res.status(400).json({ error: 'Email/Username and password are required' });
    }
    
    // Check regular company collection by email or Username
    const company = await Company.findOne({
      $or: [
        { email: userIdentifier },
        { Username: userIdentifier }
      ]
    });
    
    if (!company) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password match using the comparePassword method
    const isMatch = await company.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Account lifecycle checks
    if (company.status === 'denied') {
      return res.status(403).json({ error: 'Your account has been denied. Please contact support or re-register.' });
    }
    // Allow pending / hold accounts to login but mark limited access; UI + protected routes handle gating
    const limitedAccess = (!company.approved && company.status === 'pending') || company.status === 'hold';
    
    // Create a copy of the company object without the password
    const companySafe = company.toObject();
    delete companySafe.password;
    
    // Create a JWT for company session (lightweight auth for messaging)
    const token = jwt.sign({ companyId: company._id, email: company.email }, process.env.JWT_SECRET || 'temporarysecret', { expiresIn: '8h' });
    return res.status(200).json({ 
      success: true, 
      company: companySafe,
      type: 'regular',
      token,
      limitedAccess
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(400).json({ error: err.message });
  }
});

// Get company details by ID
router.get('/details/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    } 
    res.status(200).json(company);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get company info by email (only regular companies now)
router.get('/info', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find in regular companies only
    const company = await Company.findOne({ email });

    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Create a copy of the company object without the password
    const companySafe = company.toObject();
    delete companySafe.password;

    res.status(200).json(companySafe);
  } catch (err) {
    console.error('Error fetching company info:', err);
    res.status(400).json({ error: err.message });
  }
});

// Update company profile
router.put('/update/:email', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'documents', maxCount: 1 }
]), async (req, res) => {
  try {
    const { email } = req.params;
    const updateData = { ...req.body };
    
    // Find the company
    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }

    // Create social media links object from individual fields
    if (updateData.instagram || updateData.twitter || updateData.linkedin || updateData.youtube) {
      updateData.socialMediaLinks = {
        instagram: updateData.instagram || '',
        twitter: updateData.twitter || '',
        linkedin: updateData.linkedin || '',
        youtube: updateData.youtube || ''
      };
      
      // Remove individual fields to avoid duplicating data
      delete updateData.instagram;
      delete updateData.twitter;
      delete updateData.linkedin;
      delete updateData.youtube;
    }
    // If socialMediaLinks is passed as JSON string, parse it
    else if (updateData.socialMediaLinks && typeof updateData.socialMediaLinks === 'string') {
      try {
        updateData.socialMediaLinks = JSON.parse(updateData.socialMediaLinks);
      } catch (error) {
        console.error('Error parsing socialMediaLinks:', error);
      }
    }

    // Handle password update separately
    if (updateData.password) {
      // Only update password if it's different from what's already there
      try {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(updateData.password, salt);
      } catch (error) {
        console.error('Error hashing password:', error);
        return res.status(500).json({ error: 'Error processing password update' });
      }
    } else {
      // If no password provided in update, remove it from updateData to avoid overwriting
      delete updateData.password;
    }

    // Handle file uploads
    if (req.files?.logo) {
      // If there's an existing logo, delete it from Cloudinary
      if (company.logo) {
        try {
          // Extract public_id from the URL
          const publicId = company.logo.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error('Error deleting old logo:', error);
          // Continue with the update even if the old file couldn't be deleted
        }
      }
      updateData.logo = req.files.logo[0].path;
    }
    
    if (req.files?.documents) {
      // If there are existing documents, delete them from Cloudinary
      if (company.documents) {
        try {
          // Extract public_id correctly from the URL
          const publicId = company.documents.includes('/')
            ? `kgamify/${  company.documents.split('/').pop().split('.')[0]}`
            : `kgamify/${  company.documents}`;
          
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error('Error deleting old documents:', error);
        }
      }
      
      // Store the complete Cloudinary URL rather than just the path
      const uploadedDoc = req.files.documents[0];
      updateData.documents = uploadedDoc.path;
      
      // Log the document URL for debugging
    }

    // Update the company data
    await Company.findOneAndUpdate({ email }, updateData, { new: true });

    res.status(200).json({ message: 'Company profile updated successfully' });
  } catch (error) {
    console.error('Error updating company profile:', error);
    res.status(400).json({ error: error.message });
  }
});

// Add a route to get document URL
router.get('/document', authenticateCompany, async (req, res) => {
  try {
    const email = req.user.email;
    const company = await Company.findOne({ email });
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    if (!company.documents) {
      return res.status(404).json({ error: 'No documents found for this company' });
    }
    
    // Generate a proper URL for the document
    const documentUrl = getDocumentUrl(company.documents);
    
    res.status(200).json({ 
      documentUrl,
      message: 'Document URL retrieved successfully' 
    });
  } catch (error) {
    console.error('Error retrieving document URL:', error);
    res.status(500).json({ error: 'Error retrieving document URL' });
  }
});

// Download document by company ID (for admin portal)
router.get('/document/download/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    if (!company.documents) {
      return res.status(404).json({ error: 'No documents found for this company' });
    }
    
    const fileName = `${company.companyName.replace(/\s+/g, '_')}_documents.pdf`;
    
    // For Edge browser compatibility, we'll use a slightly different approach
    // Generate a proper URL for forcing document download
    const documentUrl = getDocumentDownloadUrl(company.documents, fileName);
    
    // Set appropriate headers to encourage download
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Redirect to the document URL for direct download
    return res.redirect(documentUrl);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ error: 'Error downloading document' });
  }
});

// Add this new route for direct file download with proper headers
router.get('/document/direct-download/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    if (!company.documents) {
      return res.status(404).json({ error: 'No documents found for this company' });
    }
    
    const fileName = `${company.companyName.replace(/\s+/g, '_')}_documents.pdf`;
    
    // Get the document URL without attachment flag first
    const documentUrl = getDocumentUrl(company.documents);
    
    // Fetch the document from Cloudinary
    const axios = require('axios');
    const response = await axios({
      method: 'get',
      url: documentUrl,
      responseType: 'stream'
    });
    
    // Set appropriate headers for downloading
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Pipe the file directly to the response
    response.data.pipe(res);
  } catch (error) {
    console.error('Error providing direct download:', error);
    res.status(500).json({ error: 'Error downloading document' });
  }
});

// Get document direct link by company ID (for admin portal)
router.get('/document/link/:id', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    if (!company.documents) {
      return res.status(404).json({ error: 'No documents found for this company' });
    }
    
    // Generate a proper URL for the document
    const documentUrl = getDocumentUrl(company.documents);
    
    res.status(200).json({ 
      documentUrl,
      fileName: `${company.companyName  }-document`,
      message: 'Document URL retrieved successfully' 
    });
  } catch (error) {
    console.error('Error retrieving document URL:', error);
    res.status(500).json({ error: 'Error retrieving document URL' });
  }
});

module.exports = router;
// Additional endpoints for subscription & profile completion

// Update subscription plan (simple version - activates immediately, no payment integration yet)
router.post('/subscription/choose', async (req, res) => {
  try {
    const { email, plan } = req.body;
    if (!email || !plan) return res.status(400).json({ error: 'email and plan required' });
    if (!['free', 'silver', 'gold'].includes(plan)) return res.status(400).json({ error: 'Invalid plan' });
    const company = await Company.findOne({ email });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    company.subscriptionPlan = plan;
    company.subscriptionStatus = 'active';
    company.subscriptionActivatedAt = new Date();
    // Set expiry 30 days from now for silver/gold; free = no expiry
    if (plan === 'free') {
      company.subscriptionExpiresAt = undefined;
    } else {
      company.subscriptionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
    await company.save({ validateModifiedOnly: true });
    return res.json({ message: 'Subscription updated', planLimits: PLAN_LIMITS[plan] });
  } catch (err) {
    console.error('subscription choose error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update profile completion details (calculates completion %)
router.post('/profile/complete', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'documents', maxCount: 1 }
]), async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email required' });
    const company = await Company.findOne({ email });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    // Fields considered for completion
    const completionFields = [
      'companyName','contactName','website','industry','type','size','phone','address','registrationNumber','description','documents','logo'
    ];
    const updated = {};
    // Apply simple scalar fields
    ['contactName','website','industry','type','size','phone','address','registrationNumber','description'].forEach(f => {
      if (req.body[f]) updated[f] = req.body[f];
    });
    if (req.files?.logo) updated.logo = req.files.logo[0].path;
    if (req.files?.documents) updated.documents = req.files.documents[0].path;

    await Company.updateOne({ email }, { $set: updated });
    const fresh = await Company.findOne({ email });
    // Compute completion
    const completedList = completionFields.filter(f => !!fresh[f]);
    const pct = Math.round((completedList.length / completionFields.length) * 100);
    fresh.profileCompletion = pct;
    fresh.profileFieldsCompleted = completedList;
    if (pct === 100) fresh.profileCompleted = true;
    await fresh.save({ validateModifiedOnly: true });
    return res.json({ message: 'Profile updated', completion: pct, completedFields: completedList });
  } catch (err) {
    console.error('profile complete error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Middleware to enforce plan & approval before posting jobs (to be imported into job route if refactored)
async function enforceJobPostingRules(req, res, next) {
  try {
    const email = (req.body.companyEmail || req.body.email || req.query.email);
    if (!email) return res.status(400).json({ error: 'Company email required' });
    const company = await Company.findOne({ email });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    if (!company.emailVerified) return res.status(403).json({ error: 'Verify your email first' });
    if (!company.profileCompleted) return res.status(403).json({ error: 'Complete profile before posting jobs' });
    if (!company.approved) return res.status(403).json({ error: 'Company not approved by admin yet' });
    const plan = company.subscriptionPlan || 'free';
    const limit = PLAN_LIMITS[plan] || 0;
    if (company.activeJobCount >= limit) {
      return res.status(403).json({ error: 'Plan job post limit reached' });
    }
    // Pass company downstream
    req.companyDoc = company;
    return next();
  } catch {
    return res.status(500).json({ error: 'Rule enforcement failed' });
  }
}

module.exports.enforceJobPostingRules = enforceJobPostingRules;
// Chat-style messaging endpoints appended below for company/admin conversation
// Simple company token auth middleware
function companyAuth(req, res, next) {
  const token = req.header('company-auth');
  if (!token) return res.status(401).json({ error: 'Auth token required' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'temporarysecret');
    req.companyAuth = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Get paginated messages for a company by email (now requires token)
router.get('/messages', companyAuth, async (req, res) => {
  try {
    const { email, limit, page } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const company = await Company.findOne({ email }, { adminMessages: 1, lastCompanyReadAt: 1 });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    const msgs = Array.isArray(company.adminMessages) ? company.adminMessages : [];
    const sorted = msgs.sort((a,b) => new Date(a.createdAt||0) - new Date(b.createdAt||0)); // chronological
    
    // If no pagination parameters provided, return ALL messages to ensure complete history access
    if (!limit && !page) {
      // Debug logging for message retrieval verification
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[ALL MESSAGES RETRIEVED] Company: ${company.companyName || email} | Total messages: ${sorted.length} | Oldest: ${sorted[0]?.createdAt || 'N/A'} | Newest: ${sorted[sorted.length-1]?.createdAt || 'N/A'}`);
      }
      // mark read timestamp
      await Company.updateOne({ email }, { $set: { lastCompanyReadAt: new Date() } }).catch(()=>{});
      return res.json({ page: 1, total: sorted.length, messages: sorted });
    }
    
    // Otherwise, use existing pagination logic
    const l = Math.min(100, Math.max(1, parseInt(limit,10)||50));
    const p = Math.max(1, parseInt(page,10)||1);
    const start = (p-1)*l;
    const slice = sorted.slice(start, start + l);
    
    // Debug logging for paginated retrieval
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[PAGINATED MESSAGES] Company: ${company.companyName || email} | Page: ${p} | Limit: ${l} | Returned: ${slice.length}/${sorted.length} total`);
    }
    
    // mark read timestamp
    await Company.updateOne({ email }, { $set: { lastCompanyReadAt: new Date() } }).catch(()=>{});
    return res.json({ page: p, total: sorted.length, messages: slice });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Company sends a message to admin (from company) with optional attachments
router.post('/messages', companyAuth, upload.array('attachments', 5), async (req, res) => {
  try {
  const { email, message, clientId } = req.body || {};
    if (!email || (!message && !Array.isArray(req.files))) return res.status(400).json({ error: 'Email or content is required' });
    const company = await Company.findOne({ email });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    if (!Array.isArray(company.adminMessages)) company.adminMessages = [];
    const attachments = Array.isArray(req.files) ? req.files.map(f => ({
      url: f.path || f.secure_url,
      type: f.mimetype,
      name: f.originalname,
      size: f.size
    })) : [];
  const msgDoc = { type: 'info', message: String(message || '').slice(0, 2000), from: 'company', createdAt: new Date(), attachments, clientId };
    company.adminMessages.push(msgDoc);
    await company.save({ validateModifiedOnly: true });
    
    // Debug logging for message saving verification
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[MESSAGE SAVED] Company: ${company.companyName} | Total messages: ${company.adminMessages.length} | Latest: "${msgDoc.message.substring(0, 50)}..."`);
    }
    
    // Socket emit
    try {
      const io = req.app.get('io');
  if (io) io.to(`company:${company._id}`).emit('message:new', { companyId: String(company._id), message: msgDoc });
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Socket emit error (company -> admin):', e);
      }
    }
    // Email notification to admin(s) - simple single recipient for now
    const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_EMAIL || 'natheprasad17@gmail.com';
    if (adminEmail) {
      sendEmail(adminEmail, 'custom', {
        subject: `New Message from ${company.companyName || 'Company'}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#3b82f6;">New Company Message</h2>
          <p><strong>From:</strong> ${company.companyName || company.email}</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px 16px;border-radius:6px;margin:16px 0;white-space:pre-wrap;">${msgDoc.message.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
          <p style="font-size:14px;color:#555;">Reply via admin portal:</p>
          <p><a href="${(process.env.FRONTEND_URL||'http://localhost:3000').replace(/\/$/,'')}/admin/messages/${company._id}" style="background:#ff8200;color:#fff;text-decoration:none;padding:10px 18px;border-radius:4px;display:inline-block;">Open Conversation</a></p>
        </div>`
      }).catch(()=>{});
    }
    return res.status(201).json({ message: 'Message sent', data: msgDoc });
  } catch {
    return res.status(500).json({ error: 'Failed to send message' });
  }
});
