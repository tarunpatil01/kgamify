require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/kgamify')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Create initial admin if none exists
async function createInitialAdmin() {
  try {
    // Check if any admin exists
    const adminExists = await Admin.findOne({});
    
    if (adminExists) {
      console.log('Admin account already exists');
      return mongoose.disconnect();
    }
    
    // Create super admin
    const admin = new Admin({
      email: process.env.INITIAL_ADMIN_EMAIL || 'admin@kgamify.com',
      password: process.env.INITIAL_ADMIN_PASSWORD || 'changeme!ASAP123',
      firstName: 'System',
      lastName: 'Admin',
      role: 'super_admin'
    });
    
    await admin.save();
    console.log('Initial admin account created successfully');
    console.log('Email:', admin.email);
    console.log('Please change the default password immediately after first login');
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error creating admin:', error);
    mongoose.disconnect();
    process.exit(1);
  }
}

createInitialAdmin();
