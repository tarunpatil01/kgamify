const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const { adminAuth, superAdminAuth } = require('../middleware/auth');

// Get all admins (super_admin only)
router.get('/', adminAuth, superAdminAuth, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password');
    res.json(admins);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new admin (super_admin only)
router.post('/', adminAuth, superAdminAuth, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    // Check if admin already exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: 'Admin already exists with that email' });
    }
    
    // Create new admin
    const admin = new Admin({
      email,
      password,
      firstName,
      lastName,
      role: role || 'admin' // Default to 'admin' if not specified
    });
    
    await admin.save();
    
    res.status(201).json({
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update admin (super_admin for all, or self for admins)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, password, active, role } = req.body;
    
    // Check if admin is updating themselves or is a super_admin
    const isSelf = req.admin._id.toString() === id;
    const isSuperAdmin = req.admin.role === 'super_admin';
    
    if (!isSelf && !isSuperAdmin) {
      return res.status(403).json({ message: 'Not authorized to update other admins' });
    }
    
    // Find admin to update
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    // Update fields
    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (password) admin.password = password; // Will be hashed by pre-save hook
    
    // Only super_admin can update these fields
    if (isSuperAdmin) {
      if (active !== undefined) admin.active = active;
      if (role) admin.role = role;
    }
    
    await admin.save();
    
    res.json({
      message: 'Admin updated successfully',
      admin: {
        id: admin._id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        active: admin.active
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete admin (super_admin only)
router.delete('/:id', adminAuth, superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent self-deletion
    if (req.admin._id.toString() === id) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }
    
    const admin = await Admin.findByIdAndDelete(id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password (self)
router.post('/change-password', adminAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get admin with password
    const admin = await Admin.findById(req.admin._id);
    
    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    
    // Set new password
    admin.password = newPassword;
    await admin.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
