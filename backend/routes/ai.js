const express = require('express');
const router = express.Router();
const path = require('path');
const axios = require('axios');

// Import AI services
const { jdRules } = require(path.join(__dirname, '../../AI/jdRules.cjs'));
const { verifyJD } = require(path.join(__dirname, '../../AI/jdVerifier.cjs'));
const { rephraseJD } = require(path.join(__dirname, '../../AI/rephraseService_ML.cjs'));
const { getSuggestionsML, testPythonML } = require(path.join(__dirname, '../../AI/pythonMLService.cjs'));
const { GoogleGenerativeAI } = require('@google/generative-ai');

const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://localhost:5001';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY is missing. Gemini features will fall back to non-Gemini logic.');
}

// Test ML availability on startup
let mlAvailable = false;
testPythonML().then(available => {
  mlAvailable = available;
  if (available) {
    console.log('✅ Python ML models available');
  } else {
    console.log('⚠️  Python ML not available, using rule-based fallback');
  }
}).catch(() => {
  console.log('⚠️  ML check failed, using rule-based fallback');
});

// ==================== HEALTH CHECK ====================
router.get('/health', (req, res) => {
  res.json({ status: 'ok', mlAvailable, timestamp: new Date().toISOString() });
});

// ==================== JOB DESCRIPTION VERIFICATION ====================
router.post('/verify-jd', async (req, res) => {
  try {
    const { jobTitle, description, requirements, responsibilities, location, salary } = req.body;

    console.log('🔍 verify-jd received:', {
      jobTitle,
      descriptionLength: description?.length,
      descriptionPreview: description?.substring(0, 100),
    });

    // Strip any residual HTML tags in case frontend didn't fully strip
    const cleanDescription = (description || '')
      .replace(/<p><br><\/p>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!jobTitle || !cleanDescription) {
      return res.status(400).json({
        success: false,
        isValid: false,
        score: 0,
        issues: ['Job description is required'],
        suggestions: ['Please provide a job description'],
        error: 'Job title and description are required'
      });
    }

    // ── Use Gemini for verification ──
    try {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const prompt = `You are a professional HR consultant reviewing a job description.

Analyze this job description and return a JSON object with your assessment.

Job Title: ${jobTitle}
Job Description: ${cleanDescription}
Requirements/Skills: ${requirements || 'Not provided'}
Responsibilities: ${responsibilities || 'Not provided'}
Location: ${location || 'Not specified'}
Salary: ${salary || 'Not specified'}

Return ONLY a raw JSON object with these exact keys (no markdown, no code fences):
{
  "score": <number 0-100>,
  "isValid": <true if score >= 60, else false>,
  "issues": [<list of specific issues found, empty array if none>],
  "suggestions": [<list of improvement suggestions, empty array if none>]
}

Scoring criteria:
- 80-100: Excellent JD with clear title, description, responsibilities, skills, location
- 60-79: Good JD but missing some details
- 40-59: Needs significant improvement
- 0-39: Major issues or too vague

Be specific in issues and suggestions. If the JD is good, return a high score with empty arrays.`;

      const result = await model.generateContent(prompt);
      const rawText = result.response.text();

      const cleaned = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      let geminiResult;
      try {
        geminiResult = JSON.parse(cleaned);
      } catch (parseErr) {
        console.error('Gemini verify parse failed, falling back to rule-based');
        throw new Error('parse_failed');
      }

      console.log('✅ Gemini verification successful, score:', geminiResult.score);
      return res.json({
        success: true,
        isValid: geminiResult.isValid ?? (geminiResult.score >= 60),
        score: geminiResult.score ?? 0,
        issues: geminiResult.issues ?? [],
        suggestions: geminiResult.suggestions ?? [],
        message: (geminiResult.score >= 60) ? 'Job description looks good!' : 'Please address the issues before posting'
      });

    } catch (geminiErr) {
      // ── Fallback to rule-based verifier if Gemini fails ──
      console.log('⚠️  Gemini verify failed, using rule-based fallback:', geminiErr.message);

      const jobData = {
        jobTitle,
        description: cleanDescription,
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
        message: verification.isValid ? 'Job description looks good!' : 'Please address the issues before posting'
      });
    }

  } catch (error) {
    console.error('JD Verification error:', error);
    return res.status(500).json({ success: false, error: 'Failed to verify job description', details: error.message });
  }
});

// ==================== REAL-TIME SUGGESTIONS ====================
router.post('/suggest', async (req, res) => {
  try {
    const { text, field } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    if (mlAvailable) {
      try {
        const mlSuggestions = await getSuggestionsML(text);
        if (mlSuggestions.success) return res.json(mlSuggestions);
      } catch (mlError) {
        console.error('ML suggestions failed, using fallback:', mlError.message);
      }
    }

    const suggestions = [
      ...checkGrammar(text),
      ...checkSpelling(text),
      ...(field ? checkFieldRules(text, field) : [])
    ];

    return res.json({
      success: true, suggestions,
      hasIssues: suggestions.length > 0,
      issueCount: suggestions.length,
      usingML: false
    });
  } catch (error) {
    console.error('Suggestion error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate suggestions', details: error.message });
  }
});

// ==================== REPHRASE TO FORMAL ====================
router.post('/rephrase', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'text is required' });
    }

    if (text.trim().length < 5) {
      return res.json({ rephrased: text });
    }

    const prompt = `You are a professional job description editor.

Fix the following job description text:
- Correct any spelling mistakes
- Fix grammar errors  
- Convert informal language to formal professional tone
- Replace casual words (e.g. "rockstar" → "exceptional professional", "can't" → "cannot", "we're" → "we are")
- Fix tech term spelling (e.g. "jhava" → "Java", "reactt" → "React", "pythn" → "Python")
- Keep ALL the original structure, sections, and bullet points EXACTLY as they are
- Do NOT remove any sections or bullet points
- Do NOT merge paragraphs or sections together
- Do NOT summarize or shorten the content
- Return the COMPLETE corrected text with the same structure

Text to fix:
${text}`;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result    = await model.generateContent(prompt);
    const rephrased = result.response.text();

    console.log('✅ Rephrase successful using Gemini');
    return res.json({ rephrased });

  } catch (error) {
    console.error('Rephrase error:', error.message);

    const { text } = req.body;
    if (text) {
      console.log('⚠️  Gemini failed, returning original text');
      return res.json({ rephrased: text });
    }

    return res.status(500).json({ error: 'Rephrase failed: ' + error.message });
  }
});

// ==================== SPELL CORRECT ONLY ====================
router.post('/spell-correct', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ success: false, error: 'Text is required and must be a non-empty string' });
    }

    const trimmed = text.trim();
    console.log(`🔤 Spell-correct request — chars: ${trimmed.length}, ML: ${mlAvailable}`);

    if (mlAvailable) {
      try {
        const axios = require('axios');
        const mlResponse = await axios.post(
          `${ML_SERVER_URL}/spell-correct`,
          { text: trimmed },
          { timeout: 15000 }
        );
        if (mlResponse.data && mlResponse.data.corrected) {
          console.log('✅ Spell-corrected via ML Server');
          return res.json({
            success: true, original: trimmed,
            corrected: mlResponse.data.corrected,
            changes: mlResponse.data.changes || [],
            model_used: mlResponse.data.model_used || 'ML'
          });
        }
      } catch (mlErr) {
        console.log('⚠️  ML Server spell-correct failed:', mlErr.message);
      }
    }

    const corrected = applySpellingRules(trimmed);
    const changes = corrected !== trimmed ? ['Spelling corrected (rules)'] : ['No changes needed'];
    console.log('✅ Spell-corrected via rule-based fallback');
    return res.json({ success: true, original: trimmed, corrected, changes, model_used: 'rules' });

  } catch (error) {
    console.error('❌ Spell-correct route crash:', error);
    return res.status(500).json({ success: false, error: 'Failed to correct spelling', details: error.message });
  }
});

// ==================== BATCH REPHRASE ====================
router.post('/rephrase-batch', async (req, res) => {
  try {
    const { fields } = req.body;

    if (!fields || typeof fields !== 'object') {
      return res.status(400).json({ success: false, error: 'Fields object is required' });
    }

    const rephrased = {};

    for (const [key, value] of Object.entries(fields)) {
      if (typeof value === 'string' && value.trim()) {
        try {
          const raw = await rephraseJD(value.trim());
          rephrased[key] = typeof raw === 'string' ? raw : value;
        } catch (e) {
          console.log(`⚠️  Batch rephrase failed for "${key}":`, e.message);
          rephrased[key] = applySpellingRules(value);
        }
      } else {
        rephrased[key] = value;
      }
    }

    return res.json({
      success: true, rephrased,
      fieldsProcessed: Object.keys(rephrased).length,
      mlPowered: mlAvailable
    });
  } catch (error) {
    console.error('Batch rephrase error:', error);
    return res.status(500).json({ success: false, error: 'Failed to rephrase fields', details: error.message });
  }
});

// ==================== GENERATE JD ====================
router.post('/generate-jd', async (req, res) => {
  try {
    const { prompt, jobTitle, skills } = req.body;

    if (!prompt && !jobTitle) {
      return res.status(400).json({ error: 'prompt or jobTitle is required' });
    }

    const skillsLine = skills && skills.trim()
      ? `\nRequired skills to include: ${skills.trim()}`
      : '';

    const finalPrompt = `${prompt || `Write a professional job description for "${jobTitle}"`}${skillsLine}

Return a JSON object with EXACTLY these 7 keys. Every value must be a plain string only — no arrays, no nested objects:

{
  "jobDescription": "2-3 sentence summary of the role",
  "responsibilities": "* First responsibility\n* Second responsibility\n* Third responsibility\n* Fourth responsibility\n* Fifth responsibility",
  "skills": "* First required skill\n* Second required skill\n* Third required skill\n* Fourth required skill",
  "eligibility": "* Education requirement\n* Experience requirement\n* Other eligibility criteria",
  "benefits": "* First benefit\n* Second benefit\n* Third benefit\n* Fourth benefit",
  "recruitmentProcess": "* Step 1\n* Step 2\n* Step 3\n* Step 4",
  "relocationBenefits": "One or two sentences about relocation support, or empty string if not applicable"
}

STRICT RULES:
- Every value must be a plain STRING — never an array, never a nested object
- Bullet points must use * at the start of each line
- Separate bullet points with \\n
- Use formal professional language
- Do NOT include salary figures
- Do NOT use placeholder text like [Company Name] or [Country]
- Return ONLY the raw JSON, no markdown, no code fences`;

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result  = await model.generateContent(finalPrompt);
    const rawText = result.response.text();

    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let sections;
    try {
      sections = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('JSON parse failed:', parseErr.message);
      console.error('Raw response was:', rawText.substring(0, 300));
      return res.status(500).json({ error: 'AI returned invalid format. Please try again.' });
    }

    const toPlainText = (val) => {
      if (!val) return '';
      if (typeof val === 'string') return val;
      if (Array.isArray(val)) {
        return val.map(item => {
          if (typeof item === 'string') return `* ${item}`;
          if (typeof item === 'object') return Object.values(item).map(v => `* ${v}`).join('\n');
          return `* ${item}`;
        }).join('\n');
      }
      if (typeof val === 'object') {
        return Object.entries(val).map(([key, value]) => {
          const heading = key.charAt(0).toUpperCase() + key.slice(1);
          if (Array.isArray(value)) {
            return `${heading}:\n` + value.map(v => `* ${v}`).join('\n');
          }
          return `* ${value}`;
        }).join('\n');
      }
      return String(val);
    };

    const normalized = {
      jobDescription:     toPlainText(sections.jobDescription),
      responsibilities:   toPlainText(sections.responsibilities),
      skills:             toPlainText(sections.skills),
      eligibility:        toPlainText(sections.eligibility),
      benefits:           toPlainText(sections.benefits),
      recruitmentProcess: toPlainText(sections.recruitmentProcess),
      relocationBenefits: toPlainText(sections.relocationBenefits),
    };

    console.log('✅ JD sections generated and normalized successfully');
    return res.json({
      sections:  normalized,
      generated: normalized.jobDescription,
      jobTitle,
      skills: skills || '',
    });

  } catch (error) {
    console.error('Generate JD error:', error.message);
    if (error.message?.includes('API_KEY') || error.message?.includes('API key')) {
      return res.status(500).json({ error: 'Invalid Gemini API key.' });
    }
    if (error.message?.includes('quota') || error.message?.includes('429')) {
      return res.status(429).json({ error: 'Gemini quota exceeded. Try again later.' });
    }
    return res.status(500).json({ error: 'Failed to generate: ' + error.message });
  }
});

// ==================== HELPER FUNCTIONS ====================

function applySpellingRules(text) {
  const techTerms = {
    'jhava': 'Java', 'jave': 'Java', 'jaba': 'Java',
    'pythn': 'Python', 'pyhton': 'Python', 'pyton': 'Python', 'phyton': 'Python',
    'reactt': 'React', 'recat': 'React', 'raect': 'React',
    'nodjs': 'Node.js', 'nodejs': 'Node.js',
    'developr': 'developer', 'devlopr': 'developer', 'develoepr': 'developer',
    'develpor': 'developer', 'devloper': 'developer', 'developpe': 'developer',
    'engeneer': 'engineer', 'enginear': 'engineer', 'enginer': 'engineer',
    'experiance': 'experience', 'experence': 'experience', 'expereince': 'experience',
    'developement': 'development', 'developmnet': 'development',
    'managment': 'management', 'managemnt': 'management',
    'architechture': 'architecture', 'architcture': 'architecture',
    'comunication': 'communication', 'communciation': 'communication',
    'independantly': 'independently',
    'canditate': 'candidate', 'candate': 'candidate',
    'programer': 'programmer', 'programmr': 'programmer',
    'desiner': 'designer', 'designr': 'designer',
    'managr': 'manager', 'managar': 'manager',
    'kubernetis': 'Kubernetes', 'docekr': 'Docker',
    'angualr': 'Angular', 'djago': 'Django', 'vuejs': 'Vue.js',
    'postgre': 'PostgreSQL', 'mysqll': 'MySQL',
    'microservces': 'microservices',
    'responsibilty': 'responsibility', 'responsibilites': 'responsibilities',
    'recruitmet': 'recruitment', 'recruitement': 'recruitment',
    'eligibilty': 'eligibility', 'eligiblity': 'eligibility',
    'benifits': 'benefits', 'benfits': 'benefits',
    'reloacation': 'relocation', 'reolcation': 'relocation',
    'compny': 'company', 'compnay': 'company',
    'additonal': 'additional', 'addtional': 'additional',
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
    issues.push({ type: 'grammar', severity: 'low', message: 'Multiple spaces detected', suggestion: 'Remove extra spaces' });
  }
  if (text.length > 0 && text[0] !== text[0].toUpperCase()) {
    issues.push({ type: 'grammar', severity: 'medium', message: 'Sentence should start with a capital letter', suggestion: 'Capitalize the first letter' });
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
    { wrong: /\bbenifits\b/gi, correct: 'benefits' },
    { wrong: /\beligibilty\b/gi, correct: 'eligibility' },
    { wrong: /\brecruitmet\b/gi, correct: 'recruitment' },
  ];
  commonMisspellings.forEach(({ wrong, correct }) => {
    if (wrong.test(text)) {
      issues.push({ type: 'spelling', severity: 'high', message: 'Possible misspelling detected', suggestion: `Did you mean "${correct}"?` });
    }
  });
  return issues;
}

function checkFieldRules(text, field) {
  const issues = [];
  switch (field) {
    case 'jobTitle':
    case 'title':
      if (text.length < 5) {
        issues.push({ type: 'validation', severity: 'high', message: 'Job title is too short', suggestion: 'Provide a more descriptive job title' });
      }
      break;
    case 'description':
      if (text.length < 50) {
        issues.push({ type: 'validation', severity: 'high', message: 'Job description is too short', suggestion: 'Provide more details about the role' });
      }
      break;
  }
  return issues;
}

// ==================== JOB RECOMMENDATIONS (AI Service Proxy) ====================
router.get('/recommend', async (req, res) => {
  try {
    const { job_id, top_n = 5 } = req.query;

    if (!job_id) {
      return res.status(400).json({ error: 'job_id query parameter is required' });
    }

    console.log(`🤖 Proxying recommendation request: job_id=${job_id}, top_n=${top_n}`);

    const response = await axios.get(`${AI_SERVICE_URL}/recommend`, {
      params: {
        job_id,
        top_n: parseInt(top_n) || 5
      },
      timeout: 30000
    });

    const recommendations = response.data?.recommendations || [];

    // Normalize response to ensure all items have expected fields
    const normalized = recommendations
      .map((rec) => {
        const score = Number(
          rec.score ?? rec.similarity_score ?? rec.matchScore ?? rec.match_score ?? 0
        ) || 0;
        return {
          ...rec,
          name: rec.applicantName || rec.name || 'Unknown',
          score
        };
      })
      .sort((a, b) => b.score - a.score);

    console.log(`✅ Got ${normalized.length} recommendations from AI service`);
    return res.json({
      job_id,
      recommendations: normalized,
      count: normalized.length
    });

  } catch (error) {
    console.error('❌ Recommendation proxy error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'AI service unavailable',
        details: 'The recommendation service is not currently available. Please try again later.'
      });
    }

    if (error.response?.status === 404) {
      return res.status(404).json({
        error: 'Job not found or no recommendations available',
        job_id: req.query.job_id
      });
    }

    return res.status(error.response?.status || 500).json({
      error: 'Failed to get recommendations',
      details: error.message
    });
  }
});

// ==================== CHATBOT (AI Service Proxy) ====================
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`💬 Proxying chat request: "${message.substring(0, 50)}..."`);

    const response = await axios.post(`${AI_SERVICE_URL}/chat`, { message }, { timeout: 30000 });

    const reply = response.data?.reply || '';

    console.log(`✅ Got chat response from AI service`);
    return res.json({ reply });

  } catch (error) {
    console.error('❌ Chat proxy error:', error.message);

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'Chatbot service unavailable',
        details: 'The chatbot service is not currently available. Please try again later.'
      });
    }

    return res.status(error.response?.status || 500).json({
      error: 'Failed to get chat response',
      details: error.message
    });
  }
});

module.exports = router;