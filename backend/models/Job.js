const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  companyEmail: { type: String, required: true },
  jobTitle: { type: String, required: true },
  jobDescription: { type: String, required: true },
  employmentType: { type: String, required: true },
  experienceLevel: { type: String, required: true },
  remoteOrOnsite: { type: String, required: true },
  location: { type: String, required: true },
  salary: { type: String, required: true },
  equity: { type: String },
  sponsorship: { type: String },
  recruitmentProcess: { type: String },
  responsibilities: { type: String },
  skills: { type: String },
  benefits: { type: String },
  eligibility: { type: String },
  companyDescription: { type: String },
  additionalInformation: { type: String },
  status: { type: String, default: 'active' },
  numberOfPositions: { type: String },
  category: { type: String },
  tags: { type: String },
  postedAt: { type: Date, default: Date.now },
  applicants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Application' 
  }]
}, { timestamps: true });

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;