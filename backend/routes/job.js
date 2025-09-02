const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Company = require('../models/Company');
const { upload } = require('../config/cloudinary');

// Get all jobs (public endpoint without authentication)
router.get('/', async (req, res) => {
  try {
    // If company email is provided, filter by it
    const { email } = req.query;
    
    let query = {};
    if (email) {
      query = { companyEmail: email };
    }
    
    const jobs = await Job.find(query);

    res.status(200).json(jobs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Create a new job
// Accept either multiple files under 'jdFiles' or single file under 'jdPdf'
router.post('/', (req, res, next) => {
  // Try to parse multiple first; fall back to single
  const multi = upload.array('jdFiles', 5);
  multi(req, res, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    if (req.files && req.files.length) return next();
    // No multiple files uploaded; try single under jdPdf
    return upload.single('jdPdf')(req, res, next);
  });
}, async (req, res) => {
  try {
    const { email, companyEmail } = req.body;
    // Use either explicitly provided companyEmail or fall back to email
    const finalEmail = companyEmail || email;
    
    if (!finalEmail) {
      return res.status(401).json({ error: 'Company email required' });
    }


    // Find company and verify lifecycle state
    const company = await Company.findOne({ email: finalEmail });
    if (!company) {
      return res.status(401).json({ error: 'Unauthorized or company not found' });
    }
    if (company.status === 'hold') {
      return res.status(403).json({ error: 'Your account is on hold. You cannot post jobs at this time. Please check Messages for details.' });
    }
    if (company.status === 'denied') {
      return res.status(403).json({ error: 'Your account has been denied. Please contact support.' });
    }
    if (!company.approved) {
      return res.status(403).json({ error: 'Company not approved' });
    }

    // Handle job description from textarea (no HTML processing needed)
    // Collect file URLs from either array or single upload
    const uploadedUrls = Array.isArray(req.files) && req.files.length ? req.files.map(f => f.path) : (req.file?.path ? [req.file.path] : []);

    const newJob = new Job({
      ...req.body,
      // Backward compatibility single URL
      jdPdfUrl: req.file?.path || req.body.jdPdfUrl || undefined,
      // Preferred: array of files
      jdFiles: (req.body.jdFiles && Array.isArray(req.body.jdFiles)) ? req.body.jdFiles : uploadedUrls,
      companyName: company.companyName,
      companyEmail: finalEmail // Ensure consistent field usage
    });
    
  await newJob.save();
  res.status(201).json(newJob);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get a specific job by ID
router.get('/:id', async (req, res) => {
  try {
    // Update to populate the applicants field
    const job = await Job.findById(req.params.id).populate('applicants');
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.status(200).json(job);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Edit a job
router.put('/:id', (req, res, next) => {
  const multi = upload.array('jdFiles', 5);
  multi(req, res, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    if (req.files && req.files.length) return next();
    return upload.single('jdPdf')(req, res, next);
  });
}, async (req, res) => {
  try {
    // Ensure the job exists
    const existingJob = await Job.findById(req.params.id);
    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Update the job - preserve companyEmail if not provided
    // Merge jdFiles: if new uploads provided, append to existing unless client indicates replacement
    const uploadedUrls = Array.isArray(req.files) && req.files.length ? req.files.map(f => f.path) : (req.file?.path ? [req.file.path] : []);
    const clientJdFiles = req.body.jdFiles ? (Array.isArray(req.body.jdFiles) ? req.body.jdFiles : [req.body.jdFiles]) : undefined;
    // If client provided jdFiles explicitly, use that; else merge uploads into existing
    const nextJdFiles = typeof clientJdFiles !== 'undefined' ? clientJdFiles.filter(Boolean) : Array.from(new Set([...(existingJob.jdFiles || []), ...uploadedUrls]));

    const updatedData = {
      ...req.body,
      // Single URL compatibility: replace if new single uploaded; else respect explicit value; else keep
      jdPdfUrl: (uploadedUrls[0]) ?? (typeof req.body.jdPdfUrl !== 'undefined' ? req.body.jdPdfUrl : existingJob.jdPdfUrl),
      // Multiple URLs preferred
      jdFiles: nextJdFiles,
      companyEmail: req.body.companyEmail || existingJob.companyEmail
    };
    
    const job = await Job.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a job
router.delete('/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
