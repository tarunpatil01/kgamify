const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const { upload, cloudinary } = require('../config/cloudinary');

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

    await newCompany.save();
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
    
    // Check password match
    if (company.password !== password) {
      console.log("Password mismatch for company");
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if company is approved
    if (!company.approved) {
      console.log("Company not approved yet");
      return res.status(403).json({ error: 'Your company is not approved by Admin yet' });
    }
    
    console.log("Company login successful");
    return res.status(200).json({ 
      success: true, 
      company: company,
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

    console.log("Found company:", company.companyName);
    res.status(200).json(company);
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
          const publicId = company.documents.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        } catch (error) {
          console.error('Error deleting old documents:', error);
        }
      }
      updateData.documents = req.files.documents[0].path;
    }

    // Update the company data
    await Company.findOneAndUpdate({ email }, updateData, { new: true });

    res.status(200).json({ message: 'Company profile updated successfully' });
  } catch (error) {
    console.error('Error updating company profile:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;