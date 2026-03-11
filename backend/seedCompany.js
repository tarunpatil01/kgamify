const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const createVerifiedCompany = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Import the Company model AFTER connection
    const Company = require('./models/Company');

    const email = 'yugalsalunke.ys@gmail.com';
    const plainPassword = 'Test@123';

    // Check if company exists
    let company = await Company.findOne({ email });

    if (company) {
      console.log('⚠️  Company already exists. Updating password and verification status...');
      
      // Manually hash the password to avoid double hashing
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(plainPassword, salt);
      
      // Update directly in database to avoid model hooks
      await Company.updateOne(
        { email },
        {
          $set: {
            password: hashedPassword,
            emailVerified: true,
            approved: true,
            status: 'approved'
          },
          $unset: {
            emailVerificationCode: '',
            emailVerificationExpiry: '',
            otpCode: '',
            otpExpiry: ''
          }
        }
      );
      
      console.log('✅ Company updated successfully!');
    } else {
      console.log('Creating new verified company...');
      
      // Create new company - let the model's pre-save hook hash the password
      company = new Company({
        companyName: 'Test Company',
        email: email,
        phone: '1234567890',
        password: plainPassword, // Will be hashed by pre-save hook
        Username: 'testcompany-' + Math.random().toString(36).slice(2, 6),
        yearEstablished: new Date().getFullYear().toString(),
        type: 'Technology',
        description: 'Test company for development',
        approved: true,
        status: 'approved',
        profileCompleted: true,
        subscriptionPlan: 'free',
        subscriptionStatus: 'active',
        emailVerified: true
      });

      await company.save();
      console.log('✅ New company created successfully!');
    }

    // Verify the password works
    const testCompany = await Company.findOne({ email });
    const isMatch = await testCompany.comparePassword(plainPassword);
    
    if (isMatch) {
      console.log('✅ Password verification successful!');
    } else {
      console.log('❌ WARNING: Password verification failed!');
    }

    console.log('\n📧 Login credentials:');
    console.log('Email: yugalsalunke.ys@gmail.com');
    console.log('Password: Test@123');
    console.log('\n🚀 You can now login at http://localhost:3000');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

createVerifiedCompany();




