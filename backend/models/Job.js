const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
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
  status: { type: String, required: true },
  numberOfPositions: { type: Number, required: true },
  category: { type: String },
  tags: { type: String },
  applicants: { type: [{ name: String, resume: String, testScore: String, skills: [String] }], default: [] },
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;