// filepath: /backend/routes/company.js
const express = require('express');
const router = express.Router();
const Company = require('../models/Company');

// Register a new company
router.post('/register', async (req, res) => {
  try {
    const newCompany = new Company(req.body);
    await newCompany.save();
    res.status(201).json(newCompany);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Login a company
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const company = await Company.findOne({ email, password });
    if (!company) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    res.status(200).json({ success: true, company });
  } catch (err) {
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

module.exports = router;