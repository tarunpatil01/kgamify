/*
  Subscription expiry maintenance script.
  Run daily via scheduler: `node backend/scripts/checkSubscriptions.js`
*/
require('dotenv').config();
const mongoose = require('mongoose');
const Company = require('../models/Company');
const Job = require('../models/Job');
const { sendEmail } = require('../utils/emailService');
const { plans } = require('../config/plans');

async function main() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/kgamify';
  await mongoose.connect(mongoUri, { dbName: process.env.MONGO_DB || undefined });
  const now = new Date();
  const msDay = 24*60*60*1000;
  const companies = await Company.find({ subscriptionPlan: { $in: Object.keys(plans).filter(p => p !== 'free') } });
  for (const company of companies) {
    if (!company.subscriptionEndsAt) continue;
    const endsAt = new Date(company.subscriptionEndsAt);
    const daysRemaining = Math.ceil((endsAt - now)/msDay);
    // 7-day reminder
    if (daysRemaining === 7) {
      try {
        await sendEmail(company.email, 'custom', {
          subject: 'Your subscription expires in 7 days',
          html: `<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;'>
            <h2 style='color:#ef4444;'>Subscription Expiry Reminder</h2>
            <p>Hi ${company.companyName || 'there'}, your <strong>${company.subscriptionPlan}</strong> plan will expire on <strong>${endsAt.toDateString()}</strong>.</p>
            <p>Renew now to keep all paid features active.</p>
            <p><a href='${(process.env.FRONTEND_URL||'http://localhost:3000').replace(/\/$/,'')}/plans' style='background:#3b82f6;color:#fff;padding:10px 16px;border-radius:4px;text-decoration:none;'>Renew Plan</a></p>
          </div>`
        });
        company.lastExpiryNoticeSent = now;
        await company.save({ validateModifiedOnly: true }).catch(()=>{});
      } catch {}
    }
    // Day-of expiry
    if (daysRemaining === 0) {
      try {
        await sendEmail(company.email, 'custom', {
          subject: 'Your subscription expires today',
          html: `<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;'>
            <h2 style='color:#dc2626;'>Subscription Ends Today</h2>
            <p>Your current plan <strong>${company.subscriptionPlan}</strong> ends today (${endsAt.toDateString()}).</p>
            <p>Renew to avoid losing paid features, or continue on the Free plan.</p>
            <p><a href='${(process.env.FRONTEND_URL||'http://localhost:3000').replace(/\/$/,'')}/plans' style='background:#f97316;color:#fff;padding:10px 16px;border-radius:4px;text-decoration:none;'>Renew Now</a></p>
          </div>`
        });
        company.lastExpiryNoticeSent = now;
        await company.save({ validateModifiedOnly: true }).catch(()=>{});
      } catch {}
    }
    // Auto downgrade if expired (<0 days remaining)
    if (daysRemaining < 0) {
      if (company.subscriptionPlan !== 'free') {
        company.downgradedFromPlan = company.subscriptionPlan;
        company.subscriptionPlan = 'free';
        company.subscriptionJobLimit = plans.free.jobLimit;
        company.subscriptionEndsAt = undefined;
        await company.save({ validateModifiedOnly: true }).catch(()=>{});
        // Deactivate excess jobs beyond new free limit
        try {
          const limit = plans.free.jobLimit;
          const activeJobs = await Job.find({ companyEmail: company.email, jobActive: true }).sort({ createdAt: -1 });
          const excess = activeJobs.slice(limit);
          if (excess.length) {
            const ids = excess.map(j => j._id);
            await Job.updateMany({ _id: { $in: ids } }, { $set: { jobActive: false } });
          }
        } catch {}
        // Notify downgrade
        try {
          await sendEmail(company.email, 'custom', {
            subject: 'Subscription Downgraded to Free',
            html: `<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;'>
              <h2 style='color:#3b82f6;'>Downgraded to Free Plan</h2>
              <p>Your previous plan has expired. You are now on the Free plan with a limit of ${plans.free.jobLimit} active jobs.</p>
              <p>Upgrade anytime to regain recommendations and higher limits.</p>
              <p><a href='${(process.env.FRONTEND_URL||'http://localhost:3000').replace(/\/$/,'')}/plans' style='background:#3b82f6;color:#fff;padding:10px 16px;border-radius:4px;text-decoration:none;'>Upgrade Plan</a></p>
            </div>`
          });
        } catch {}
      }
    }
  }
  await mongoose.disconnect();
  console.log('Subscription check complete');
}

main().catch(err => { console.error(err); process.exit(1); });
