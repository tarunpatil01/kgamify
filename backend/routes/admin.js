const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Company = require('../models/Company');

// Get pending companies
router.get('/pending-companies', async (req, res) => {
  try {
    const pendingCompanies = await Company.find({ approved: false });
    res.json(pendingCompanies);
  } catch (error) {
    console.error('Error fetching pending companies:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin login route - using environment variables
router.post('/login', (req, res) => {
  // Get username and password from request
  const { username, password } = req.body;
  
  console.log('Admin login attempt:', { username });
  
  // Check admin credentials from environment variables
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  // Log environment variable status (without exposing actual values)
  console.log('Using environment variables for admin auth:', {
    usernameFromEnv: !!process.env.ADMIN_USERNAME,
    passwordFromEnv: !!process.env.ADMIN_PASSWORD
  });
  
  if (username === adminUsername && password === adminPassword) {
    // Create JWT token
    const token = jwt.sign(
      { user: { role: 'admin' } },
      process.env.JWT_SECRET || 'adminsecretkey',
      { expiresIn: '1h' }
    );
    
    console.log('Admin login successful');
    res.json({ message: 'Login successful', token });
  } else {
    console.log('Admin login failed: Invalid credentials');
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

// Approve company route
router.post('/approve-company/:id', async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    res.json({ message: 'Company approved successfully' });
  } catch (error) {
    console.error('Error approving company:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Deny company route
router.post('/deny-company/:id', async (req, res) => {
  try {
    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: 'Company denied and removed' });
  } catch (error) {
    console.error('Error denying company:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
