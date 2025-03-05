const express = require('express');
const passport = require('passport');
const router = express.Router();

// Google OAuth login route
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'],
  callbackURL: 'http://localhost:3000/api/auth/callback/google'
}));

// Google OAuth callback route
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
  // Successful authentication, redirect to GoogleRegister page.
  res.redirect('/google-register');
});

module.exports = router;