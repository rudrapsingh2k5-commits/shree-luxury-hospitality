import nodemailer from 'nodemailer';

/**
 * Check if SMTP delivery is configured in environment
 */
export const isEmailConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

/**
 * Create transport instance if configured
 */
const getTransporter = () => {
  if (!isEmailConfigured()) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

/**
 * Dispatch verification email
 */
export const sendVerificationEmail = async ({ to, name, token }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const verificationUrl = `${clientUrl}/verify-email?token=${token}`;

  const transporter = getTransporter();
  if (!transporter) {
    console.warn(
      `[Mailer Notice] Outbound email service is not configured (SMTP credentials absent). ` +
      `Verification link generated for account ${to}: ${verificationUrl}`
    );
    return { delivered: false, reason: 'SMTP not configured in environment' };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"SHREE Luxury Stays" <no-reply@shreehotels.com>',
    to,
    subject: 'Verify your SHREE Luxury Hospitality account',
    text: `Namaste ${name},\n\nPlease verify your email address by visiting this link: ${verificationUrl}\n\nThis link will expire in 24 hours.\n\nSHREE Hospitality`,
    html: `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E5E0D8; border-radius: 8px;">
        <h2 style="color: #1A3026; font-family: serif; margin-bottom: 12px;">SHREE श्री — Email Verification</h2>
        <p style="color: #4A524D; font-size: 15px; line-height: 1.6;">Namaste <strong>${name}</strong>,</p>
        <p style="color: #4A524D; font-size: 15px; line-height: 1.6;">Thank you for registering with SHREE Luxury Hospitality. Please click below to verify your email address and activate your member privileges:</p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="${verificationUrl}" style="background-color: #1A3026; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="color: #7A827D; font-size: 13px; line-height: 1.5;">Or copy and paste this address into your browser:<br/><span style="color: #C59B27;">${verificationUrl}</span></p>
        <p style="color: #7A827D; font-size: 12px; margin-top: 24px; border-top: 1px solid #EFE8DD; padding-top: 12px;">This single-use link expires in 24 hours. If you did not create an account, please disregard this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { delivered: true };
  } catch (err) {
    console.error(`[Mailer Error] Failed to dispatch verification email to ${to}:`, err.message);
    return { delivered: false, error: err.message };
  }
};

/**
 * Dispatch password reset email
 */
export const sendPasswordResetEmail = async ({ to, name, token }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password?token=${token}`;

  const transporter = getTransporter();
  if (!transporter) {
    console.warn(
      `[Mailer Notice] Outbound email service is not configured (SMTP credentials absent). ` +
      `Password reset link generated for ${to}: ${resetUrl}`
    );
    return { delivered: false, reason: 'SMTP not configured in environment' };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"SHREE Luxury Stays" <no-reply@shreehotels.com>',
    to,
    subject: 'Password Reset Request — SHREE Luxury Stays',
    text: `Namaste ${name || 'Guest'},\n\nA password reset request was received for your account. Reset your password using this link: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nSHREE Hospitality`,
    html: `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #E5E0D8; border-radius: 8px;">
        <h2 style="color: #1A3026; font-family: serif; margin-bottom: 12px;">SHREE श्री — Password Reset</h2>
        <p style="color: #4A524D; font-size: 15px; line-height: 1.6;">Namaste <strong>${name || 'Guest'}</strong>,</p>
        <p style="color: #4A524D; font-size: 15px; line-height: 1.6;">We received a request to reset your password. Click the button below to choose a new secure password:</p>
        <div style="margin: 28px 0; text-align: center;">
          <a href="${resetUrl}" style="background-color: #1A3026; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #7A827D; font-size: 13px; line-height: 1.5;">Or copy and paste this link into your browser:<br/><span style="color: #C59B27;">${resetUrl}</span></p>
        <p style="color: #7A827D; font-size: 12px; margin-top: 24px; border-top: 1px solid #EFE8DD; padding-top: 12px;">This single-use link expires in 1 hour. If you did not request a password reset, your password remains unchanged.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { delivered: true };
  } catch (err) {
    console.error(`[Mailer Error] Failed to dispatch password reset email to ${to}:`, err.message);
    return { delivered: false, error: err.message };
  }
};
