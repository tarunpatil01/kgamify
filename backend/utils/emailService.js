const nodemailer = require('nodemailer');

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

// Email templates
const emailTemplates = {
  jobApplication: (data) => ({
    subject: `New Application for ${data.jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">New Job Application Received</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-bottom: 15px;">Application Details</h3>
          <p><strong>Job Title:</strong> ${data.jobTitle}</p>
          <p><strong>Company:</strong> ${data.companyName}</p>
          <p><strong>Applicant Name:</strong> ${data.applicantName}</p>
          <p><strong>Applicant Email:</strong> ${data.applicantEmail}</p>
          <p><strong>Applied On:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
          <p style="margin: 0; color: #065f46;"><strong>Cover Letter:</strong></p>
          <p style="margin: 10px 0 0 0; color: #065f46;">${data.coverLetter || 'No cover letter provided'}</p>
        </div>
        <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px;">
          <p style="margin: 0; color: #92400e;">Please log in to your dashboard to review the application and download the resume.</p>
        </div>
      </div>
    `
  }),

  jobPosted: (data) => ({
    subject: `Job Posted Successfully: ${data.jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Job Posted Successfully!</h2>
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-bottom: 15px;">Job Details</h3>
          <p><strong>Job Title:</strong> ${data.jobTitle}</p>
          <p><strong>Company:</strong> ${data.companyName}</p>
          <p><strong>Location:</strong> ${data.location}</p>
          <p><strong>Salary:</strong> ${data.salary ? `$${data.salary.toLocaleString()}` : 'Not specified'}</p>
          <p><strong>Posted On:</strong> ${new Date().toLocaleDateString()}</p>
        </div>
        <div style="margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/dashboard" 
             style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View in Dashboard
          </a>
        </div>
      </div>
    `
  }),

  applicationStatusUpdate: (data) => ({
    subject: `Application Status Update: ${data.jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Application Status Update</h2>
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Job Title:</strong> ${data.jobTitle}</p>
          <p><strong>Company:</strong> ${data.companyName}</p>
          <p><strong>Status:</strong> 
            <span style="background: ${getStatusColor(data.status)}; color: white; padding: 4px 12px; border-radius: 4px;">
              ${data.status}
            </span>
          </p>
        </div>
        ${data.message ? `
          <div style="background: #ecfdf5; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981;">
            <p style="margin: 0; color: #065f46;"><strong>Message from employer:</strong></p>
            <p style="margin: 10px 0 0 0; color: #065f46;">${data.message}</p>
          </div>
        ` : ''}
      </div>
    `
  }),

  passwordReset: (data) => ({
    subject: 'Password Reset Request - KGamify',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Password Reset Request</h2>
        <p>Hello,</p>
        <p>We received a request to reset your password for your KGamify account.</p>
        <div style="margin: 30px 0;">
          <a href="${data.resetLink}" 
             style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
        </p>
      </div>
    `
  }),

  // OTP email for password reset or verification
  otp: (data) => ({
    subject: 'Your KGamify OTP Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">One-Time Password (OTP)</h2>
        <p>Hello${data.name ? ` ${data.name}` : ''},</p>
        <p>Use the following OTP to complete your request:</p>
        <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 12px 20px; background: #f8fafc; border: 1px dashed #cbd5e1; display: inline-block; border-radius: 8px;">
          ${data.code}
        </div>
        <p style="margin-top: 16px; color: #6b7280; font-size: 14px;">This code expires in ${data.expiresInMinutes || 10} minutes.</p>
        <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `
  }),

  // Company approval notification
  companyApproved: (data) => ({
    subject: 'Your Company Has Been Approved - KGamify',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Congratulations!</h2>
        <p>Hi ${data.contactName || data.companyName || 'there'},</p>
        <p>Your company <strong>${data.companyName}</strong> has been approved on KGamify.</p>
        <p>You can now log in and start posting jobs and managing applications.</p>
        <div style="margin-top: 24px;">
          <a href="${data.loginUrl || (process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/login` : 'http://localhost:5173/login')}" 
             style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Go to Login
          </a>
        </div>
        <p style="margin-top: 24px; color: #6b7280; font-size: 12px;">If you have questions, reply to this email.</p>
      </div>
    `
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
    const emailContent = emailTemplates[template](data);

    const mailOptions = {
      from: {
        name: 'KGamify Job Portal',
        address: process.env.SMTP_EMAIL || 'natheprasad17@gmail.com'
      },
      to,
      subject: emailContent.subject,
      html: emailContent.html
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
  const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  const emailContent = {
    subject: 'Verify Your Email - KGamify',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3b82f6;">Welcome to KGamify!</h2>
        <p>Thank you for registering with KGamify. Please verify your email address to complete your registration.</p>
        <div style="margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't create this account, please ignore this email.
        </p>
      </div>
    `
  };

  return await sendEmail(email, 'custom', emailContent);
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  sendVerificationEmail,
  emailTemplates
};
