require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Ensure this middleware is present

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

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Add error handler middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});