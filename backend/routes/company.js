/* eslint-disable no-console */
const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const { upload, cloudinary } = require('../config/cloudinary');
const bcrypt = require('bcryptjs');
const { getDocumentUrl, getDocumentDownloadUrl } = require('../utils/documentHelper');
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
    // Pending accounts cannot login; provide clear message
    if (!company.approved && company.status === 'pending') {
      // Per product requirement: surface as 'on hold' message on login failure
      return res.status(403).json({ error: 'Your account is on hold' });
    }
    // Allow login when on hold, but restrict actions elsewhere
    // When status is 'hold' we return success and the UI will gate features
    
    // Create a copy of the company object without the password
    const companySafe = company.toObject();
    delete companySafe.password;
    
    // Create a JWT for company session (lightweight auth for messaging)
    const token = jwt.sign({ companyId: company._id, email: company.email }, process.env.JWT_SECRET || 'temporarysecret', { expiresIn: '8h' });
    return res.status(200).json({ 
      success: true, 
      company: companySafe,
      type: 'regular',
      token
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
    const { email, limit = 50, page = 1 } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const company = await Company.findOne({ email }, { adminMessages: 1 });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    const msgs = Array.isArray(company.adminMessages) ? company.adminMessages : [];
    const sorted = msgs.sort((a,b) => new Date(a.createdAt||0) - new Date(b.createdAt||0)); // chronological
    const l = Math.min(100, Math.max(1, parseInt(limit,10)||50));
    const p = Math.max(1, parseInt(page,10)||1);
    const start = (p-1)*l;
    const slice = sorted.slice(start, start + l);
    return res.json({ page: p, total: sorted.length, messages: slice });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Company sends a message to admin (from company) - simple auth by email param; in future replace with proper token
router.post('/messages', companyAuth, async (req, res) => {
  try {
    const { email, message } = req.body || {};
    if (!email || !message) return res.status(400).json({ error: 'Email and message are required' });
    const company = await Company.findOne({ email });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    if (!Array.isArray(company.adminMessages)) company.adminMessages = [];
    const msgDoc = { type: 'info', message: String(message).slice(0, 2000), from: 'company', createdAt: new Date() };
    company.adminMessages.push(msgDoc);
    await company.save({ validateModifiedOnly: true });
    // Socket emit
    try {
      const io = req.app.get('io');
      if (io) io.to(`company:${company._id}`).emit('message:new', { companyId: String(company._id), message: msgDoc });
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Socket emit error (company -> admin):', e);
      }
    }
    return res.status(201).json({ message: 'Message sent', data: msgDoc });
  } catch {
    return res.status(500).json({ error: 'Failed to send message' });
  }
});
