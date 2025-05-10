// filepath: /backend/routes/application.js
const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Company = require('../models/Company');
const { upload, cloudinary } = require('../config/cloudinary');
const Job = require('../models/Job');

// Modified middleware to check logged-in company
const checkCompany = async (req, res, next) => {
  // Get email from query params, body, or headers (added company-email header)
  const email = req.query.email || req.body.email || req.headers['company-email'];
  
  try {
    if (!email) {
      console.error('Missing company email in request');
      return res.status(400).json({ error: 'Company email is required for authentication' });
    }
    
    console.log(`Authenticating company with email: ${email}`);
    const company = await Company.findOne({ email });
    if (!company) {
      console.error(`No company found with email: ${email}`);
      return res.status(401).json({ error: 'Unauthorized - company not found' });
    }
    
    console.log(`Company authenticated: ${company.companyName}`);
    req.companyName = company.companyName;
    next();
  } catch (err) {
    console.error('Error in company authentication middleware:', err);
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

    // Get the job details to ensure company email is included
    if (req.body.jobId) {
      try {
        const job = await Job.findById(req.body.jobId);
        if (job && job.companyEmail && !applicationData.companyEmail) {
          applicationData.companyEmail = job.companyEmail;
        }
      } catch (err) {
        console.error("Error fetching job details:", err);
      }
    }

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
    const { jobId } = req.params;
    
    // Enhanced debugging info
    console.log('-------------------------------------');
    console.log('Fetching applications for job ID:', jobId);
    console.log('Company name from middleware:', req.companyName);
    console.log('Company email from request:', req.query.email || req.body.email || req.headers['company-email']);
    
    // First, verify the job exists
    const job = await Job.findById(jobId);
    if (!job) {
      console.log(`Job with ID ${jobId} not found`);
      return res.status(404).json({ error: 'Job not found' });
    }
    
    console.log('Found job:', job.jobTitle);
    console.log('Job company name:', job.companyName);
    console.log('Job company email:', job.companyEmail);
    
    // Check applications with multiple matching options
    let applications;
    
    // Try company name match first (case insensitive)
    applications = await Application.find({
      jobId: jobId,
      CompanyName: { $regex: new RegExp(req.companyName, 'i') }
    });
    console.log(`Found ${applications.length} applications matching company name: ${req.companyName}`);
    
    // If no results, try by company email if available in job record
    if (applications.length === 0 && job.companyEmail) {
      console.log('Trying to match by company email:', job.companyEmail);
      applications = await Application.find({
        jobId: jobId,
        $or: [
          { companyEmail: job.companyEmail },
          { CompanyEmail: job.companyEmail },
          { companyEmail: { $exists: false } } // Include applications with no companyEmail field
        ]
      });
      console.log(`Found ${applications.length} applications by company email or missing email field`);
    }
    
    // Last resort: if company owns the job, return all applications for this job
    if (applications.length === 0 && 
        job.companyName.toLowerCase() === req.companyName.toLowerCase()) {
      console.log('Company owns job - returning all applications');
      applications = await Application.find({ jobId: jobId });
      console.log(`Found total of ${applications.length} applications for job`);
    }
    
    // Format application data for response
    const formattedApplications = applications.map(app => ({
      _id: app._id,
      jobId: app.jobId,
      applicantName: app.applicantName,
      companyName: app.CompanyName,
      companyEmail: app.companyEmail || job.companyEmail || '',
      resume: app.resume,
      resumePublicId: app.resumePublicId,
      testScore: app.testScore,
      skills: app.skills || [],
      createdAt: app.createdAt
    }));
    
    console.log(`Returning ${formattedApplications.length} applications`);
    console.log('-------------------------------------');
    
    res.status(200).json(formattedApplications);
  } catch (err) {
    console.error('Error fetching job applications:', err);
    res.status(500).json({ error: 'Failed to fetch applications', message: err.message });
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