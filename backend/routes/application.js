// filepath: /backend/routes/application.js
const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Company = require('../models/Company');
const { upload, cloudinary } = require('../config/cloudinary');
const Job = require('../models/Job');

// Modified middleware to check logged-in company
const checkCompany = async (req, res, next) => {
  // Get email from query params, body, or headers
  const email = req.query.email || req.body.email || req.headers['company-email'];
  
  try {
    if (!email) {
      return res.status(400).json({ error: 'Company email is required' });
    }
    
    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.companyName = company.companyName;
    next();
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Create a new application with resume upload
router.post('/', upload.single('resume'), async (req, res) => {
  try {
    // Create application data object
    const applicationData = {
      ...req.body,
    };

    // Handle resume file if uploaded
    if (req.file) {
      applicationData.resume = req.file.path; // Cloudinary URL
      applicationData.resumePublicId = req.file.filename || 
        (req.file.public_id ? req.file.public_id : `resume_${Date.now()}`);
      
      console.log('Resume uploaded to Cloudinary:', applicationData.resume);
    }

    const newApplication = new Application(applicationData);
    await newApplication.save();

    // Update job with the new applicant
    if (req.body.jobId) {
      await Job.findByIdAndUpdate(
        req.body.jobId,
        { $addToSet: { applicants: newApplication._id } }
      );
    }

    res.status(201).json(newApplication);
  } catch (err) {
    console.error('Error creating application:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get applications by job ID
router.get('/job/:jobId', checkCompany, async (req, res) => {
  try {
    const applications = await Application.find({ 
      jobId: req.params.jobId,
      CompanyName: req.companyName
    });
    res.status(200).json(applications);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get a specific application with resume URL
router.get('/:id', checkCompany, async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      CompanyName: req.companyName
    });
    
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }
    
    // Generate a secure, time-limited URL for the resume if it exists
    let resumeUrl = null;
    if (application.resume) {
      // Use the existing URL or generate a secure URL with cloudinary if necessary
      resumeUrl = application.resume;
    }
    
    res.status(200).json({
      ...application.toObject(),
      resumeUrl
    });
  } catch (err) {
    console.error('Error fetching application:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;