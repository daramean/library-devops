const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const crypto  = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { query }      = require('../config/database');
const { getRedis }   = require('../config/redis');
const { logActivity }= require('../utils/activityLogger');
const AppError       = require('../utils/AppError');
const logger         = require('../utils/logger');
const { sendPasswordResetEmail } = require('../utils/emailService');

const SALT_ROUNDS  = 12;
const ACCESS_TTL   = process.env.JWT_EXPIRES_IN       || '7d';
const REFRESH_TTL  = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

// ── Helpers ──────────────────────────────────────────
function signAccess(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role_name },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

function signRefresh(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TTL }
  );
}

// ── Register ─────────────────────────────────────────
exports.register = async (req, res) => {
  const { full_name, email, password, phone } = req.body;

  const exists = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (exists.rows.length) throw new AppError('Email already registered', 409);

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const { rows } = await query(
    `INSERT INTO users (full_name, email, password_hash, phone)
     VALUES ($1, $2, $3, $4)
     RETURNING id, full_name, email, role_id, created_at`,
    [full_name, email, hash, phone || null]
  );

  const user = rows[0];
  await logActivity(user.id, 'user.register', 'user', user.id, req);

  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user },
  });
};

// ── Login ────────────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body;

  const { rows } = await query(
    `SELECT u.*, r.name AS role_name
     FROM users u
     JOIN roles r ON u.role_id = r.id
     WHERE u.email = $1
       AND u.is_active = TRUE`,
    [email]
  );

  const user = rows[0];
  if (!user) throw new AppError('Invalid credentials', 401);

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) throw new AppError('Invalid credentials', 401);

  // Update last login
  await query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

  const accessToken  = signAccess(user);
  const refreshToken = signRefresh(user.id);

  const redis = getRedis();
  // Store refresh token in Redis (30d TTL)
  await redis.set(`refresh:${user.id}`, refreshToken, 'EX', 60 * 60 * 24 * 30);

  await logActivity(user.id, 'user.login', 'user', user.id, req);

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: {
        id:        user.id,
        full_name: user.full_name,
        email:     user.email,
        role:      user.role_name,
        avatar_url:user.avatar_url,
      },
    },
  });
};

// ── Refresh Token ────────────────────────────────────
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('Refresh token required', 400);

  let payload;
  try {
    payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const redis = getRedis();
  const stored = await redis.get(`refresh:${payload.id}`);
  if (stored !== refreshToken) throw new AppError('Token revoked', 401);

  const { rows } = await query(
    `SELECT u.*, r.name AS role_name FROM users u
     JOIN roles r ON u.role_id = r.id WHERE u.id = $1`,
    [payload.id]
  );
  if (!rows[0]) throw new AppError('User not found', 404);

  const newAccess  = signAccess(rows[0]);
  const newRefresh = signRefresh(payload.id);

  await redis.set(`refresh:${payload.id}`, newRefresh, 'EX', 60 * 60 * 24 * 30);

  res.json({ success: true, data: { accessToken: newAccess, refreshToken: newRefresh } });
};

// ── Logout ───────────────────────────────────────────
exports.logout = async (req, res) => {
  const redis = getRedis();
  await redis.del(`refresh:${req.user.id}`);
  await logActivity(req.user.id, 'user.logout', 'user', req.user.id, req);
  res.json({ success: true, message: 'Logged out successfully' });
};

// ── Get Me ───────────────────────────────────────────
exports.getMe = async (req, res) => {
  const { rows } = await query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url,
            u.is_email_verified, u.last_login, u.created_at,
            r.name AS role
     FROM users u JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1`,
    [req.user.id]
  );
  if (!rows[0]) throw new AppError('User not found', 404);
  res.json({ success: true, data: rows[0] });
};

// ── Forgot Password ──────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) throw new AppError('Email is required', 400);
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new AppError('Invalid email format', 400);
  }

  const { rows } = await query(
    'SELECT id, full_name, email FROM users WHERE email = $1 AND is_active = TRUE',
    [email]
  );

  const user = rows[0];
  if (!user) {
    // For security, don't reveal if email exists
    return res.json({
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.',
    });
  }

  // Generate reset token (random 32 bytes)
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

  // Save token to database
  await query(
    'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
    [resetTokenHash, resetTokenExpires, user.id]
  );

  // Build reset link
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

  // Send email
  try {
    await sendPasswordResetEmail(user.email, resetToken, resetLink);
    await logActivity(user.id, 'password.reset_requested', 'user', user.id, req);
  } catch (error) {
    // Clear token if email fails
    await query('UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = $1', [user.id]);
    throw new AppError('Failed to send reset email. Please try again.', 500);
  }

  res.json({
    success: true,
    message: 'If an account exists with this email, a password reset link has been sent.',
  });
};

// ── Reset Password ───────────────────────────────────
exports.resetPassword = async (req, res) => {
  const { token, password, passwordConfirm } = req.body;

  if (!token || !password || !passwordConfirm) {
    throw new AppError('Token, password, and password confirmation are required', 400);
  }

  if (password !== passwordConfirm) {
    throw new AppError('Passwords do not match', 400);
  }

  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }

  // Hash the provided token to compare with stored hash
  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with matching token that hasn't expired
  const { rows } = await query(
    `SELECT id, email, full_name FROM users
     WHERE reset_token = $1
       AND reset_token_expires > NOW()
       AND is_active = TRUE`,
    [resetTokenHash]
  );

  const user = rows[0];
  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // Hash new password
  const SALT_ROUNDS = 12;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Update password and clear reset token
  await query(
    `UPDATE users
     SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL
     WHERE id = $2`,
    [passwordHash, user.id]
  );

  await logActivity(user.id, 'password.reset_completed', 'user', user.id, req);

  res.json({
    success: true,
    message: 'Password has been reset successfully. You can now log in with your new password.',
  });
};

// ── Update Profile ───────────────────────────────────
exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  let profilePicUrl = null;

  // If a file was uploaded, construct the URL
  if (req.file) {
    profilePicUrl = `/uploads/${req.file.filename}`;
  }

  // If there's a profile picture to update
  if (profilePicUrl) {
    await query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2',
      [profilePicUrl, userId]
    );
    await logActivity(userId, 'profile.picture_updated', 'user', userId, req);
  }

  // Fetch updated user data
  const { rows } = await query(
    `SELECT u.id, u.full_name, u.email, u.phone, u.avatar_url,
            u.is_email_verified, u.last_login, u.created_at,
            r.name AS role
     FROM users u JOIN roles r ON u.role_id = r.id
     WHERE u.id = $1`,
    [userId]
  );

  if (!rows[0]) throw new AppError('User not found', 404);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: rows[0],
  });
};

// ── Change Password ──────────────────────────────────
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword, passwordConfirm } = req.body;

  if (!oldPassword || !newPassword || !passwordConfirm) {
    throw new AppError('All password fields are required', 400);
  }

  if (newPassword !== passwordConfirm) {
    throw new AppError('New passwords do not match', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('Password must be at least 6 characters long', 400);
  }

  // Fetch current user with password hash
  const { rows } = await query(
    'SELECT id, password_hash FROM users WHERE id = $1',
    [userId]
  );

  const user = rows[0];
  if (!user) throw new AppError('User not found', 404);

  // Verify old password
  const oldPasswordMatches = await bcrypt.compare(oldPassword, user.password_hash);
  if (!oldPasswordMatches) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password
  await query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [newPasswordHash, userId]
  );

  await logActivity(userId, 'password.changed', 'user', userId, req);

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
};
