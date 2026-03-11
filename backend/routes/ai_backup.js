const express = require('express');
const router = express.Router();
const path = require('path');

// Import AI services
const { jdRules } = require(path.join(__dirname, '../../AI/jdRules.cjs'));
const { verifyJD } = require(path.join(__dirname, '../../AI/jdVerifier.cjs'));
const { rephraseJD } = require(path.join(__dirname, '../../AI/rephraseService_ML.cjs'));
const { getSuggestionsML, testPythonML } = require(path.join(__dirname, '../../AI/pythonMLService.cjs'));

const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://localhost:5001';

// Test ML availability on startup
let mlAvailable = false;
testPythonML().then(available => {
  mlAvailable = available;
  if (available) {
    console.log('✅ Python ML models available');
  } else {
    console.log('⚠️  Python ML not available, using rule-based fallback');
  }
});

// ==================== HEALTH CHECK ====================
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mlAvailable,
    timestamp: new Date().toISOString()
  });
});

// ==================== JOB DESCRIPTION VERIFICATION ====================
router.post('/verify-jd', async (req, res) => {
  try {
    const { jobTitle, description, requirements, responsibilities, location, salary } = req.body;

    if (!jobTitle || !description) {
      return res.status(400).json({
        success: false,
        error: 'Job title and description are required'
      });
    }

    const jobData = {
      jobTitle,
      description,
      requirements: requirements || '',
      responsibilities: responsibilities || '',
      location: location || '',
      salary: salary || ''
    };

    const verification = verifyJD(jobData);

    return res.json({
      success: true,
      isValid: verification.isValid,
      score: verification.score,
      issues: verification.issues,
      suggestions: verification.suggestions,
      message: verification.isValid
        ? 'Job description looks good!'
        : 'Please address the issues before posting'
    });

  } catch (error) {
    console.error('JD Verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify job description',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== REAL-TIME SUGGESTIONS (ML-Powered) ====================
router.post('/suggest', async (req, res) => {
  try {
    const { text, field } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    // Use ML-powered suggestions if available
    if (mlAvailable) {
      try {
        const mlSuggestions = await getSuggestionsML(text);

        if (mlSuggestions.success) {
          return res.json(mlSuggestions);
        }
      } catch (mlError) {
        console.error('ML suggestions failed, using fallback:', mlError);
      }
    }

    // Fallback to rule-based suggestions
    const suggestions = [];

    const grammarIssues = checkGrammar(text);
    suggestions.push(...grammarIssues);

    const spellingIssues = checkSpelling(text);
    suggestions.push(...spellingIssues);

    if (field) {
      const fieldSpecificIssues = checkFieldRules(text, field);
      suggestions.push(...fieldSpecificIssues);
    }

    return res.json({
      success: true,
      suggestions,
      hasIssues: suggestions.length > 0,
      issueCount: suggestions.length,
      usingML: false
    });

  } catch (error) {
    console.error('Suggestion error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate suggestions',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== REPHRASE TO FORMAL (ML-Powered) ====================
router.post('/rephrase', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    console.log(`✨ Rephrase-to-formal request (ML available: ${mlAvailable})`);

    // Try ML Server first
    if (mlAvailable) {
      try {
        const axios = require('axios');
        const mlResponse = await axios.post(
          `${ML_SERVER_URL}/rephrase`,
          { text },
          { timeout: 30000 }
        );
        if (mlResponse.data && mlResponse.data.rephrased) {
          console.log('✅ Rephrased via ML Server');
          return res.json({
            success: true,
            original: text,
            rephrased: mlResponse.data.rephrased,
            changes: mlResponse.data.changes || [],
            improvements: {
              grammarFixed: true,
              spellingCorrected: true,
              toneAdjusted: 'formal',
              mlPowered: true
            }
          });
        }
      } catch (mlErr) {
        console.log('⚠️  ML Server rephrase failed, using service fallback:', mlErr.message);
      }
    }

    // Fallback to rephraseJD service
    const rephrasedText = await rephraseJD(text);

    return res.json({
      success: true,
      original: text,
      rephrased: rephrasedText,
      improvements: {
        grammarFixed: true,
        spellingCorrected: true,
        toneAdjusted: 'formal',
        mlPowered: mlAvailable
      }
    });

  } catch (error) {
    console.error('Rephrase error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to rephrase text',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== SPELL CORRECT ONLY ====================
router.post('/spell-correct', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'Text is required'
      });
    }

    console.log(`🔤 Spell-correct request (ML available: ${mlAvailable})`);

    // Try ML Server first
    if (mlAvailable) {
      try {
        const axios = require('axios');
        const mlResponse = await axios.post(
          `${ML_SERVER_URL}/spell-correct`,
          { text },
          { timeout: 15000 }
        );
        if (mlResponse.data && mlResponse.data.corrected) {
          console.log('✅ Spell-corrected via ML Server');
          return res.json({
            success: true,
            original: text,
            corrected: mlResponse.data.corrected,
            changes: mlResponse.data.changes || [],
            model_used: mlResponse.data.model_used || 'ML'
          });
        }
      } catch (mlErr) {
        console.log('⚠️  ML Server spell-correct failed, using rule-based fallback:', mlErr.message);
      }
    }

    // Rule-based fallback
    const corrected = applySpellingRules(text);
    const changes = corrected !== text ? ['Spelling corrected (rules)'] : ['No changes needed'];

    return res.json({
      success: true,
      original: text,
      corrected,
      changes,
      model_used: 'rules'
    });

  } catch (error) {
    console.error('Spell-correct error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to correct spelling',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== BATCH REPHRASE ====================
router.post('/rephrase-batch', async (req, res) => {
  try {
    const { fields } = req.body;

    if (!fields || typeof fields !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Fields object is required'
      });
    }

    const rephrased = {};

    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'string' && value.trim()) {
        rephrased[key] = await rephraseJD(value);
      } else {
        rephrased[key] = value;
      }
    }

    return res.json({
      success: true,
      rephrased,
      fieldsProcessed: Object.keys(rephrased).length,
      mlPowered: mlAvailable
    });

  } catch (error) {
    console.error('Batch rephrase error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to rephrase fields',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ==================== HELPER FUNCTIONS ====================

function applySpellingRules(text) {
  const techTerms = {
    // Java
    'jhava': 'Java', 'jave': 'Java', 'jaba': 'Java',
    // Python
    'pythn': 'Python', 'pyhton': 'Python', 'pyton': 'Python', 'phyton': 'Python',
    // React
    'reactt': 'React', 'recat': 'React', 'raect': 'React',
    // Node.js
    'nodjs': 'Node.js', 'nodejs': 'Node.js',
    // Developer
    'developr': 'developer', 'devlopr': 'developer', 'develoepr': 'developer',
    'develpor': 'developer', 'devloper': 'developer', 'developpe': 'developer',
    // Engineer
    'engeneer': 'engineer', 'enginear': 'engineer', 'enginer': 'engineer',
    // Experience
    'experiance': 'experience', 'experence': 'experience', 'expereince': 'experience',
    // Development
    'developement': 'development', 'developmnet': 'development',
    // Management
    'managment': 'management', 'managemnt': 'management',
    // Architecture
    'architechture': 'architecture', 'architcture': 'architecture',
    // Communication
    'comunication': 'communication', 'communciation': 'communication',
    // Independent
    'independantly': 'independently',
    // Candidate
    'canditate': 'candidate', 'candate': 'candidate',
    // Programmer
    'programer': 'programmer', 'programmr': 'programmer',
    // Designer
    'desiner': 'designer', 'designr': 'designer',
    // Manager
    'managr': 'manager', 'managar': 'manager',
    // Other tech
    'mongodb': 'MongoDB', 'kubernetis': 'Kubernetes',
    'docekr': 'Docker', 'angualr': 'Angular',
    'djago': 'Django', 'vuejs': 'Vue.js',
    'postgre': 'PostgreSQL', 'mysqll': 'MySQL',
    'microservces': 'microservices', 'architechture': 'architecture',
    'independantly': 'independently', 'responsibilty': 'responsibility',
  };

  let result = text;
  Object.entries(techTerms).forEach(([typo, correct]) => {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      if (match === match.toUpperCase()) return correct.toUpperCase();
      if (match[0] === match[0].toUpperCase()) return correct.charAt(0).toUpperCase() + correct.slice(1);
      return correct;
    });
  });

  return result;
}

function checkGrammar(text) {
  const issues = [];

  if (text.includes('  ')) {
    issues.push({
      type: 'grammar',
      severity: 'low',
      message: 'Multiple spaces detected',
      suggestion: 'Remove extra spaces'
    });
  }

  if (text.length > 0 && text[0] !== text[0].toUpperCase()) {
    issues.push({
      type: 'grammar',
      severity: 'medium',
      message: 'Sentence should start with a capital letter',
      suggestion: 'Capitalize the first letter'
    });
  }

  return issues;
}

function checkSpelling(text) {
  const issues = [];

  const commonMisspellings = [
    { wrong: /\bexperiance\b/gi, correct: 'experience' },
    { wrong: /\bmanagment\b/gi, correct: 'management' },
    { wrong: /\bresponsibilty\b/gi, correct: 'responsibility' },
    { wrong: /\bjhava\b/gi, correct: 'Java' },
    { wrong: /\bpythn\b/gi, correct: 'Python' },
    { wrong: /\breactt\b/gi, correct: 'React' },
    { wrong: /\bdevelopr\b/gi, correct: 'developer' },
    { wrong: /\bdevlopr\b/gi, correct: 'developer' },
    { wrong: /\bengeneer\b/gi, correct: 'engineer' },
    { wrong: /\bcanditate\b/gi, correct: 'candidate' },
  ];

  commonMisspellings.forEach(({ wrong, correct }) => {
    if (wrong.test(text)) {
      issues.push({
        type: 'spelling',
        severity: 'high',
        message: `Possible misspelling detected`,
        suggestion: `Did you mean "${correct}"?`
      });
    }
  });

  return issues;
}

function checkFieldRules(text, field) {
  const issues = [];

  switch (field) {
    case 'jobTitle':
      if (text.length < 5) {
        issues.push({
          type: 'validation',
          severity: 'high',
          message: 'Job title is too short',
          suggestion: 'Provide a more descriptive job title'
        });
      }
      break;

    case 'description':
      if (text.length < 50) {
        issues.push({
          type: 'validation',
          severity: 'high',
          message: 'Job description is too short',
          suggestion: 'Provide more details about the role'
        });
      }
      break;
  }

  return issues;
}

module.exports = router;