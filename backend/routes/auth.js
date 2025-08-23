/* eslint-disable no-console */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Company = require('../models/Company');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../utils/emailService');

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
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// Forgot Password - Generate OTP and send via email
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
        message: 'If your email is registered, you will receive an OTP to reset your password'
      });
    }

    // Generate a 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + (10 * 60 * 1000)); // 10 minutes

    // Update using updateOne to avoid any validation edge cases on save
    try {
      await Company.updateOne(
        { _id: company._id },
        { $set: { otpCode: code, otpExpiry } },
        { runValidators: false }
      );
  } catch {
      // As a fallback, bypass Mongoose validation entirely
      await Company.collection.updateOne(
        { _id: company._id },
        { $set: { otpCode: code, otpExpiry } }
      );
    }

    // Send OTP email (do not fail the request if email sending fails)
    const emailResult = await sendEmail(
      email,
      'otp',
      { code, expiresInMinutes: 10, companyName: company.companyName, contactName: company.contactName }
    );
    if (!emailResult?.success) {
      // Log but do not disclose to client
      console.error('OTP email send failed:', emailResult?.error);
    }

    return res.status(200).json({
      message: 'If your email is registered, you will receive an OTP to reset your password'
    });
  } catch (err) {
    console.error('Forgot password error:', err?.message || err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const company = await Company.findOne({ email });
    if (!company || !company.otpCode || !company.otpExpiry) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    if (company.otpCode !== code || company.otpExpiry.getTime() < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Issue a short-lived token to allow password reset and clear OTP via atomic update
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    try {
      await Company.updateOne(
        { _id: company._id },
        { $unset: { otpCode: "", otpExpiry: "" }, $set: { resetToken, resetTokenExpiry } },
        { runValidators: false }
      );
  } catch {
      await Company.collection.updateOne(
        { _id: company._id },
        { $unset: { otpCode: "", otpExpiry: "" }, $set: { resetToken, resetTokenExpiry } }
      );
    }

    res.json({ message: 'OTP verified', token: resetToken });
  } catch (err) {
    console.error('Verify OTP error:', err?.message || err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset Password - Validate token and update password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and password are required' });
    }

    // Find company with matching token and email
    const query = email
      ? { email, resetToken: token, resetTokenExpiry: { $gt: Date.now() } }
      : { resetToken: token, resetTokenExpiry: { $gt: Date.now() } };
    const company = await Company.findOne(query);
    if (!company) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Hash new password and update atomically to avoid double hashing via pre-save
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);
    try {
      await Company.updateOne(
        { _id: company._id },
        { $set: { password: hashed }, $unset: { resetToken: "", resetTokenExpiry: "" } },
        { runValidators: false }
      );
  } catch {
      await Company.collection.updateOne(
        { _id: company._id },
        { $set: { password: hashed }, $unset: { resetToken: "", resetTokenExpiry: "" } }
      );
    }

    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err?.message || err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
