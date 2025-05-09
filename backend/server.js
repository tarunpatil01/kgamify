require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 5000;

// CORS configuration - explicitly set all allowed origins
const allowedOrigins = [
  'http://localhost:3000', 
  'http://localhost:5173',
  'https://kgamify-job-portal.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean); // Remove any undefined values

// More robust CORS configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', true);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Standard CORS middleware as backup
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Increase JSON payload size limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

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
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

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