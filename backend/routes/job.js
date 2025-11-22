const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Company = require('../models/Company');
const { upload } = require('../config/cloudinary');

// Get all jobs (public endpoint without authentication)
router.get('/', async (req, res) => {
  try {
    // Set no-store headers to prevent client/proxy caching and 304 responses
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    });
    // If company email is provided, filter by it
  const { email, includeInactive } = req.query;
  let safeEmail = null;

    let query = {};
    if (email) {
      // Case-insensitive match for legacy mixed-case emails
      safeEmail = String(email).trim();
      query = { companyEmail: { $regex: `^${safeEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } };
      // Lazy enforce subscription expiry by deactivating jobs if needed
      try {
        const company = await Company.findOne({ email });
        if (company) {
          const now = new Date();
          // New field usage: subscriptionEndsAt replaces legacy subscriptionExpiresAt / subscriptionStatus
          const endsAt = company.subscriptionEndsAt || company.subscriptionExpiresAt; // fallback to legacy
          const expired = endsAt && now > new Date(endsAt);
          if (expired) {
            // Mark company expired (best effort) and deactivate all jobs
            // Best-effort downgrade (do not block listing)
            if (!company.downgradedFromPlan && company.subscriptionPlan !== 'free') {
              company.downgradedFromPlan = company.subscriptionPlan;
              company.subscriptionPlan = 'free';
              company.subscriptionJobLimit = 3;
              company.subscriptionEndsAt = undefined;
              await company.save({ validateModifiedOnly: true }).catch(()=>{});
            }
            await Job.updateMany({ companyEmail: email, jobActive: true }, { $set: { jobActive: false } }).catch(()=>{});
          }
        }
      } catch { /* ignore */ }
      // Unless explicitly requested, only include active jobs for company queries too
      if (String(includeInactive).toLowerCase() !== 'true') {
        query.jobActive = true;
      }
    } else {
      // Public listing: only show active jobs
      query.jobActive = true;
    }

    let jobs = await Job.find(query).sort({ createdAt: -1 });
    // Fallback: if no jobs found and email provided, attempt direct equality (may differ if regex failed)
    if (email && jobs.length === 0 && safeEmail) {
      jobs = await Job.find({ companyEmail: safeEmail }).sort({ createdAt: -1 });
    }

    // Development debug logging
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log('[GET /job] query:', query, 'includeInactive:', includeInactive, 'returned:', jobs.length);
    }

    res.status(200).json(jobs);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

const { enforceJobPostingRules } = require('./company');

// Create a new job (plan & approval gated)
// Accept either multiple files under 'jdFiles' or single file under 'jdPdf'
router.post('/', (req, res, next) => {
  // Try to parse multiple first; fall back to single
  const multi = upload.array('jdFiles', 5);
  multi(req, res, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    if (req.files && req.files.length) return next();
    // No multiple files uploaded; try single under jdPdf
    return upload.single('jdPdf')(req, res, next);
  });
}, enforceJobPostingRules, async (req, res) => {
  try {
    const { email, companyEmail } = req.body;
    // Use either explicitly provided companyEmail or fall back to email
    const finalEmail = companyEmail || email;
    
    if (!finalEmail) {
      return res.status(401).json({ error: 'Company email required' });
    }


    // Find company and verify lifecycle state
    const company = await Company.findOne({ email: finalEmail });
    if (!company) {
      return res.status(401).json({ error: 'Unauthorized or company not found' });
    }
    if (company.status === 'hold') {
      return res.status(403).json({ error: 'Your account is on hold. You cannot post jobs at this time. Please check Messages for details.' });
    }
    if (company.status === 'denied') {
      return res.status(403).json({ error: 'Your account has been denied. Please contact support.' });
    }
    if (!company.approved) {
      return res.status(403).json({ error: 'Company not approved' });
    }

    // Handle job description from textarea (no HTML processing needed)
    // Collect file URLs from either array or single upload
    const uploadedUrls = Array.isArray(req.files) && req.files.length ? req.files.map(f => f.path) : (req.file?.path ? [req.file.path] : []);

    // Enforce subscription job limit & validity constraints
    // Use new unified subscription fields if present; fallback to legacy
    const planId = company.subscriptionPlan || 'free';
    const jobLimit = company.subscriptionJobLimit || (planId === 'free' ? 3 : undefined);
    if (typeof jobLimit === 'number') {
      // Count active jobs for this company (fast path via cached activeJobCount if trustworthy)
      const activeCount = company.activeJobCount || await Job.countDocuments({ companyEmail: finalEmail, jobActive: true });
      if (activeCount >= jobLimit) {
        return res.status(403).json({ error: `Job limit reached for plan (${jobLimit}). Please upgrade or deactivate existing jobs.` });
      }
    }

    // Validate requested validUntil (Job Validity) if provided
    let { validUntil } = req.body;
    if (validUntil) {
      const parsed = new Date(validUntil);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ error: 'Invalid validUntil date' });
      }
      // If plan has an expiry, validUntil must be <= subscriptionEndsAt
      if (company.subscriptionEndsAt && parsed > new Date(company.subscriptionEndsAt)) {
        return res.status(400).json({ error: 'Job validity exceeds subscription end date' });
      }
      validUntil = parsed;
    }

    const newJob = new Job({
      ...req.body,
      validUntil,
      // Backward compatibility single URL
      jdPdfUrl: req.file?.path || req.body.jdPdfUrl || undefined,
      // Preferred: array of files
      jdFiles: (req.body.jdFiles && Array.isArray(req.body.jdFiles)) ? req.body.jdFiles : uploadedUrls,
      companyName: company.companyName,
      companyEmail: finalEmail // Ensure consistent field usage
    });
    await newJob.save();
    // Increment active job count (simple version: consider all jobs as active)
    await Company.updateOne({ _id: company._id }, { $inc: { activeJobCount: 1 } }).catch(()=>{});
    res.status(201).json(newJob);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get a specific job by ID
router.get('/:id', async (req, res) => {
  try {
    // Update to populate the applicants field
    const job = await Job.findById(req.params.id).populate('applicants');
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.status(200).json(job);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Edit a job
router.put('/:id', (req, res, next) => {
  const multi = upload.array('jdFiles', 5);
  multi(req, res, function (err) {
    if (err) return res.status(400).json({ error: err.message });
    if (req.files && req.files.length) return next();
    return upload.single('jdPdf')(req, res, next);
  });
}, async (req, res) => {
  try {
    // Ensure the job exists
    const existingJob = await Job.findById(req.params.id);
    if (!existingJob) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Update the job - preserve companyEmail if not provided
    // Merge jdFiles: if new uploads provided, append to existing unless client indicates replacement
    const uploadedUrls = Array.isArray(req.files) && req.files.length ? req.files.map(f => f.path) : (req.file?.path ? [req.file.path] : []);
    const clientJdFiles = req.body.jdFiles ? (Array.isArray(req.body.jdFiles) ? req.body.jdFiles : [req.body.jdFiles]) : undefined;
    // If client provided jdFiles explicitly, use that; else merge uploads into existing
    const nextJdFiles = typeof clientJdFiles !== 'undefined' ? clientJdFiles.filter(Boolean) : Array.from(new Set([...(existingJob.jdFiles || []), ...uploadedUrls]));

    const updatedData = {
      ...req.body,
      // Single URL compatibility: replace if new single uploaded; else respect explicit value; else keep
      jdPdfUrl: (uploadedUrls[0]) ?? (typeof req.body.jdPdfUrl !== 'undefined' ? req.body.jdPdfUrl : existingJob.jdPdfUrl),
      // Multiple URLs preferred
      jdFiles: nextJdFiles,
      companyEmail: req.body.companyEmail || existingJob.companyEmail
    };
    
    const job = await Job.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.json(job);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a job
router.delete('/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndDelete(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
// Toggle jobActive (company self-service) - requires company email to match
router.patch('/:id/toggle-active', async (req, res) => {
  try {
    const { id } = req.params;
    const { email, companyEmail, jobActive } = req.body || {};
    const actorEmail = companyEmail || email;
    if (!actorEmail) return res.status(400).json({ error: 'Company email required' });
    if (typeof jobActive === 'undefined') return res.status(400).json({ error: 'jobActive boolean required' });
    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (String(job.companyEmail).toLowerCase() !== String(actorEmail).toLowerCase()) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const company = await Company.findOne({ email: actorEmail });
    if (!company) return res.status(404).json({ error: 'Company not found' });
    // Enforce subscription still active when activating
    if (jobActive) {
      const now = new Date();
      const endsAt = company.subscriptionEndsAt || company.subscriptionExpiresAt; // legacy fallback
      if (endsAt && now > new Date(endsAt)) {
        return res.status(403).json({ error: 'Subscription expired. Cannot activate job.' });
      }
    }
    const previous = !!job.jobActive;
    job.jobActive = !!jobActive;
  // Keep string status in sync for legacy consumers
  job.status = job.jobActive ? 'active' : 'inactive';
    await job.save({ validateModifiedOnly: true });
    // Adjust active job count safely
    try {
      if (previous !== job.jobActive) {
        if (job.jobActive) company.activeJobCount = (company.activeJobCount || 0) + 1;
        else company.activeJobCount = Math.max(0, (company.activeJobCount || 0) - 1);
        await company.save({ validateModifiedOnly: true });
      }
    } catch { /* ignore */ }
    return res.json({ success: true, jobActive: job.jobActive });
  } catch (err) {
    // Return a safe message but keep original for diagnostics if NODE_ENV=development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Toggle job status error:', err);
    }
    return res.status(500).json({ error: 'Failed to toggle job status' });
  }
});
