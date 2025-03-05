const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const Company = require('../models/Company');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback'
},
async (token, tokenSecret, profile, done) => {
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
}));

passport.serializeUser((company, done) => {
  done(null, company.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const company = await Company.findById(id);
    done(null, company);
  } catch (err) {
    done(err, false);
  }
});
