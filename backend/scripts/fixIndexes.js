/*
  Fix and enforce MongoDB partial unique index for registrationNumber.
  - Drops any legacy non-partial unique index on registrationNumber
  - Creates the correct partial unique index: unique when registrationNumber exists and is a string
  - Reports index state before and after
*/

/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const mongoose = require('mongoose');

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set in backend/.env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const collection = db.collection('companies'); // Mongoose default pluralization for Company

  const printIndexes = async (label) => {
    const idx = await collection.indexes();
    console.log(`\n${label} indexes:`);
    idx.forEach((i) => {
      console.log(`- ${i.name}`, JSON.stringify({ key: i.key, unique: i.unique, partialFilterExpression: i.partialFilterExpression }));
    });
    return idx;
  };

  const before = await printIndexes('Before');

  // Find any existing index on registrationNumber
  const regIdx = before.filter((i) => i.key && i.key.registrationNumber === 1);

  // Clean data: unset registrationNumber where it's explicitly null
  const nullFix = await collection.updateMany(
    { registrationNumber: null },
    { $unset: { registrationNumber: "" } }
  );
  if (nullFix?.modifiedCount) {
    console.log(`Unset registrationNumber on ${nullFix.modifiedCount} documents where it was null.`);
  }

  // Drop incorrect registrationNumber indexes (non-partial or non-unique)
  for (const idx of regIdx) {
    const isPartial = !!(idx.partialFilterExpression && idx.partialFilterExpression.registrationNumber);
    const isUnique = !!idx.unique;
    const isCorrectPartial = isPartial && idx.partialFilterExpression.registrationNumber.$exists === true;
    const hasStringType = isPartial && idx.partialFilterExpression.registrationNumber.$type === 'string';

    if (!(isUnique && isCorrectPartial && hasStringType)) {
      console.log(`Dropping legacy/incorrect index: ${idx.name}`);
      await collection.dropIndex(idx.name).catch((err) => {
        // If index is already gone or cannot be dropped, log and continue
        console.warn(`Warning dropping index ${idx.name}:`, err.message);
      });
    }
  }

  // Ensure the correct partial unique index exists
  const desiredName = 'registrationNumber_1_partial_unique';
  const afterDrop = await collection.indexes();
  const hasDesired = afterDrop.some((i) => i.name === desiredName);
  const hasAnyRegIndex = afterDrop.some((i) => i.key && i.key.registrationNumber === 1);

  if (!hasDesired) {
    if (hasAnyRegIndex) {
      console.log('A registrationNumber index exists but not with the desired partial definition; will still create the correct one with a distinct name.');
    }
    console.log('Creating partial unique index on registrationNumber...');
    await collection.createIndex(
      { registrationNumber: 1 },
      {
        unique: true,
        name: desiredName,
        partialFilterExpression: { registrationNumber: { $exists: true, $type: 'string' } },
      }
    );
  } else {
    console.log('Desired partial unique index already present.');
  }

  await printIndexes('After');

  await mongoose.disconnect();
  console.log('\nIndex fix completed.');
}

main().catch((err) => {
  console.error('Error fixing indexes:', err);
  process.exit(1);
});
