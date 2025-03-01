// filepath: /backend/routes/application.js
const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Company = require('../models/Company');

// Middleware to check logged-in company
const checkCompany = async (req, res, next) => {
  const { email } = req.body; // Assuming email is sent in the request body
  try {
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

// Create a new application
router.post('/', async (req, res) => {
  try {
    const newApplication = new Application(req.body);
    await newApplication.save();
    res.status(201).json(newApplication);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get applications by job ID
router.get('/job/:jobId', checkCompany, async (req, res) => {
  try {
    const applications = await Application.find({ jobId: req.params.jobId, CompanyName: req.companyName });
    res.status(200).json(applications);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;