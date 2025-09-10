/* Script to quickly list currently approved companies for debugging */
/* eslint-disable no-console */
const mongoose = require('mongoose');
const Company = require('../models/Company');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const list = await Company.find({ approved: true });
    console.log('Approved companies count:', list.length);
    console.log(list.map(c => ({ id: c._id.toString(), name: c.companyName, status: c.status })));
  } catch (e) {
    console.error('Error listing approved companies', e.message);
  } finally {
    await mongoose.disconnect();
  }
})();
