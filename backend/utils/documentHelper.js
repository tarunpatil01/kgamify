/**
 * Utilities to help with document handling for Cloudinary
 */

/**
 * Extracts the proper Cloudinary public_id from a document URL or path
 * @param {string} documentPath - The path or URL to the document
 * @returns {string} The Cloudinary public_id
 */
const extractPublicId = (documentPath) => {
  if (!documentPath) return null;
  
  // Handle cases where the full URL is stored
  if (documentPath.includes('cloudinary.com')) {
    // Extract the path after the last /
    const parts = documentPath.split('/');
    // Get the filename without extension
    return `kgamify/${  parts[parts.length - 1].split('.')[0]}`;
  }
  
  // Handle cases where only the path is stored
  return documentPath.startsWith('kgamify/') 
    ? documentPath 
    : `kgamify/${  documentPath}`;
};

/**
 * Creates a properly formatted Cloudinary URL for a document
 * @param {string} documentPath - The path or partial URL to the document
 * @returns {string} The complete, accessible Cloudinary URL
 */
const getDocumentUrl = (documentPath) => {
  if (!documentPath) return null;
  
  // If it's already a complete URL, return it
  if (documentPath.startsWith('http')) {
    return documentPath;
  }
  
  // Check if the path already contains 'image/upload'
  if (documentPath.includes('image/upload')) {
    // Convert to 'raw/upload' for proper document handling
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const pathParts = documentPath.split('image/upload/');
    if (pathParts.length > 1) {
      return `https://res.cloudinary.com/${cloudName}/raw/upload/${pathParts[1]}`;
    }
  }
  
  // Otherwise construct the URL from the path
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  
  // Since we're dealing with documents, ensure we use raw/upload for PDFs and other documents
  // This allows proper downloading rather than attempting to display as an image
  const resourceType = documentPath.endsWith('.pdf') || 
                      documentPath.endsWith('.doc') || 
                      documentPath.endsWith('.docx') ? 
                      'raw' : 'image';
                      
  return `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/${documentPath}`;
};

/**
 * Creates a Cloudinary URL specifically for downloading a document
 * @param {string} documentPath - The path or partial URL to the document
 * @param {string} fileName - Optional filename for the downloaded file
 * @returns {string} The Cloudinary download URL
 */
const getDocumentDownloadUrl = (documentPath, fileName) => {
  if (!documentPath) return null;
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  
  // First, ensure we're working with a clean base path
  let basePath = documentPath;
  if (documentPath.includes('cloudinary.com')) {
    // Extract just the file part from a full URL
    const urlParts = documentPath.split('/');
    const fileNameWithVersion = urlParts.slice(-2).join('/');
    basePath = fileNameWithVersion;
  }
  
  // Extract version and file components if they exist
  let version = '';
  let file = basePath;
  
  if (basePath.includes('v')) {
    const parts = basePath.split('/');
    if (parts.length > 1 && parts[0].startsWith('v')) {
      version = `${parts[0]  }/`;
      file = parts[1];
    }
  }
  
  // Determine if this is likely a PDF or document
  const isPdf = file.toLowerCase().endsWith('.pdf') || 
               documentPath.toLowerCase().includes('.pdf') ||
               documentPath.toLowerCase().includes('application/pdf');
               
  const isDocument = isPdf || 
                    file.toLowerCase().endsWith('.doc') || 
                    file.toLowerCase().endsWith('.docx') ||
                    file.toLowerCase().endsWith('.xlsx') ||
                    file.toLowerCase().endsWith('.xls');

  // Build a download URL that works well across browsers
  // Use the 'attachment' flag to force download
  
  // For PDFs and documents, we'll use the 'raw' resource type
  // For other files, use 'image' resource type
  const resourceType = isDocument ? 'raw' : 'image';
  
  // With fl_attachment, the browser will download instead of trying to open
  let downloadUrl = `https://res.cloudinary.com/${cloudName}/${resourceType}/upload/fl_attachment/${version}${file}`;
  
  // Add custom filename if provided
  if (fileName) {
    downloadUrl += `?filename=${encodeURIComponent(fileName)}`;
  }
  
  // Generated download URL for document
  return downloadUrl;
};

module.exports = {
  extractPublicId,
  getDocumentUrl,
  getDocumentDownloadUrl
};
