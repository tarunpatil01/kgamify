const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
  // Made optional to support minimal registration; complete later in profile
  contactName: { type: String },
  email: { type: String, required: true, unique: true },
  // Made optional to support minimal registration; complete later in profile
  phone: { type: String },
  address: { type: String },
  // Optional government/company registration number; must be unique when provided
  registrationNumber: { type: String, default: undefined },
  Username: { type: String, required: true, unique: true },
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
  // Account lifecycle status
  status: { type: String, enum: ['pending', 'approved', 'hold', 'denied'], default: 'pending' },
  // Messages from admin to the company (e.g., hold/deny reasons)
  adminMessages: [
    {
      type: { type: String, enum: ['info', 'hold', 'deny', 'system'], default: 'info' },
      message: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  // Track whether the company has filled the full profile details
  profileCompleted: { type: Boolean, default: false },
  
  // Add fields for password reset functionality
  resetToken: String,
  resetTokenExpiry: Date,

  // OTP for forgot password (email-based)
  otpCode: String,
  otpExpiry: Date,
}, { toJSON: { getters: true } });

// Ensure uniqueness of registrationNumber only when it exists (string values)
// Prevents duplicate-key errors for null/undefined values created by a non-partial unique index
companySchema.index(
  { registrationNumber: 1 },
  { unique: true, partialFilterExpression: { registrationNumber: { $exists: true, $type: 'string' } } }
);

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
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Company', companySchema);
