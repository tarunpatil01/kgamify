const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Company = require('../models/Company');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// Basic authentication route - can be extended with actual authentication
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const company = await Company.findOne({ email });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    // Use the comparePassword method
    const isMatch = await company.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create JWT token
    const token = jwt.sign({ user: { id: company._id, email: company.email } }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    
    // Remove password from response
    const companySafe = company.toObject();
    delete companySafe.password;
    
    res.json({ token, company: companySafe });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Forgot Password - Generate token and send reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find company by email
    const company = await Company.findOne({ email });
    if (!company) {
      // For security reasons, don't reveal that the email doesn't exist
      return res.status(200).json({ 
        message: 'If your email is registered, you will receive a password reset link' 
      });
    }
    
    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour
    
    // Save token to company document
    company.resetToken = resetToken;
    company.resetTokenExpiry = resetTokenExpiry;
    await company.save();
    
    // In a production environment, you would send an email here
    // For our implementation, we'll return the token directly (not secure for production)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    
    console.log(`Reset link generated for ${email}: ${resetLink}`);
    
    res.status(200).json({
      message: 'Password reset link has been sent to your email',
      // Only return token in development for testing
      ...(process.env.NODE_ENV !== 'production' && { resetLink, token: resetToken })
    });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset Password - Validate token and update password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, password } = req.body;
    
    if (!token || !email || !password) {
      return res.status(400).json({ error: 'Token, email, and password are required' });
    }
    
    // Find company with matching token and email
    const company = await Company.findOne({ 
      email,
      resetToken: token,
      resetTokenExpiry: { $gt: Date.now() } // token not expired
    });
    
    if (!company) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    company.password = await bcrypt.hash(password, salt);
    
    // Clear reset token fields
    company.resetToken = undefined;
    company.resetTokenExpiry = undefined;
    
    await company.save();
    
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Error in reset password:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
