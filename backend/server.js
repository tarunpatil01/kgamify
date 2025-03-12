require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
require('./config/passport'); // Import passport configuration

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Ensure this middleware is present
app.use(session({ secret: 'your-secret-key', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

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

// Google OAuth strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/api/auth/callback/google',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let company = await Company.findOne({ googleId: profile.id });
        if (!company) {
          company = new Company({
            googleId: profile.id,
            email: profile.emails[0].value,
            companyName: profile.displayName,
            // Add other fields as necessary
          });
          await company.save();
        }
        return done(null, company);
      } catch (err) {
        return done(err, false);
      }
    }
  )
);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/companies', require('./routes/company')); // Ensure this route is used
app.use('/api/application', require('./routes/application'));
app.use('/api/job', require('./routes/job')); // Use job routes
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes); // Use admin routes

// Google OAuth login route
app.get(
  '/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback route
app.get(
  '/auth/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const { profile } = req.user;
    // Redirect to Google registration with profile data
    res.redirect(`/google-register?googleId=${profile.id}&email=${profile.emails[0].value}`);
  }
);

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