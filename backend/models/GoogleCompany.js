const mongoose = require('mongoose');

const googleCompanySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  logo: {
    type: String, // Now storing Cloudinary URL
    required: false
  },
  website: { type: String },
  industry: { type: String },
  type: { type: String, required: true },
  size: { type: String },
  contactName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  registrationNumber: { type: String, required: true },
  yearEstablished: { type: String, required: true },
  documents: {
    type: String, // Now storing Cloudinary URL
    required: false
  },
  description: { type: String },
  socialMediaLinks: { type: String },
  googleId: { type: String, required: true }, // Google unique identifier
  approved: { type: Boolean, default: false }
}, { toJSON: { getters: true } });

const GoogleCompany = mongoose.model('GoogleCompany', googleCompanySchema);
module.exports = GoogleCompany;
