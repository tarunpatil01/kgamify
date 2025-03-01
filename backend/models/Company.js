// filepath: /backend/models/Company.js
const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  logo: { type: String },
  website: { type: String },
  industry: { type: String, required: true },
  type: { type: String },
  size: { type: String },
  contactName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  address: { type: String },
  registrationNumber: { type: String, required: true, unique: true },
  yearEstablished: { type: Number },
  documents: { type: String },
  description: { type: String },
  socialMediaLinks: { type: String },
  password: { type: String, required: true },
});

module.exports = mongoose.model('Company', companySchema);