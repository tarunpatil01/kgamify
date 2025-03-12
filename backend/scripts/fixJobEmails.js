require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../models/Job');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected, fixing jobs with missing companyEmail...');
    
    // Get the email to set (from command line argument or default)
    const emailToSet = process.argv[2] || 'kishanpatil123@gmail.com';
    
    try {
      // Find jobs missing companyEmail or with empty companyEmail
      const jobsToFix = await Job.find({
        $or: [
          { companyEmail: { $exists: false } },
          { companyEmail: null },
          { companyEmail: "" }
        ]
      });
      
      console.log(`Found ${jobsToFix.length} jobs with missing companyEmail`);
      
      // Update all jobs to set companyEmail
      if (jobsToFix.length > 0) {
        const result = await Job.updateMany(
          {
            $or: [
              { companyEmail: { $exists: false } },
              { companyEmail: null },
              { companyEmail: "" }
            ]
          },
          { $set: { companyEmail: emailToSet } }
        );
        
        console.log(`Updated ${result.modifiedCount} jobs with email: ${emailToSet}`);
      }
      
      console.log('Job fix completed successfully');
    } catch (error) {
      console.error('Error fixing jobs:', error);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
