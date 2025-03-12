const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const GoogleCompany = require('../models/GoogleCompany');

// Admin login route
router.post('/login', async (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  try {
    if (password !== adminPassword) {
      return res.status(401).json({ message: 'Invalid admin password' });
    }

    // Successful login without JWT token
    res.json({ message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending companies from both collections
router.get('/pending-companies', async (req, res) => {
  try {
    const regularCompanies = await Company.find({ approved: false });
    const googleCompanies = await GoogleCompany.find({ approved: false });
    
    // Mark the source of each company for frontend processing if needed
    const taggedRegularCompanies = regularCompanies.map(company => ({
      ...company.toObject(),
      source: 'regular'
    }));
    
    const taggedGoogleCompanies = googleCompanies.map(company => ({
      ...company.toObject(),
      source: 'google'
    }));
    
    // Combine both arrays
    const allPendingCompanies = [...taggedRegularCompanies, ...taggedGoogleCompanies];
    
    res.status(200).json(allPendingCompanies);
  } catch (err) {
    console.error('Error fetching pending companies:', err);
    res.status(400).json({ error: err.message });
  }
});

// Approve a company
router.post('/approve-company/:id', async (req, res) => {
  try {
    const { source } = req.query; // Optional query parameter to specify source
    
    let company;
    
    // Try to find and update in regular companies first
    company = await Company.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    
    // If not found in regular companies, try Google companies
    if (!company && (!source || source === 'google')) {
      company = await GoogleCompany.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
    }
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.status(200).json(company);
  } catch (err) {
    console.error('Error approving company:', err);
    res.status(400).json({ error: err.message });
  }
});

// Deny a company (delete from database)
router.post('/deny-company/:id', async (req, res) => {
  try {
    const { source } = req.query; // Optional query parameter to specify source
    
    let company;
    
    // Try to find and delete in regular companies first
    company = await Company.findByIdAndDelete(req.params.id);
    
    // If not found in regular companies, try Google companies
    if (!company && (!source || source === 'google')) {
      company = await GoogleCompany.findByIdAndDelete(req.params.id);
    }
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.status(200).json({ message: 'Company registration denied' });
  } catch (err) {
    console.error('Error denying company:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
