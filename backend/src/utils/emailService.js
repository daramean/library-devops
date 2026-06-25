const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @param {string} resetToken - Password reset token
 * @param {string} resetLink - Full password reset link (URL)
 */
async function sendPasswordResetEmail(email, resetToken, resetLink) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@library.local',
      to: email,
      subject: 'Password Reset Request - OBITO STORE Library',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">OBITO STORE Library</h1>
            <p style="margin: 5px 0 0 0;">Password Reset Request</p>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
            <p>Hello,</p>
            
            <p>We received a request to reset your password. Click the button below to create a new password.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 12px; color: #666;">
              Or copy and paste this link in your browser:<br>
              <code style="background: #f0f0f0; padding: 5px; display: block; word-break: break-all; margin-top: 10px;">
                ${resetLink}
              </code>
            </p>
            
            <p style="color: #666; font-size: 13px; margin-top: 20px;">
              <strong>Important:</strong> This link will expire in 1 hour. If you did not request this, please ignore this email or contact support.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px;">
              © 2024 OBITO STORE Library. All rights reserved.<br>
              <a href="https://library.local" style="color: #667eea; text-decoration: none;">Visit our website</a>
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error('Failed to send password reset email:', error);
    throw new Error('Failed to send email. Please try again later.');
  }
}

/**
 * Send welcome email
 * @param {string} email - User's email address
 * @param {string} fullName - User's full name
 */
async function sendWelcomeEmail(email, fullName) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@library.local',
      to: email,
      subject: 'Welcome to OBITO STORE Library',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">Welcome to OBITO STORE Library</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
            <p>Hello ${fullName},</p>
            
            <p>Welcome to OBITO STORE Library! Your account has been successfully created.</p>
            
            <p>You can now:</p>
            <ul style="color: #666;">
              <li>Browse our collection of books</li>
              <li>Borrow books and manage your profile</li>
              <li>View your borrow history and fines</li>
              <li>Receive notifications about due dates</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://library.local/dashboard" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px;">
              © 2024 OBITO STORE Library. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Welcome email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error('Failed to send welcome email:', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Send notification email
 * @param {string} email - User's email
 * @param {string} title - Email title
 * @param {string} message - Email message
 */
async function sendNotificationEmail(email, title, message) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@library.local',
      to: email,
      subject: `${title} - OBITO STORE Library`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; color: white; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="margin: 0;">${title}</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb;">
            <p>${message}</p>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <p style="color: #999; font-size: 12px;">
              © 2024 OBITO STORE Library. All rights reserved.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    logger.error('Failed to send notification email:', error);
    throw error;
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendNotificationEmail,
};
