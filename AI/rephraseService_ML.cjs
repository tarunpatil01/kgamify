/**
 * Text Rephrasing Service with ML Integration
 * Primary: ML Server (fast, models stay loaded)
 * Fallback: Rule-based system
 */

const axios = require('axios');

const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://localhost:5001';

/**
 * Rephrase text using ML server
 * @param {string} text - Input text to rephrase
 * @returns {Promise<string>} Rephrased text
 */
async function rephraseJD(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  try {
    // Try ML server first (fast!)
    const response = await axios.post(
      `${ML_SERVER_URL}/rephrase`,
      { text },
      { timeout: 10000 }
    );
    
    if (response.data && response.data.rephrased) {
      console.log('✅ Used ML rephrasing');
      return response.data.rephrased;
    }
    
    // Fallback to rule-based
    console.log('⚠️  ML returned empty, using rule-based fallback');
    return rephraseRuleBased(text);
    
  } catch (error) {
    // If ML server fails, use rule-based fallback
    console.error('❌ ML rephrasing failed:', error.message);
    console.log('⚠️  Using rule-based fallback');
    return rephraseRuleBased(text);
  }
}

/**
 * Rule-based rephrasing (fallback)
 * @param {string} text - Input text
 * @returns {string} Rephrased text
 */
function rephraseRuleBased(text) {
  let rephrased = text.trim();

  // 1. Fix common spelling mistakes
  const spellingCorrections = {
    // Common spelling mistakes
    'experiance': 'experience',
    'experiances': 'experiences',
    'managment': 'management',
    'responsibilty': 'responsibility',
    'responsibilitys': 'responsibilities',
    'oppertunity': 'opportunity',
    'oppertunities': 'opportunities',
    'recieve': 'receive',
    'occured': 'occurred',
    'developement': 'development',
    'enviroment': 'environment',
    'seperate': 'separate',
    'definately': 'definitely',
    'sucessful': 'successful',
    
    // Tech terms
    'jhava': 'Java',
    'jaba': 'Java',
    'pythn': 'Python',
    'pyton': 'Python',
    'reactt': 'React',
    'raect': 'React',
    'javascrpt': 'JavaScript',
    'javasript': 'JavaScript',
    'nodjs': 'Node.js',
    'mongod': 'MongoDB',
    'mongodb': 'MongoDB',
  };

  // Apply spelling corrections (case-insensitive)
  Object.entries(spellingCorrections).forEach(([wrong, correct]) => {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    rephrased = rephrased.replace(regex, (match) => {
      if (match[0] === match[0].toUpperCase()) {
        return correct.charAt(0).toUpperCase() + correct.slice(1);
      }
      return correct;
    });
  });

  // 2. Replace informal phrases with formal equivalents
  const informalToFormal = {
    "can't": "cannot",
    "won't": "will not",
    "don't": "do not",
    "doesn't": "does not",
    "isn't": "is not",
    "we're": "we are",
    "you're": "you are",
    "they're": "they are",
    "it's": "it is",
    
    'a lot of': 'many',
    'really good': 'excellent',
    'very good': 'excellent',
    'make sure': 'ensure',
    'work on': 'address',
    'ASAP': 'as soon as possible',
    'rockstar': 'exceptional professional',
    'ninja': 'expert',
  };

  Object.entries(informalToFormal).forEach(([informal, formal]) => {
    const regex = new RegExp(`\\b${informal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    rephrased = rephrased.replace(regex, formal);
  });

  // 3. Fix grammar issues
  rephrased = rephrased.replace(/\s{2,}/g, ' ');
  rephrased = rephrased.replace(/\s+([.,!?;:])/g, '$1');
  rephrased = rephrased.replace(/([.,!?;:])([A-Za-z])/g, '$1 $2');

  // 4. Capitalize sentences
  rephrased = rephrased.replace(/(^\w|[.!?]\s+\w)/g, match => match.toUpperCase());

  // 5. Add period at end if missing
  if (!/[.!?]$/.test(rephrased.trim())) {
    rephrased = rephrased.trim() + '.';
  }

  // 6. Professional tone adjustments
  rephrased = rephrased.replace(/\byou will\b/gi, 'the successful candidate will');
  rephrased = rephrased.replace(/\byou must\b/gi, 'candidates must');

  return rephrased;
}

/**
 * Check text for issues without rephrasing
 * @param {string} text - Input text
 * @returns {Array} Array of issues found
 */
function checkIssues(text) {
  const issues = [];
  
  if (!text || typeof text !== 'string') {
    return issues;
  }

  // Check for spelling errors
  const spellingErrors = ['experiance', 'managment', 'jhava', 'pythn'];
  
  spellingErrors.forEach(error => {
    const regex = new RegExp(`\\b${error}\\b`, 'gi');
    if (regex.test(text)) {
      issues.push({
        type: 'spelling',
        word: error,
        message: `Possible spelling error: "${error}"`
      });
    }
  });

  // Check for grammar issues
  if (text.includes('  ')) {
    issues.push({
      type: 'grammar',
      message: 'Multiple spaces detected'
    });
  }

  // Check for informal language
  const informalWords = ["can't", "won't", "ASAP", 'rockstar'];
  informalWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    if (regex.test(text)) {
      issues.push({
        type: 'tone',
        word: word,
        message: `Informal language detected: "${word}"`
      });
    }
  });

  return issues;
}

module.exports = { 
  rephraseJD,
  checkIssues
};
