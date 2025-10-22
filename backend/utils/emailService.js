const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// SMTP Configuration
const createTransporter = () => {
  // Prefer explicit SMTP host/port if provided, fallback to Gmail service
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: String(process.env.SMTP_SECURE || 'false') === 'true',
      auth: {
        user: process.env.SMTP_EMAIL || 'natheprasad17@gmail.com',
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  return nodemailer.createTransport({
    service: 'gmail', // Using Gmail SMTP
    auth: {
      user: process.env.SMTP_EMAIL || 'natheprasad17@gmail.com',
      pass: process.env.SMTP_PASSWORD, // App password (not regular password)
    },
  });
};

// Core layout wrapper to ensure all emails share consistent, professional styling and disclaimers
const renderEmail = ({
  title = 'kGamify Notification',
  preheader = '',
  bodyHtml = '',
  cta = null, // { label, url }
  footerNote = '',
  logoSrc
}) => {
  const brand = 'kGamify';
    // Note: frontend base may be used by callers to build URLs; kept implicit here
  const ctaHtml = cta && cta.url && cta.label
    ? `<div style="margin: 28px 0 8px 0;">
      <a href="${cta.url}"
      style="background:linear-gradient(135deg, #ff7a1a, #ff4d8d);color:#ffffff;padding:14px 26px;text-decoration:none;border-radius:10px;border:0;font-weight:700;display:inline-block;box-shadow:0 6px 18px rgba(255,122,26,0.28)" target="_blank" rel="noopener">${cta.label}</a>
    </div>`
    : '';

  const defaultFooter = `
    <p style="margin:4px 0;color:#6b7280;font-size:12px;line-height:1.5;">
      If you are not the intended recipient, please ignore this email.
    </p>
    <p style="margin:4px 0;color:#6b7280;font-size:12px;line-height:1.5;">
      This is an automated message from ${brand}. Please do not reply to this email.
    </p>
  `;

  const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const logoUrl = logoSrc || process.env.BRAND_LOGO_URL || `${frontend}/KLOGO.png`;

  const signatureBlock = `
    <div style="margin-top:22px;color:#111827;">
      <p style="margin:0 0 10px 0;">Regards,<br/><strong>kGamify Team</strong></p>
      <div style="margin-top:8px;display:flex;gap:8px;align-items:center;">
        <a href="https://www.kgamify.in" target="_blank" rel="noopener" style="text-decoration:none;color:#ff8200;font-weight:600;">www.kgamify.in</a>
        <span style="color:#d1d5db;">|</span>
        <a href="https://www.linkedin.com/company/kgamify" target="_blank" rel="noopener" style="display:inline-block;width:24px;height:24px;border-radius:999px;background:#0a66c2;color:#fff;text-align:center;line-height:24px;font-size:12px;text-decoration:none;">in</a>
        <a href="https://www.instagram.com" target="_blank" rel="noopener" style="display:inline-block;width:24px;height:24px;border-radius:999px;background:#e1306c;color:#fff;text-align:center;line-height:24px;font-size:12px;text-decoration:none;">IG</a>
        <a href="https://www.facebook.com" target="_blank" rel="noopener" style="display:inline-block;width:24px;height:24px;border-radius:999px;background:#1877f2;color:#fff;text-align:center;line-height:24px;font-size:12px;text-decoration:none;">f</a>
        <a href="https://twitter.com" target="_blank" rel="noopener" style="display:inline-block;width:24px;height:24px;border-radius:999px;background:#111827;color:#fff;text-align:center;line-height:24px;font-size:12px;text-decoration:none;">X</a>
      </div>
    </div>
  `;

  const preheaderSpan = preheader
    ? `<span style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;color:#fff;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>`
    : '';

  return `
  <!doctype html>
  <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="x-apple-disable-message-reformatting">
      <title>${title}</title>
      <style>/* fallback for clients that respect style tags */
        @media (prefers-color-scheme: dark) {
          .card { background:#0b1220 !important; color:#e5e7eb !important; }
        }
        a { color: #ff7a1a; }
      </style>
    </head>
    <body style="margin:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,Helvetica,sans-serif;">
      ${preheaderSpan}
      <!-- Header -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#ffffff" style="background:#ffffff;">
        <tr>
          <td align="center" style="padding:24px 0;border-bottom:1px solid #e5e7eb;">
            <table role="presentation" width="680" cellspacing="0" cellpadding="0" border="0" style="width:680px;max-width:680px;">
              <tr>
                <td align="center" style="padding:0 24px;">
                  <img src="${logoUrl}" alt="${brand} logo" width="72" height="72" style="display:block;border:0;outline:none;text-decoration:none;height:72px;width:72px;object-fit:contain;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      <!-- Body -->
      <div style="max-width:680px;margin:0 auto;padding:28px 20px;">
        <div class="card" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;padding:28px;box-shadow:0 10px 24px rgba(0,0,0,0.08);">
          <h2 style="margin:0 0 16px 0;color:#ff8200;font-size:22px;line-height:1.3;">${title}</h2>
          <div style="color:#374151;font-size:16px;line-height:1.7;">
            ${bodyHtml}
          </div>
          ${ctaHtml}
          ${footerNote ? `<p style="margin-top:18px;color:#6b7280;font-size:12px;">${footerNote}</p>` : ''}
          ${signatureBlock}
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:26px 0;"/>
          ${defaultFooter}
        </div>
        <p style="text-align:center;color:#9ca3af;font-size:11px;margin:14px 0 0 0;">&nbsp;</p>
      </div>
      <!-- Footer -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#1e2938" style="background:#1e2938;">
        <tr>
          <td align="center" style="padding:16px 16px;">
            <table role="presentation" width="680" cellspacing="0" cellpadding="0" border="0" style="width:680px;max-width:680px;">
              <tr>
                <td align="center" style="font-size:12px;color:#e5e7eb;font-family:Arial,Helvetica,sans-serif;">
                  Copyright © 2021 Yantrikisoft - All Rights Reserved.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>`;
};

// Resolve logo strategy (cid or absolute url)
const resolveLogo = () => {
  const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const brandLogoUrl = process.env.BRAND_LOGO_URL;
  const shouldEmbed = String(process.env.EMAIL_EMBED_LOGO || (!brandLogoUrl)).toLowerCase() === 'true';

  if (shouldEmbed) {
    return { logoSrc: 'cid:brandlogo@kgamify', embed: true, frontend };
  }
  return { logoSrc: brandLogoUrl || `${frontend}/KLOGO.png`, embed: false, frontend };
};

// Email templates
const emailTemplates = {
  jobApplication: (data) => ({
    subject: `New Application for ${data.jobTitle}`,
    html: renderEmail({
      title: 'New Job Application Received',
      preheader: `New application for ${data.jobTitle}`,
      bodyHtml: `
        <p>Hi ${data.companyName ? `${data.companyName} Team` : 'there'},</p>
        <p>You have received a new application for the job below.</p>
        <div style="background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e5e7eb;">
          <p style="margin:0 0 8px 0;"><strong>Job Title:</strong> ${data.jobTitle}</p>
          <p style="margin:0 0 8px 0;"><strong>Company:</strong> ${data.companyName}</p>
          <p style="margin:0 0 8px 0;"><strong>Applicant Name:</strong> ${data.applicantName}</p>
          <p style="margin:0 0 8px 0;"><strong>Applicant Email:</strong> ${data.applicantEmail}</p>
          <p style="margin:0;"><strong>Applied On:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <div style="background:#ecfdf5;border-left:4px solid #10b981;padding:12px 14px;border-radius:6px;margin-top:14px;">
          <p style="margin:0 0 6px 0;color:#065f46;"><strong>Cover Letter:</strong></p>
          <p style="margin:0;color:#065f46;">${(data.coverLetter || 'No cover letter provided')}</p>
        </div>
      `,
      cta: { label: 'Review in Dashboard', url: `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/,'')}/dashboard` },
      footerNote: `If the button doesn't work, open this link: <br/><a href="${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/,'')}/dashboard" target="_blank" rel="noopener">${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/,'')}/dashboard</a>`,
      logoSrc: data.logoSrc
    })
  }),

  jobPosted: (data) => ({
    subject: `Job Posted Successfully: ${data.jobTitle}`,
    html: renderEmail({
      title: 'Job Posted Successfully',
      preheader: `Your job "${data.jobTitle}" is now live`,
      bodyHtml: `
  <p>Hi ${data.companyName ? `${data.companyName} Team` : 'there'},</p>
  <p>Your job has been posted successfully. Here are the details:</p>
  <div style="background:#ffedd5;padding:16px;border-radius:8px;border:1px solid #fdba74;">
          <p style="margin:0 0 8px 0;"><strong>Job Title:</strong> ${data.jobTitle}</p>
          <p style="margin:0 0 8px 0;"><strong>Company:</strong> ${data.companyName}</p>
          <p style="margin:0 0 8px 0;"><strong>Location:</strong> ${data.location || 'Not specified'}</p>
          <p style="margin:0 0 8px 0;"><strong>Salary / Project Value:</strong> ${data.salary ? String(data.salary) : 'Not specified'}</p>
          <p style="margin:0;"><strong>Posted On:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
      `,
      cta: { label: 'View in Dashboard', url: `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/,'')}/dashboard` },
      footerNote: `If the button doesn't work, open this link: <br/><a href="${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/,'')}/dashboard" target="_blank" rel="noopener">${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/,'')}/dashboard</a>`,
      logoSrc: data.logoSrc
    })
  }),

  applicationStatusUpdate: (data) => ({
    subject: `Application Status Update: ${data.jobTitle}`,
    html: renderEmail({
      title: 'Application Status Update',
      preheader: `Your application status for ${data.jobTitle} is ${data.status}`,
      bodyHtml: `
        <p>Hi ${data.applicantName || 'there'},</p>
        <p>Your application has been updated.</p>
        <div style="background:#f8fafc;padding:16px;border-radius:8px;border:1px solid #e5e7eb;">
          <p style="margin:0 0 8px 0;"><strong>Job Title:</strong> ${data.jobTitle}</p>
          <p style="margin:0 0 8px 0;"><strong>Company:</strong> ${data.companyName}</p>
          <p style="margin:0;"><strong>Status:</strong> <span style="background:${getStatusColor(data.status)};color:#fff;padding:4px 10px;border-radius:999px;text-transform:capitalize;">${data.status}</span></p>
        </div>
        ${data.message ? `
          <div style="background:#ffedd5;border-left:4px solid #ff8200;padding:12px 14px;border-radius:6px;margin-top:14px;">
            <p style="margin:0 0 6px 0;color:#065f46;"><strong>Message from employer:</strong></p>
            <p style="margin:0;color:#065f46;white-space:pre-wrap;">${String(data.message).replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>
          </div>
        ` : ''}
        <p style="font-size:14px;color:#4b5563;margin-top:12px;">You can log in to view full details.</p>
      `,
      cta: data.viewUrl ? { label: 'View Application', url: data.viewUrl } : undefined,
      footerNote: data.viewUrl ? `If the button doesn't work, open this link: <br/><a href="${data.viewUrl}" target="_blank" rel="noopener">${data.viewUrl}</a>` : '',
      logoSrc: data.logoSrc
    })
  }),

  passwordReset: (data) => ({
    subject: 'Password Reset Request - kGamify',
    html: renderEmail({
      title: 'Password Reset Request',
      preheader: 'Reset your kGamify account password',
      bodyHtml: `
        <p>Hello,</p>
        <p>We received a request to reset your password for your kGamify account.</p>
        <p style="color:#6b7280;font-size:14px;margin:0;">This link will expire in 1 hour.</p>
      `,
      cta: { label: 'Reset Password', url: data.resetLink },
      footerNote: `If the button doesn't work, open this link: <br/><a href="${data.resetLink}" target="_blank" rel="noopener">${data.resetLink}</a><br/><br/>If you didn't request this, you can safely ignore this email.`,
      logoSrc: data.logoSrc
    })
  }),

  // OTP email for password reset or verification
  otp: (data) => {
    const context = (data.context || 'verify').toLowerCase();
    const isVerify = context === 'verify';
    const subject = isVerify ? 'Email Verification via OTP - kGamify' : 'Password Reset OTP - kGamify';
    const title = isVerify ? 'Email Verification via OTP' : 'Password Reset OTP';
    const pre = isVerify ? 'Use this OTP to complete your registration' : 'Use this OTP to reset your password';
    const line = isVerify
      ? `Use the following OTP to complete your registration. This code will expire in ${data.expiresInMinutes || 10} minutes.`
      : `Use the following OTP to reset your password. This code will expire in ${data.expiresInMinutes || 10} minutes.`;
    const helloName = data.companyName || data.contactName || 'User';
    return ({
      subject,
      html: renderEmail({
        title,
        preheader: pre,
        bodyHtml: `
          <p>Hello, ${helloName}</p>
          <p>${line}</p>
          <div style="font-size:28px;font-weight:bold;letter-spacing:4px;padding:12px 20px;background:#fff7ed;border:1px dashed #fdba74;display:inline-block;border-radius:8px;">
            ${data.code}
          </div>
          <div style="margin-top:16px;">
            <h3 style="margin:0 0 6px 0;font-size:14px;color:#111827;">Disclaimer</h3>
            <p style="margin:0;color:#6b7280;font-size:13px;">If you are not the intended recipient of this OTP, please ignore this email.</p>
          </div>
        `,
        logoSrc: data.logoSrc
      })
    });
  },

  // Company approval notification
  companyApproved: (data) => ({
    subject: 'Your Company Has Been Approved - kGamify',
    html: renderEmail({
      title: 'Company Approved',
      preheader: 'You can now access your kGamify employer account',
      bodyHtml: `
        <p>Hi ${data.contactName || data.companyName || 'there'},</p>
        <p>Your company has been approved on the kGamify Job Portal.</p>
      `,
      cta: { label: 'Go to Login', url: data.loginUrl || `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/,'')}/` },
      footerNote: `If you are not able to log in through the button, use the URL below.<br/><a href="${data.loginUrl || `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/,'')}/` }" target="_blank" rel="noopener">${data.loginUrl || `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/,'')}/`}</a>`,
      logoSrc: data.logoSrc
    })
  }),

  // Notification for a new admin message to a company
  newAdminMessage: (data) => ({
    subject: 'New Message from kGamify Admin Team',
    html: renderEmail({
      title: "You've Got a New Message",
      preheader: 'An administrator has sent you a new message',
      bodyHtml: `
        <p>Hi ${data.companyName || 'there'},</p>
        <p>An administrator has sent you a new message on the kGamify portal.</p>
  <div style="background:#fff7ed;border:1px solid #fdba74;padding:16px;border-radius:8px;margin:14px 0;">
          <p style="margin:0 0 6px 0;font-weight:600;color:#1f2937;">Message Preview:</p>
          <p style="margin:0;color:#374151;white-space:pre-wrap;">${(data.message || '').slice(0,300).replace(/</g,'&lt;').replace(/>/g,'&gt;')}${data.message && data.message.length > 300 ? '…' : ''}</p>
        </div>
        <p style="font-size:14px;color:#4b5563;">Please log in to reply or view the full conversation.</p>
      `,
      cta: { label: 'View Messages', url: data.messagesUrl },
      footerNote: data.messagesUrl ? `If the button doesn't work, open this link: <br/><a href="${data.messagesUrl}" target="_blank" rel="noopener">${data.messagesUrl}</a>` : '',
      logoSrc: data.logoSrc
    })
  }),

  // Company put on hold
  companyOnHold: (data) => ({
    subject: 'Your kGamify Account Is On Hold',
    html: renderEmail({
      title: 'Account On Hold',
      preheader: 'Your company account requires attention',
      bodyHtml: `
        <p>Hi ${data.companyName || 'there'},</p>
        <p>Your account has been placed on hold${data.reason ? ` for the following reason: <strong>${String(data.reason).replace(/</g,'&lt;').replace(/>/g,'&gt;')}</strong>` : ''}.</p>
        <p>Please log in to view messages from the admin team for details and next steps.</p>
      `,
      cta: { label: 'Review Messages', url: data.messagesUrl },
      footerNote: data.messagesUrl ? `If the button doesn't work, open this link: <br/><a href="${data.messagesUrl}" target="_blank" rel="noopener">${data.messagesUrl}</a>` : '',
      logoSrc: data.logoSrc
    })
  }),

  // Company registration denied
  companyDenied: (data) => ({
    subject: 'kGamify Registration Denied',
    html: renderEmail({
      title: 'Registration Denied',
      preheader: 'Your registration was not approved',
      bodyHtml: `
        <p>Hi ${data.companyName || 'there'},</p>
        <p>Your registration was denied${data.reason ? ` for the following reason: <strong>${String(data.reason).replace(/</g,'&lt;').replace(/>/g,'&gt;')}</strong>` : ''}.</p>
        <p>You may re-register after addressing the issues noted by our team.</p>
      `,
      cta: data.messagesUrl ? { label: 'View Messages', url: data.messagesUrl } : undefined,
      footerNote: data.messagesUrl ? `If the button doesn't work, open this link: <br/><a href="${data.messagesUrl}" target="_blank" rel="noopener">${data.messagesUrl}</a>` : '',
      logoSrc: data.logoSrc
    })
  }),

  // Generic/custom email passthrough
  custom: (data) => ({
    subject: data.subject,
    html: data.html,
  })
};

// Helper function for status colors
const getStatusColor = (status) => {
  const colors = {
    'pending': '#f59e0b',
    'reviewing': '#3b82f6',
    'shortlisted': '#10b981',
    'interview': '#8b5cf6',
    'hired': '#059669',
    'rejected': '#dc2626'
  };
  return colors[status.toLowerCase()] || '#6b7280';
};

// Main email sending function
const sendEmail = async (to, template, data) => {
  try {
    const transporter = createTransporter();
    if (!emailTemplates[template]) {
      throw new Error(`Unknown email template: ${template}`);
    }
    // Decide logo strategy and optionally embed as CID
    const attachments = [];
    const { logoSrc, embed, frontend } = resolveLogo();
    if (embed) {
      // try reading local image file first
      const candidates = [
        path.resolve(__dirname, '../../src/assets/KLOGO.png'),
        path.resolve(__dirname, '../../public/KLOGO.png')
      ];
      let content = null;
      for (const p of candidates) {
        try {
          if (fs.existsSync(p)) {
            content = fs.readFileSync(p);
            break;
          }
        } catch {
          if (process.env.NODE_ENV !== 'production') {
            // ignore read errors
          }
        }
      }
      if (content) {
        attachments.push({ filename: 'logo.png', content, cid: 'brandlogo@kgamify' });
      } else {
        // fallback: let nodemailer fetch and embed from a URL
        attachments.push({ filename: 'logo.png', path: `${frontend}/KLOGO.png`, cid: 'brandlogo@kgamify' });
      }
    }

    const emailContent = emailTemplates[template]({ ...data, logoSrc });

    const mailOptions = {
      from: {
        name: 'kGamify Job Portal',
        address: process.env.SMTP_EMAIL,
      },
      to,
      subject: emailContent.subject,
      html: emailContent.html,
      attachments: attachments.length ? attachments : undefined
    };

  const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Bulk email sending for notifications
const sendBulkEmails = async (recipients, template, data) => {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const result = await sendEmail(recipient, template, data);
      results.push({ email: recipient, ...result });
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      results.push({ email: recipient, success: false, error: error.message });
    }
  }
  
  return results;
};

// Email verification
const sendVerificationEmail = async (email, verificationToken) => {
  const base = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const verificationLink = `${base}/verify-email?token=${verificationToken}`;
  const { logoSrc } = resolveLogo();

  const emailContent = {
    subject: 'Verify Your Email - kGamify',
    html: renderEmail({
      title: 'Verify Your Email',
      preheader: 'Confirm your email address to finish signing up',
      bodyHtml: `
        <p>Welcome to kGamify!</p>
        <p>Thank you for registering. Please verify your email address to complete your registration.</p>
      `,
      cta: { label: 'Verify Email Address', url: verificationLink },
      footerNote: `If the button doesn't work, open this link: <br/><a href="${verificationLink}" target="_blank" rel="noopener">${verificationLink}</a><br/><br/>If you didn't create this account, please ignore this email.`,
      logoSrc,
      
    })
  };

  return await sendEmail(email, 'custom', emailContent);
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  sendVerificationEmail,
  emailTemplates
};
