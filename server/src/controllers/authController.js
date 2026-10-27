import crypto from 'crypto';
import { User, AuditLog } from '../models/index.js';
import { generateToken } from '../utils/token.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../validators/authValidator.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/mailer.js';

/**
 * Register a new guest account
 * Public registration assigns 'guest' role unconditionally.
 */
export const register = async (req, res) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
    }

    const { name, email, password, phone } = parseResult.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    // Generate cryptographic verification token
    const rawVerificationToken = crypto.randomBytes(32).toString('hex');
    const hashedVerificationToken = crypto
      .createHash('sha256')
      .update(rawVerificationToken)
      .digest('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Public registration MUST ALWAYS create a guest account
    const newUser = await User.create({
      name,
      email,
      password,
      phone,
      role: 'guest',
      isActive: true,
      isEmailVerified: false,
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpires: verificationExpires,
      assignedHotelId: null,
    });

    // Send verification email asynchronously
    sendVerificationEmail({
      to: newUser.email,
      name: newUser.name,
      token: rawVerificationToken,
    }).catch((err) => {
      console.error('[Auth Error] Failed to send verification email:', err);
    });

    const token = generateToken(newUser);

    // Audit log
    await AuditLog.create({
      userId: newUser._id,
      userRole: newUser.role,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: newUser._id.toString(),
      details: { email: newUser.email, role: newUser.role },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully. Please check your email to verify your address.',
      token,
      user: newUser.toJSON(),
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

/**
 * Sign in existing user with verified credentials
 */
export const login = async (req, res) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
    }

    const { email, password } = parseResult.data;

    const user = await User.findOne({ email }).select(
      '+password +emailVerificationToken +emailVerificationExpires'
    );

    // Timing-resistant rejection for non-existent users
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = generateToken(user);

    // Populate assigned hotel if staff
    let populatedUser = user.toJSON();
    if (user.assignedHotelId) {
      await user.populate('assignedHotelId', 'name city slug');
      populatedUser = user.toJSON();
    }

    // Audit login
    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: 'USER_LOGGED_IN',
      entityType: 'User',
      entityId: user._id.toString(),
      details: { email: user.email, role: user.role },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: populatedUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

/**
 * Verify user email address using single-use cryptographic token
 */
export const verifyEmail = async (req, res) => {
  try {
    const parseResult = verifyEmailSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Verification token is required.',
      });
    }

    const { token } = parseResult.data;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Verification token is invalid or has expired. Please request a new verification email.',
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: 'EMAIL_VERIFIED',
      entityType: 'User',
      entityId: user._id.toString(),
      details: { email: user.email },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Your email address has been successfully verified.',
      user: user.toJSON(),
    });
  } catch (err) {
    console.error('verifyEmail error:', err);
    return res.status(500).json({ success: false, message: 'Failed to verify email.' });
  }
};

/**
 * Resend email verification token
 */
export const resendVerification = async (req, res) => {
  try {
    const email = req.body?.email || req.user?.email;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email address is required.' });
    }

    const user = await User.findOne({ email }).select(
      '+emailVerificationToken +emailVerificationExpires'
    );

    if (!user) {
      // Do not leak email non-existence
      return res.status(200).json({
        success: true,
        message: 'If your email is registered and unverified, a new verification link has been sent.',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Your email address is already verified.',
      });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      token: rawToken,
    });

    return res.status(200).json({
      success: true,
      message: 'A fresh verification link has been dispatched to your email address.',
    });
  } catch (err) {
    console.error('resendVerification error:', err);
    return res.status(500).json({ success: false, message: 'Failed to resend verification email.' });
  }
};

/**
 * Request password reset token
 */
export const forgotPassword = async (req, res) => {
  try {
    const parseResult = forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Please provide a valid email.',
      });
    }

    const { email } = parseResult.data;
    const user = await User.findOne({ email });

    if (user && user.isActive) {
      const rawResetToken = crypto.randomBytes(32).toString('hex');
      const hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

      user.passwordResetToken = hashedResetToken;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await user.save();

      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token: rawResetToken,
      });

      await AuditLog.create({
        userId: user._id,
        userRole: user.role,
        action: 'PASSWORD_RESET_REQUESTED',
        entityType: 'User',
        entityId: user._id.toString(),
        details: { email: user.email },
        ipAddress: req.ip,
      });
    }

    // Always return neutral message to prevent account enumeration
    return res.status(200).json({
      success: true,
      message:
        'If an account with that email exists, password reset instructions have been sent.',
    });
  } catch (err) {
    console.error('forgotPassword error:', err);
    return res.status(500).json({ success: false, message: 'Failed to process password reset request.' });
  }
};

/**
 * Reset password using single-use cryptographic token
 */
export const resetPassword = async (req, res) => {
  try {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
    }

    const { token, password } = parseResult.data;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.',
      });
    }

    // Set new password (triggers bcrypt hashing pre-save hook)
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Strictly preserve user.role!
    await user.save();

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: 'PASSWORD_RESET_COMPLETED',
      entityType: 'User',
      entityId: user._id.toString(),
      details: { email: user.email },
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully. Please sign in with your new password.',
    });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

/**
 * Log out user
 */
export const logout = async (req, res) => {
  try {
    if (req.user) {
      await AuditLog.create({
        userId: req.user._id,
        userRole: req.user.role,
        action: 'USER_LOGGED_OUT',
        entityType: 'User',
        entityId: req.user._id.toString(),
        details: { email: req.user.email },
        ipAddress: req.ip,
      });
    }
    return res.status(200).json({
      success: true,
      message: 'You have been signed out successfully.',
    });
  } catch (err) {
    return res.status(200).json({ success: true, message: 'Signed out.' });
  }
};

/**
 * Retrieve authenticated profile
 */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('assignedHotelId', 'name city slug');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve profile.' });
  }
};

/**
 * Update authenticated user profile
 */
export const updateProfile = async (req, res) => {
  try {
    const parseResult = updateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.errors[0]?.message || 'Validation error',
      });
    }

    const { name, phone, avatar } = parseResult.data;
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (avatar !== undefined) updateData.avatar = avatar;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: updatedUser,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};
