const jwt    = require('jsonwebtoken');
const AppError = require('../utils/AppError');

// ── Verify JWT ────────────────────────────────────────
exports.protect = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) throw new AppError('Not authenticated', 401);

  const token = auth.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
};

// ── Role Guard ────────────────────────────────────────
exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    throw new AppError('You do not have permission to perform this action', 403);
  }
  next();
};
