const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Middleware to verify admin token
exports.adminAuth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    
    // Check if no token
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'temporarysecret');
    
    // Check if admin exists and is active
    const admin = await Admin.findById(decoded.admin.id).select('-password');
    if (!admin || !admin.active) {
      return res.status(401).json({ message: 'Token is not valid or account is inactive' });
    }
    
    // Set admin in request
    req.admin = admin;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Additional middleware for super_admin only routes
exports.superAdminAuth = (req, res, next) => {
  if (req.admin && req.admin.role === 'super_admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied. Super Admin privileges required' });
  }
};

// Middleware for role-based access control
exports.checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    if (roles.includes(req.admin.role)) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Insufficient permissions' });
    }
  };
};
