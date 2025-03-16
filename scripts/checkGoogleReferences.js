const fs = require('fs');
const path = require('path');

// Directories to check
const directories = [
  path.join(__dirname, '..', 'src'),
];

// Files to skip
const skipFiles = [
  'GoogleCallback.jsx',
  'GoogleRegister.jsx',
  'config.js'
];

// Terms to search for
const googleTerms = [
  'GoogleStrategy',
  'GoogleCompany',
  'google',
  'registerGoogleCompany',
  '/auth/google',
  '/api/auth/callback/google',
];

function checkFile(filePath) {
  // Skip files in the list
  const fileName = path.basename(filePath);
  if (skipFiles.includes(fileName)) {
    return;
  }
  
  // Skip node_modules
  if (filePath.includes('node_modules')) {
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for Google terms
    let foundTerms = [];
    googleTerms.forEach(term => {
      if (content.includes(term)) {
        foundTerms.push(term);
      }
    });
    
    if (foundTerms.length > 0) {
      console.log(`Found Google references in: ${filePath}`);
      foundTerms.forEach(term => {
        console.log(`  - ${term}`);
      });
    }
  } catch (err) {
    console.error(`Error reading ${filePath}: ${err.message}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (stat.isFile() && 
              (filePath.endsWith('.js') || 
               filePath.endsWith('.jsx') || 
               filePath.endsWith('.ts') || 
               filePath.endsWith('.tsx'))) {
      checkFile(filePath);
    }
  });
}

// Run the check
console.log('Checking for Google references...');
directories.forEach(dir => {
  walkDir(dir);
});
console.log('Check complete');
