/**
 * Job Description Validation Rules
 * Define quality standards for job postings
 */

const jdRules = {
  // Length requirements
  minLength: 100,        // Minimum characters
  maxLength: 5000,       // Maximum characters
  minWords: 20,          // Minimum word count
  
  // Required keywords that should appear in job descriptions
  requiredKeywords: [
    // At least one should be present
    'experience',
    'skills',
    'responsibilities',
    'requirements',
    'qualifications'
  ],
  
  // Prohibited discriminatory or inappropriate language
  prohibitedWords: [
    'young',
    'old',
    'recent graduate',
    'native speaker',
    'guys',
    'girls',
    'he/she',
    'attractive',
    'energetic appearance'
  ],
  
  // Professional requirements
  minimumParagraphs: 2,
  maximumExclamations: 3,
  
  // Quality indicators
  scoringWeights: {
    length: 20,
    keywords: 30,
    formatting: 20,
    professionalism: 30
  }
};

module.exports = { jdRules };
