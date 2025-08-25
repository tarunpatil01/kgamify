/* eslint-disable no-console */
const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Application = require('../models/Application');
const Company = require('../models/Company');

// Optional API key middleware (set EXTERNAL_API_KEY in .env to enforce)
function requireApiKey(req, res, next) {
  const requiredKey = process.env.EXTERNAL_API_KEY;
  if (!requiredKey) return next(); // No key configured, allow requests

  const provided = req.header('x-api-key');
  if (provided && provided === requiredKey) return next();

  return res.status(401).json({ error: 'Unauthorized: invalid API key' });
}

// GET /api/external/jobs?companyEmail=... | company=... | email=...
// Exports jobs for a specific company (public-ish, can be guarded via API key)
router.get('/jobs', requireApiKey, async (req, res) => {
  try {
    const companyEmail = req.query.companyEmail || req.query.email;
    const companyName = req.query.company || req.query.companyName;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(Math.min(parseInt(req.query.limit || '50', 10), 100), 1);
    const skip = (page - 1) * limit;
    const status = req.query.status; // e.g. 'active'
    const format = (req.query.format || '').toLowerCase(); // 'plain' to include stripped text
    const minimal = String(req.query.minimal || '').toLowerCase() === 'true';

    let query = {};
    if (companyEmail) {
      query.companyEmail = companyEmail;
    } else if (companyName) {
      query.companyName = new RegExp(`^${companyName}$`, 'i');
    }
    if (status && status !== 'all') {
      query.status = status;
    }

    const [jobs, total] = await Promise.all([
      Job.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Job.countDocuments(query)
    ]);

    // Map to a clean DTO for external use
    const stripTags = (html) => (html ? String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : null);

    const data = jobs.map(j => {
      const base = {
        id: j._id.toString(),
        title: j.jobTitle,
        employmentType: j.employmentType,
        experienceLevel: j.experienceLevel,
        location: j.location,
        remoteOrOnsite: j.remoteOrOnsite,
        salary: j.salary,
        company: { name: j.companyName, email: j.companyEmail },
        status: j.status,
        postedAt: j.postedAt,
        createdAt: j.createdAt,
        applicationsCount: Array.isArray(j.applicants) ? j.applicants.length : 0,
      };

      if (minimal) return base;

      const withDetails = {
        ...base,
        description: j.jobDescription,
        responsibilities: j.responsibilities || null,
        benefits: j.benefits || null,
        eligibility: j.eligibility || null,
        sponsorship: j.sponsorship || null,
        recruitmentProcess: j.recruitmentProcess || null,
        skills: j.skills || null,
        equity: j.equity || null,
        category: j.category || null,
        tags: j.tags || null,
      };

      if (format === 'plain') {
        withDetails.descriptionText = stripTags(j.jobDescription);
        withDetails.responsibilitiesText = stripTags(j.responsibilities);
      }

      return withDetails;
    });

    res.json({
      companyEmail: companyEmail || null,
      companyName: companyName || null,
      count: data.length,
      total,
      page,
      limit,
  jobs: data,
    });
  } catch (err) {
    console.error('Error exporting jobs:', err);
    res.status(500).json({ error: 'Failed to export jobs' });
  }
});

// POST /api/external/applications
// Accepts application submissions from external apps.
// Content-Type: application/json (or multipart later if needed)
router.post('/applications', requireApiKey, async (req, res) => {
  try {
    const {
      jobId,
      applicantName,
      companyEmail,
      companyName,
      resumeUrl, // optional, for now we accept a URL
      testScore,
      skills,
    } = req.body || {};

    if (!jobId) return res.status(400).json({ error: 'jobId is required' });
    if (!applicantName) return res.status(400).json({ error: 'applicantName is required' });

    // Resolve job and company linkage
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ error: 'Job not found' });

    const finalCompanyEmail = companyEmail || job.companyEmail;
    if (!finalCompanyEmail) return res.status(400).json({ error: 'companyEmail is required' });

    let finalCompanyName = companyName || job.companyName;
    if (!finalCompanyName) {
      const companyDoc = await Company.findOne({ email: finalCompanyEmail });
      if (companyDoc?.companyName) finalCompanyName = companyDoc.companyName;
    }

    const newApp = new Application({
      jobId: job._id,
      CompanyName: finalCompanyName || 'Unknown',
      companyEmail: finalCompanyEmail,
      applicantName,
      resume: resumeUrl || undefined,
      testScore: testScore || undefined,
      skills: Array.isArray(skills) ? skills : (skills ? [skills] : []),
    });

    await newApp.save();

    // Add to job.applicants
    await Job.findByIdAndUpdate(job._id, { $addToSet: { applicants: newApp._id } });

    return res.status(201).json({
      message: 'Application received',
      application: {
        id: newApp._id.toString(),
        jobId: job._id.toString(),
        applicantName: newApp.applicantName,
        companyEmail: newApp.companyEmail,
        companyName: newApp.CompanyName,
        resume: newApp.resume || null,
        testScore: newApp.testScore || null,
        skills: newApp.skills || [],
        createdAt: newApp.createdAt,
      },
    });
  } catch (err) {
    console.error('Error receiving application:', err);
    res.status(500).json({ error: 'Failed to receive application' });
  }
});

// GET /api/external/applications?jobId=...&companyEmail=...&page=1&limit=50
// Lists applications for a given job (external consumers)
router.get('/applications', requireApiKey, async (req, res) => {
  try {
    const jobId = req.query.jobId;
    const companyEmail = req.query.companyEmail || req.query.email;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(Math.min(parseInt(req.query.limit || '50', 10), 100), 1);
    const skip = (page - 1) * limit;

    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required' });
    }

    const match = { jobId };
    if (companyEmail) {
      match.companyEmail = companyEmail;
    }

    const [apps, total] = await Promise.all([
      Application.find(match).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Application.countDocuments(match)
    ]);

    const data = apps.map(a => ({
      id: a._id.toString(),
      jobId: a.jobId?.toString?.() || String(a.jobId),
      applicantName: a.applicantName,
      companyEmail: a.companyEmail,
      companyName: a.CompanyName,
      resume: a.resume || null,
      testScore: a.testScore || null,
      skills: a.skills || [],
      createdAt: a.createdAt,
    }));

    return res.json({
      count: data.length,
      total,
      page,
      limit,
      applications: data,
    });
  } catch (err) {
    console.error('Error listing applications (external):', err);
    res.status(500).json({ error: 'Failed to list applications' });
  }
});

module.exports = router;
