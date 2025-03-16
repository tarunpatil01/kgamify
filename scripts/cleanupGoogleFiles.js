const fs = require('fs');
const path = require('path');

// Files to delete
const filesToDelete = [
  path.join(__dirname, '..', 'backend', 'config', 'passport.js'),
  path.join(__dirname, '..', 'src', 'pages', 'GoogleRegister.jsx'),
  path.join(__dirname, '..', 'src', 'pages', 'GoogleCallback.jsx'),
  path.join(__dirname, '..', 'backend', 'models', 'GoogleCompany.js'),
  path.join(__dirname, '..', 'src', 'config.js'),
  path.join(__dirname, '..', 'backend', 'scripts', 'fixGoogleAuthCompanies.js'),
  path.join(__dirname, '..', 'backend', 'scripts', 'fixGoogleCompanies.js'),
];

// Delete the files
filesToDelete.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`Deleted: ${file}`);
    } else {
      console.log(`File not found: ${file}`);
    }
  } catch (error) {
    console.error(`Error deleting ${file}: ${error.message}`);
  }
});

console.log('Google files cleanup completed');
