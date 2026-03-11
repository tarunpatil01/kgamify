/**
 * Job Description Verifier
 * Validates job postings against quality rules
 */

const { jdRules } = require('./jdRules.cjs');

/**
 * Verify a job description against quality rules
 * @param {string} text - Job description text
 * @returns {object} Verification result
 */
function verifyJD(text) {
  const issues = [];
  const suggestions = [];
  let score = 100;

  if (!text || typeof text !== 'string') {
    return {
      isValid: false,
      score: 0,
      issues: ['Job description is required'],
      suggestions: ['Please provide a job description']
    };
  }

  const trimmedText = text.trim();
  const wordCount = trimmedText.split(/\s+/).length;
  const charCount = trimmedText.length;

  // Rule 1: Minimum length check
  if (charCount < jdRules.minLength) {
    issues.push(`Job description is too short (${charCount} characters). Minimum: ${jdRules.minLength}`);
    suggestions.push('Provide more details about the role, responsibilities, and requirements');
    score -= 20;
  }

  // Rule 2: Maximum length check
  if (charCount > jdRules.maxLength) {
    issues.push(`Job description is too long (${charCount} characters). Maximum: ${jdRules.maxLength}`);
    suggestions.push('Keep the description concise and focused on key points');
    score -= 10;
  }

  // Rule 3: Word count check
  if (wordCount < jdRules.minWords) {
    issues.push(`Too few words (${wordCount} words). Minimum: ${jdRules.minWords}`);
    suggestions.push('Add more information about responsibilities and qualifications');
    score -= 15;
  }

  // Rule 4: Check for required keywords
  const missingKeywords = [];
  jdRules.requiredKeywords.forEach(keyword => {
    if (!trimmedText.toLowerCase().includes(keyword.toLowerCase())) {
      missingKeywords.push(keyword);
    }
  });

  if (missingKeywords.length > 0) {
    issues.push(`Missing important keywords: ${missingKeywords.join(', ')}`);
    suggestions.push(`Consider including: ${missingKeywords.join(', ')}`);
    score -= (missingKeywords.length * 5);
  }

  // Rule 5: Check for prohibited content
  const foundProhibited = [];
  jdRules.prohibitedWords.forEach(word => {
    if (trimmedText.toLowerCase().includes(word.toLowerCase())) {
      foundProhibited.push(word);
    }
  });

  if (foundProhibited.length > 0) {
    issues.push(`Contains prohibited language: ${foundProhibited.join(', ')}`);
    suggestions.push('Remove discriminatory or inappropriate language');
    score -= (foundProhibited.length * 15);
  }

  // Rule 6: Check for proper formatting
  if (!trimmedText.includes('\n') && charCount > 200) {
    issues.push('No paragraph breaks found');
    suggestions.push('Break the description into clear sections (responsibilities, requirements, etc.)');
    score -= 5;
  }

  // Rule 7: Check for contact information (should not be in JD)
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phonePattern = /\d{3}[-.]?\d{3}[-.]?\d{4}/;
  
  if (emailPattern.test(trimmedText) || phonePattern.test(trimmedText)) {
    issues.push('Job description should not contain contact information');
    suggestions.push('Remove email addresses and phone numbers from the description');
    score -= 10;
  }

  // Rule 8: Check for excessive punctuation
  const exclamationCount = (trimmedText.match(/!/g) || []).length;
  if (exclamationCount > 3) {
    issues.push('Too many exclamation marks');
    suggestions.push('Use professional tone with minimal exclamation marks');
    score -= 5;
  }

  // Rule 9: Check for ALL CAPS (screaming)
  const capsWords = trimmedText.match(/\b[A-Z]{4,}\b/g);
  if (capsWords && capsWords.length > 3) {
    issues.push('Excessive use of all-caps words');
    suggestions.push('Use sentence case instead of all caps for emphasis');
    score -= 5;
  }

  // Rule 10: Check for professional language
  const unprofessionalWords = ['ninja', 'rockstar', 'guru', 'wizard'];
  const foundUnprofessional = [];
  unprofessionalWords.forEach(word => {
    if (trimmedText.toLowerCase().includes(word)) {
      foundUnprofessional.push(word);
    }
  });

  if (foundUnprofessional.length > 0) {
    suggestions.push(`Consider replacing informal terms: ${foundUnprofessional.join(', ')}`);
    score -= 3;
  }

  // Ensure score doesn't go below 0
  score = Math.max(0, score);

  // Determine if valid (score >= 70)
  const isValid = score >= 70;

  return {
    isValid,
    score,
    issues,
    suggestions,
    stats: {
      characters: charCount,
      words: wordCount,
      paragraphs: trimmedText.split('\n\n').length
    }
  };
}

module.exports = { verifyJD };
