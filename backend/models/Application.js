// filepath: /backend/models/Application.js
const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  CompanyName: { type: String, required: true },
  applicantName: { type: String, required: true },
  resume: { type: String },
  testScore: { type: String },
  skills: { type: [String] },
});

module.exports = mongoose.model('Application', applicationSchema);