const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// Configure CORS with specific origins
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://kgamify-job-portal.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean); // Filter out undefined values

// CORS origins configured for production

// Apply CORS middleware before defining routes
app.use(cors({
  origin (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests, or same-origin)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Origin not allowed by CORS policy
      // Still allowing all origins in development for easier debugging
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'x-auth-token', 'company-email', 'x-request-id', 'X-Request-ID', 'X-Client-Version', 'X-Client-Platform']
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Increase JSON payload size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Add a test endpoint to verify CORS is working
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working correctly',
    origin: req.headers.origin || 'No origin header' 
  });
});

// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ message: "No token provided" });

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: "Unauthorized" });
    req.user = decoded.user;
    next();
  });
}

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/companies', require('./routes/company'));
app.use('/api/application', require('./routes/application'));
app.use('/api/job', require('./routes/job'));
app.use('/api/notifications', require('./routes/notifications'));

// Admin routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin-management', require('./routes/adminManagement'));

// Protected route
app.get("/protected", verifyToken, (req, res) => {
  res.json({ message: "You are authorized", user: req.user });
});

// Add header debug endpoint to check if CORS headers are being applied
app.get('/api/debug/headers', (req, res) => {
  res.json({
    headers: req.headers,
    origin: req.headers.origin,
    corsEnabled: true
  });
});

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  // CORS configuration complete
});

// Add error handler middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});