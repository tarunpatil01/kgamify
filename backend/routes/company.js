const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const { upload, cloudinary } = require('../config/cloudinary');
const bcrypt = require('bcrypt');
const { getDocumentUrl, extractPublicId, getDocumentDownloadUrl } = require('../utils/documentHelper');

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
    console.log('Files received:', req.files);
    console.log('Form data received:', req.body);

    // Check for existing company with same email
    const existingCompany = await Company.findOne({ email: req.body.email });
    if (existingCompany) {
      // Clean up uploaded files if email already exists
      if (req.files?.logo) {
        await cloudinary.uploader.destroy(req.files.logo[0].filename);
      }
      if (req.files?.documents) {
        await cloudinary.uploader.destroy(req.files.documents[0].filename);
      }
      return res.status(400).json({ error: 'Email already registered' });
    }

    const newCompany = new Company({
      ...req.body,
      logo: req.files?.logo ? req.files.logo[0].path : null,
      documents: req.files?.documents ? req.files.documents[0].path : null,
      approved: false
    });

    await newCompany.save(); // Password will be hashed by pre-save hook
    res.status(201).json({ message: 'Company registration request sent for approval' });
  } catch (error) {
    console.error('Server error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login a company (only regular companies now)
router.post('/login', async (req, res) => {
  try {
    console.log("Login attempt with:", req.body);
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check regular company collection
    const company = await Company.findOne({ email });
    console.log("Found company:", company ? company.companyName : "none");
    
    if (!company) {
      console.log("No company found with email:", email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password match using the comparePassword method
    const isMatch = await company.comparePassword(password);
    if (!isMatch) {
      console.log("Password mismatch for company");
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if company is approved
    if (!company.approved) {
      console.log("Company not approved yet");
      return res.status(403).json({ error: 'Your company is not approved by Admin yet' });
    }
    
    // Create a copy of the company object without the password
    const companySafe = company.toObject();
    delete companySafe.password;
    
    console.log("Company login successful");
    return res.status(200).json({ 
      success: true, 
      company: companySafe,
      type: 'regular'
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
    console.log("Received request for company info with email:", email);
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find in regular companies only
    const company = await Company.findOne({ email });

    if (!company) {
      console.log("No company found with email:", email);
      return res.status(404).json({ error: 'Company not found' });
    }

    // Create a copy of the company object without the password
    const companySafe = company.toObject();
    delete companySafe.password;

    console.log("Found company:", company.companyName);
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
    let company = await Company.findOne({ email });
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
            ? 'kgamify/' + company.documents.split('/').pop().split('.')[0]
            : 'kgamify/' + company.documents;
          
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error('Error deleting old documents:', error);
        }
      }
      
      // Store the complete Cloudinary URL rather than just the path
      const uploadedDoc = req.files.documents[0];
      updateData.documents = uploadedDoc.path;
      
      // Log the document URL for debugging
      console.log('Document uploaded to:', updateData.documents);
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
      documentUrl: documentUrl,
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
      documentUrl: documentUrl,
      fileName: company.companyName + '-document',
      message: 'Document URL retrieved successfully' 
    });
  } catch (error) {
    console.error('Error retrieving document URL:', error);
    res.status(500).json({ error: 'Error retrieving document URL' });
  }
});

module.exports = router;