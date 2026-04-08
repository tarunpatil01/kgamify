const express = require('express');
const router = express.Router();
const path = require('path');
const axios = require('axios');
const Job = require('../models/Job');
const Application = require('../models/Application');

// Import AI services
const { verifyJD } = require(path.join(__dirname, '../../AI/jdVerifier.cjs'));
const { rephraseJD } = require(path.join(__dirname, '../../AI/rephraseService_ML.cjs'));
const { getSuggestionsML, testPythonML } = require(path.join(__dirname, '../../AI/pythonMLService.cjs'));
const { GoogleGenerativeAI } = require('@google/generative-ai');

const ML_SERVER_URL = process.env.ML_SERVER_URL || 'http://localhost:5001';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

const normalizeSkillToken = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9+#.\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function extractJobSkills(job) {
  const raw = [
    job?.skills,
    job?.jobTitle,
    job?.jobDescription,
    job?.responsibilities,
    job?.eligibility,
    job?.tags
  ]
    .filter(Boolean)
    .join(' ');

  const tokens = normalizeSkillToken(raw)
    .split(/[,\s/|]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1);

  return Array.from(new Set(tokens));
}

function scoreApplicationForJob(application, jobSkillSet) {
  const applicantSkills = Array.isArray(application?.skills)
    ? application.skills.map((s) => normalizeSkillToken(s)).filter(Boolean)
    : [];

  const applicantSkillSet = new Set(applicantSkills);
  let matches = 0;
  jobSkillSet.forEach((skill) => {
    if (applicantSkillSet.has(skill)) matches += 1;
  });

  const baseMatchScore = jobSkillSet.size > 0
    ? (matches / jobSkillSet.size) * 100
    : 0;

  const testScoreRaw = Number.parseFloat(String(application?.testScore || '').replace(/[^0-9.]/g, ''));
  const normalizedTestScore = Number.isFinite(testScoreRaw)
    ? Math.max(0, Math.min(100, testScoreRaw))
    : 0;

  // Weighted relevance score: skills overlap dominates, then test score, then resume presence.
  const resumeBoost = application?.resume ? 5 : 0;
  const relevanceScore = (baseMatchScore * 0.75) + (normalizedTestScore * 0.20) + resumeBoost;

  return {
    score: Number(relevanceScore.toFixed(2)),
    matchedSkills: matches,
    totalJobSkills: jobSkillSet.size
  };
}

function cleanGeminiJsonText(rawText) {
  return String(rawText || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

async function getDetailedRecommendationPayload(jobId, topN) {
  const normalizedTopN = Math.max(1, Math.min(50, Number.parseInt(topN, 10) || 5));
  const job = await Job.findById(jobId).lean();
  if (!job) {
    const notFoundError = new Error('Job not found');
    notFoundError.statusCode = 404;
    notFoundError.jobId = jobId;
    throw notFoundError;
  }

  const jobContext = {
    jobTitle: job.jobTitle || '',
    jobDescription: job.jobDescription || '',
    responsibilities: job.responsibilities || '',
    eligibility: job.eligibility || '',
    skills: job.skills || '',
    experienceLevel: job.experienceLevel || '',
    location: job.location || '',
    tags: job.tags || ''
  };

  try {
    const response = await axios.post(`${AI_SERVICE_URL}/recommend-detailed`, {
      job_id: jobId,
      top_n: normalizedTopN,
      job_context: jobContext
    }, {
      timeout: 45000
    });

    const payload = response.data || {};
    const recommendations = Array.isArray(payload.recommendations) ? payload.recommendations : [];
    const normalizedRecommendations = recommendations
      .map((rec) => {
        const score = Number(rec.score ?? rec.final_score ?? rec.similarity_score ?? 0) || 0;
        return {
          ...rec,
          name: rec.applicantName || rec.name || 'Unknown',
          score,
          final_score: score,
        };
      })
      .sort((a, b) => b.score - a.score);

    return {
      job_id: payload.job_id || jobId,
      job: payload.job || jobContext,
      vectorData: payload.vectorData || {},
      recommendations: normalizedRecommendations.slice(0, normalizedTopN),
      count: normalizedRecommendations.slice(0, normalizedTopN).length,
      fallbackUsed: Boolean(payload.fallbackUsed),
      source: 'python-vector-model',
    };
  } catch (error) {
    console.error('❌ Detailed AI recommendation fetch failed:', error.message);
  }

  try {
    const response = await axios.post(`${AI_SERVICE_URL}/recommend`, {
      job_id: jobId,
      top_n: normalizedTopN,
      job_context: jobContext
    }, {
      timeout: 30000
    });

    const recommendations = response.data?.recommendations || [];
    const normalized = recommendations
      .map((rec) => {
        const score = Number(
          rec.score ?? rec.similarity_score ?? rec.matchScore ?? rec.match_score ?? 0
        ) || 0;
        return {
          ...rec,
          name: rec.applicantName || rec.name || 'Unknown',
          score,
          final_score: score
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, normalizedTopN);

    return {
      job_id: jobId,
      job: jobContext,
      vectorData: {},
      recommendations: normalized,
      count: normalized.length,
      fallbackUsed: false,
      source: 'ai-service'
    };
  } catch (error) {
    console.error('❌ Basic AI recommendation fetch failed:', error.message);
  }

  const applications = await Application.find({ jobId }).lean();
  const jobSkills = extractJobSkills(job);
  const jobSkillSet = new Set(jobSkills);

  const fallbackRecommendations = applications
    .map((app) => {
      const scoring = scoreApplicationForJob(app, jobSkillSet);
      return {
        applicantName: app.applicantName,
        email: app.applicantEmail || '',
        resume_url: app.resume || '',
        skills: Array.isArray(app.skills) ? app.skills : [],
        similarity_score: scoring.score,
        score: scoring.score,
        final_score: scoring.score,
        matched_skills: scoring.matchedSkills,
        total_job_skills: scoring.totalJobSkills,
        source: 'fallback-rule-engine',
        vectorData: {
          featureVector: [
            scoring.score / 100,
            scoring.matchedSkills,
            scoring.totalJobSkills,
            app.resume ? 1 : 0,
          ],
        }
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, normalizedTopN);

  return {
    job_id: jobId,
    job: {
      jobTitle: job.jobTitle || '',
      jobDescription: job.jobDescription || '',
      skills: jobSkills,
      experienceLevel: job.experienceLevel || '',
      location: job.location || ''
    },
    vectorData: {
      jobSkills,
      jobTitle: job.jobTitle || '',
      candidateCount: fallbackRecommendations.length,
      source: 'fallback-rule-engine'
    },
    recommendations: fallbackRecommendations,
    count: fallbackRecommendations.length,
    fallbackUsed: true,
    source: 'fallback-rule-engine'
  };
}

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
      } catch {
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

Return a JSON object with EXACTLY these 7 keys. Every value must be a plain string only — no arrays, no nested objects.

CRITICAL: Use the literal two-character sequence \\n (backslash + n) to separate bullet points inside strings. Do NOT use actual newline characters inside JSON string values.

Example of correct format:
{"jobDescription":"We are seeking a skilled professional.","responsibilities":"* Design and develop features\\n* Collaborate with teams\\n* Review code","skills":"* JavaScript\\n* Node.js\\n* React","eligibility":"* Bachelor degree in CS\\n* 3+ years experience","benefits":"* Health insurance\\n* Remote work\\n* Annual bonus","recruitmentProcess":"* Resume screening\\n* Technical interview\\n* HR round","relocationBenefits":"Full relocation package provided including moving allowance."}

Now generate for the requested role. Return ONLY the raw JSON object, no markdown, no code fences, no extra text before or after.`;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    });

    const result  = await model.generateContent(finalPrompt);
    const rawText = result.response.text();

    // Step 1: Strip markdown fences if present
    let cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // Step 2: Find the JSON object boundaries (in case there's extra text)
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd   = cleaned.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
    }

    // Step 3: Fix unescaped literal newlines inside JSON string values
    // This replaces actual newline chars inside quoted strings with \n
    cleaned = cleaned.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
      return match
        .replace(/\r\n/g, '\\n')
        .replace(/\r/g, '\\n')
        .replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t');
    });

    let sections;
    try {
      sections = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error('JSON parse failed:', parseErr.message);
      console.error('Raw response was:', rawText.substring(0, 500));
      console.error('Cleaned was:', cleaned.substring(0, 500));
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

    const payload = await getDetailedRecommendationPayload(job_id, top_n);
    return res.json({
      job_id: payload.job_id,
      recommendations: payload.recommendations,
      count: payload.count,
      fallbackUsed: payload.fallbackUsed,
      source: payload.source
    });

  } catch (error) {
    console.error('❌ Recommendation proxy error:', error.message);

    try {
      const payload = await getDetailedRecommendationPayload(req.query.job_id, req.query.top_n || 5);
      return res.json({
        job_id: payload.job_id,
        recommendations: payload.recommendations,
        count: payload.count,
        fallbackUsed: payload.fallbackUsed,
        source: payload.source
      });
    } catch (fallbackError) {
      if (fallbackError.statusCode === 404) {
        return res.status(404).json({ error: 'Job not found or no recommendations available', job_id: fallbackError.jobId });
      }
      return res.status(500).json({ error: 'Failed to get recommendations', details: fallbackError.message });
    }
  }
});

// ==================== RECOMMENDATION INSIGHTS (VECTOR DATA + GEMINI SUMMARY) ====================
router.get('/recommendation-insights', async (req, res) => {
  try {
    const { job_id, top_n = 5 } = req.query;

    if (!job_id) {
      return res.status(400).json({ error: 'job_id query parameter is required' });
    }

    const payload = await getDetailedRecommendationPayload(job_id, top_n);

    let summary = null;
    if (GEMINI_API_KEY && payload.recommendations.length > 0) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `You are a senior recruiter reviewing ranked job applicants.

Return ONLY a raw JSON object with these exact keys:
{
  "summary": "one short executive summary",
  "topStrengths": ["..."],
  "topRisks": ["..."],
  "hiringRecommendation": "...",
  "rankedCandidates": [
    {
      "name": "...",
      "reason": "...",
      "fit": "high|medium|low"
    }
  ]
}

Job:
${JSON.stringify(payload.job || {}, null, 2)}

Vector payload:
${JSON.stringify({
          vectorData: payload.vectorData,
          recommendations: payload.recommendations.slice(0, Math.min(10, payload.recommendations.length))
        }, null, 2)}

Focus on skills, past experience, projects, and academic evidence. Prioritize the strongest candidates in descending order.`;

        const result = await model.generateContent(prompt);
        const rawText = result.response.text();
        const parsed = JSON.parse(cleanGeminiJsonText(rawText));
        summary = parsed;
      } catch (geminiError) {
        console.error('❌ Gemini insights generation failed:', geminiError.message);
      }
    }

    if (!summary) {
      const topCandidate = payload.recommendations[0];
      summary = {
        summary: topCandidate
          ? `${topCandidate.applicantName || 'Top candidate'} is currently the strongest match based on the available resume signals.`
          : 'No applicants matched the current job signals strongly enough for a summary.',
        topStrengths: [
          'Ranked using resume skills, experience, project signals, and academic evidence.'
        ],
        topRisks: [
          'This fallback summary is heuristic-only when Gemini is unavailable.'
        ],
        hiringRecommendation: topCandidate
          ? `Prioritize ${topCandidate.applicantName || 'the top candidate'} for the next interview round.`
          : 'Review additional applicants or adjust the job requirements.',
        rankedCandidates: payload.recommendations.slice(0, Math.min(10, payload.recommendations.length)).map((candidate) => ({
          name: candidate.applicantName || candidate.name || 'Unknown',
          reason: `Score ${candidate.score}. Matched skills: ${(candidate.matched_skills || candidate.matchedSkills || []).join(', ') || 'none'}.`,
          fit: candidate.score >= 75 ? 'high' : candidate.score >= 55 ? 'medium' : 'low'
        }))
      };
    }

    return res.json({
      job_id: payload.job_id,
      job: payload.job,
      recommendations: payload.recommendations,
      vectorData: payload.vectorData,
      summary,
      count: payload.count,
      fallbackUsed: payload.fallbackUsed,
      source: payload.source
    });
  } catch (error) {
    console.error('❌ Recommendation insights error:', error.message);
    return res.status(error.statusCode || 500).json({
      error: 'Failed to build recommendation insights',
      details: error.message
    });
  }
});

// ==================== CHATBOT (Gemini Primary + AI Service Fallback) ====================
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Primary path: Gemini API
    if (GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const prompt = `You are kGamify's hiring assistant chatbot.

Guidelines:
- Keep responses concise, practical, and friendly.
- Focus on hiring, job descriptions, applicants, interview process, and recruitment best practices.
- If asked outside hiring scope, still answer briefly and steer back helpfully.

User message:
${message}`;

        const result = await model.generateContent(prompt);
        const reply = result.response.text()?.trim() || 'I could not generate a response right now.';
        return res.json({ reply, provider: 'gemini' });
      } catch (geminiError) {
        console.error('❌ Gemini chat failed, trying AI service fallback:', geminiError.message);
      }
    }

    // Secondary fallback path: existing AI service
    const response = await axios.post(`${AI_SERVICE_URL}/chat`, { message }, { timeout: 30000 });
    const reply = response.data?.reply || '';
    return res.json({ reply, provider: 'ai-service' });

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