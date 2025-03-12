require('dotenv').config();
const mongoose = require('mongoose');
const Job = require('../models/Job');
const Company = require('../models/Company');
const GoogleCompany = require('../models/GoogleCompany');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB connected, checking job records...');
    
    // Get all jobs
    const jobs = await Job.find({});
    console.log(`Total jobs: ${jobs.length}`);
    
    // Check for missing companyEmail
    const missingEmailJobs = jobs.filter(job => !job.companyEmail);
    if (missingEmailJobs.length > 0) {
      console.log(`WARNING: ${missingEmailJobs.length} jobs have no companyEmail!`);
      missingEmailJobs.forEach(job => {
        console.log(`- JobID: ${job._id}, Title: ${job.jobTitle}, CompanyName: ${job.companyName}`);
      });
    } else {
      console.log('All jobs have companyEmail field.');
    }
    
    // Get all unique company emails from jobs
    const uniqueEmails = [...new Set(jobs.map(job => job.companyEmail))];
    console.log(`Unique company emails in jobs: ${uniqueEmails.length}`);
    
    // Check which emails exist in Company and GoogleCompany collections
    for (const email of uniqueEmails) {
      const regularCompany = await Company.findOne({ email });
      const googleCompany = await GoogleCompany.findOne({ email });
      
      if (!regularCompany && !googleCompany) {
        console.log(`WARNING: Email ${email} used in jobs but not found in company collections`);
        // Show the jobs with this email
        const relatedJobs = jobs.filter(job => job.companyEmail === email);
        relatedJobs.forEach(job => {
          console.log(`- JobID: ${job._id}, Title: ${job.jobTitle}, CompanyName: ${job.companyName}`);
        });
      }
    }
    
    mongoose.disconnect();
    console.log('Check complete.');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
