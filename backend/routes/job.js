const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Company = require('../models/Company');
const GoogleCompany = require('../models/GoogleCompany');

// Get all jobs (public endpoint without authentication)
router.get('/', async (req, res) => {
  try {
    // If company email is provided, filter by it
    const { email } = req.query;
    
    let query = {};
    if (email) {
      console.log(`Backend: Filtering jobs by company email: "${email}"`);
      query = { companyEmail: email };
    }
    
    const jobs = await Job.find(query);
    console.log(`Backend: Found ${jobs.length} jobs${email ? ' for ' + email : ''}`);
    
    if (email && jobs.length === 0) {
      console.log(`Backend: No jobs found for email: ${email}. Checking for jobs without companyEmail...`);
      const allJobs = await Job.find({});
      const missingEmailJobs = allJobs.filter(job => !job.companyEmail);
      console.log(`Backend: Found ${missingEmailJobs.length} jobs with missing companyEmail field`);
    }
    
    res.status(200).json(jobs);
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(400).json({ error: err.message });
  }
});

// Create a new job
router.post('/', async (req, res) => {
  try {
    const { email, companyEmail } = req.body;
    // Use either explicitly provided companyEmail or fall back to email
    const finalEmail = companyEmail || email;
    
    if (!finalEmail) {
      return res.status(401).json({ error: 'Company email required' });
    }

    console.log("Creating job post with company email:", finalEmail);

    // Find company in either collection and verify it's approved
    let company = await Company.findOne({ email: finalEmail, approved: true });
    
    // If not found in regular companies, try Google companies
    if (!company) {
      company = await GoogleCompany.findOne({ email: finalEmail, approved: true });
    }
    
    if (!company) {
      return res.status(401).json({ error: 'Unauthorized or company not approved' });
    }

    const newJob = new Job({
      ...req.body,
      companyName: company.companyName,
      companyEmail: finalEmail // Ensure consistent field usage
    });
    
    await newJob.save();
    res.status(201).json(newJob);
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(400).json({ error: err.message });
  }
});

// Get a specific job by ID
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.status(200).json(job);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Edit a job
router.put('/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a job
router.delete('/:id', async (req, res) => {
  try {
    console.log('Deleting job with ID:', req.params.id);
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;