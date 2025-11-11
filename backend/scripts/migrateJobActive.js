// One-time migration script to normalize legacy jobs so that jobActive reflects status="active"
// Usage (PowerShell): $env:MONGODB_URI="your_connection_string"; node backend/scripts/migrateJobActive.js
// Falls back to local mongodb://localhost:27017/kgamify if MONGODB_URI/MONGO_URI not set.

const mongoose = require('mongoose');
const Job = require('../models/Job');

async function run() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/kgamify';
  console.log('[migrateJobActive] Connecting to', uri);
  await mongoose.connect(uri, { autoIndex: false });
  const filter = { status: 'active', $or: [ { jobActive: { $exists: false } }, { jobActive: false } ] };
  const res = await Job.updateMany(filter, { $set: { jobActive: true } });
  console.log(`[migrateJobActive] Modified ${res.modifiedCount} job documents.`);
  await mongoose.disconnect();
  console.log('[migrateJobActive] Done');
}

run().catch(err => { console.error('[migrateJobActive] Error:', err); process.exit(1); });