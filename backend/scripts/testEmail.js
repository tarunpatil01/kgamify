/* eslint-disable no-console */
/*
 Simple SMTP test sender for Hostinger using Nodemailer via emailService.js
 Usage:
   1) Copy backend/.env.example to backend/.env and fill real values
   2) npm run email:test  (from backend folder or workspace root with correct path)
 Optionally set EMAIL_TEST_TO in .env to override the recipient
*/

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { sendEmail } = require('../utils/emailService');

async function main() {
  const to = process.env.EMAIL_TEST_TO || process.env.SMTP_EMAIL;
  if (!process.env.SMTP_HOST || !process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
    console.error('Missing SMTP env vars. Please configure backend/.env with SMTP_HOST, SMTP_EMAIL, SMTP_PASSWORD.');
    process.exit(1);
  }

  console.log('Sending test email using:');
  console.log({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    from: process.env.SMTP_EMAIL,
    to
  });

  const res = await sendEmail(to, 'custom', {
    subject: 'Hostinger SMTP test - kGamify',
    html: `
      <p>Hello,</p>
      <p>This is a test email sent via <strong>Hostinger SMTP</strong> from the kGamify backend.</p>
      <p>Timestamp: ${new Date().toISOString()}</p>
    `,
  });

  console.log('Result:', res);
  if (!res.success) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
