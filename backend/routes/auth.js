const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Company = require('../models/Company');

// Basic authentication route - can be extended with actual authentication
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Simple password check (in production, use bcrypt)
    if (password !== company.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = jwt.sign({ user: { id: company._id, email: company.email } }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    
    res.json({ token, company });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
