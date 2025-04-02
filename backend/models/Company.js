const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const companySchema = new mongoose.Schema({
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
  password: { type: String, required: true },
  approved: { type: Boolean, default: false }
}, { toJSON: { getters: true } });

// Pre-save hook to hash password before saving
companySchema.pre('save', async function(next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) return next();
  
  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
companySchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

const Company = mongoose.model('Company', companySchema);
module.exports = Company;
