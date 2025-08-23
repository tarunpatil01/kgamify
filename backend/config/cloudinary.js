const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage with improved document handling
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'kgamify',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    resource_type: 'auto', // Auto-detect file type
    // Make sure documents are publicly accessible
    access_mode: 'public',
    // Add unique identifier to prevent name conflicts
    public_id: (req, file) => `${Date.now()}-${file.originalname.split('.')[0]}`
  }
});

// Create multer upload middleware with size limits
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

module.exports = {
  cloudinary,
  upload
};
