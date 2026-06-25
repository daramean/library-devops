// ── auth.routes.js ────────────────────────────────────
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const rateLimit   = require('express-rate-limit');
const upload = require('../middleware/upload');

// Apply strict rate limiting only in production to avoid blocking local/dev workflows
let authLimiter = (req, res, next) => next();
if (process.env.NODE_ENV === 'production') {
  authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                  // limit each IP to 20 requests per windowMs
    message: 'Too many attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
}

router.post('/register',           authLimiter, ctrl.register);
router.post('/login',              authLimiter, ctrl.login);
router.post('/refresh',            ctrl.refreshToken);
router.post('/logout',             protect, ctrl.logout);
router.get ('/me',                 protect, ctrl.getMe);
router.put ('/profile',            protect, upload.single('profilePic'), ctrl.updateProfile);
router.post('/change-password',    protect, ctrl.changePassword);
router.post('/forgot-password',    authLimiter, ctrl.forgotPassword);
router.post('/reset-password',     authLimiter, ctrl.resetPassword);

module.exports = router;
