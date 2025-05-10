const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Create a separate schema for social media links
const socialMediaLinksSchema = new mongoose.Schema({
  instagram: { type: String, default: '' },
  twitter: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  youtube: { type: String, default: '' }
}, { _id: false });

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  logo: {
    type: String, // Cloudinary URL
    required: false
  },
  website: { type: String },
  industry: { type: String },
  type: { type: String, required: true }, // Company type (e.g. Private Limited)
  size: { type: String }, // Company size (e.g. 10-50 employees)
  contactName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String },
  registrationNumber: { type: String, required: true },
  yearEstablished: { type: String, required: true },
  documents: {
    type: String, // Cloudinary URL
    required: false
  },
  description: { type: String, default: 'No description provided' },
  socialMediaLinks: {
    type: socialMediaLinksSchema,
    default: () => ({})
  },
  password: { type: String, required: true },
  approved: { type: Boolean, default: false },
  
  // Add fields for password reset functionality
  resetToken: String,
  resetTokenExpiry: Date,
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

module.exports = mongoose.model('Company', companySchema);
