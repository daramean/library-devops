const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query }      = require('../config/database');
const { getRedis }   = require('../config/redis');
const { logActivity }= require('../utils/activityLogger');
const AppError       = require('../utils/AppError');
const logger         = require('../utils/logger');

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
