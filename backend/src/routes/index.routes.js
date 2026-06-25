// ═══════════════════════════════════════════
//  borrow.routes.js
// ═══════════════════════════════════════════
const express  = require('express');
const borrowRouter = express.Router();
const borrowCtrl   = require('../controllers/borrow.controller');
const { protect, restrictTo } = require('../middleware/auth.middleware');

borrowRouter.use(protect);
borrowRouter.post  ('/',                   borrowCtrl.borrowBook);
borrowRouter.post  ('/return',             borrowCtrl.returnBook);
borrowRouter.post  ('/:id/approve',        restrictTo('admin','librarian'), borrowCtrl.approveBorrow);
borrowRouter.post  ('/:id/reject',         restrictTo('admin','librarian'), borrowCtrl.rejectBorrow);
borrowRouter.post  ('/:id/cancel',         borrowCtrl.cancelBorrow);
borrowRouter.get   ('/',                   borrowCtrl.getBorrowHistory);
borrowRouter.get   ('/overdue',            restrictTo('admin','librarian'), borrowCtrl.getOverdueBooks);

// ═══════════════════════════════════════════
//  dashboard.routes.js
// ═══════════════════════════════════════════
const dashRouter  = express.Router();
const dashCtrl    = require('../controllers/dashboard.controller');

dashRouter.use(protect);
dashRouter.get('/admin', restrictTo('admin','librarian'), dashCtrl.getAdminStats);
dashRouter.get('/user',  dashCtrl.getUserStats);

// ═══════════════════════════════════════════
//  category.routes.js
// ═══════════════════════════════════════════
const catRouter = express.Router();
const { query } = require('../config/database');

catRouter.get('/', async (req, res) => {
  const { rows } = await query('SELECT * FROM categories ORDER BY name');
  res.json({ success: true, data: rows });
});
catRouter.post('/', protect, restrictTo('admin'), async (req, res) => {
  const { name, description, color } = req.body;
  const { rows } = await query(
    'INSERT INTO categories (name, description, color) VALUES ($1,$2,$3) RETURNING *',
    [name, description, color]
  );
  res.status(201).json({ success: true, data: rows[0] });
});

// ═══════════════════════════════════════════
//  user.routes.js
// ═══════════════════════════════════════════
const userRouter = express.Router();

userRouter.use(protect);
userRouter.get('/', restrictTo('admin'), async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const offset = (page - 1) * limit;
  let sql = `SELECT u.id, u.full_name, u.email, u.phone, u.is_active, u.created_at,
                    r.name AS role, u.last_login,
                    (SELECT COUNT(*) FROM borrow_records WHERE user_id = u.id AND status = 'borrowed') AS active_borrows
             FROM users u JOIN roles r ON u.role_id = r.id`;
  const params = [];
  if (search) {
    sql += ` WHERE u.full_name ILIKE $1 OR u.email ILIKE $1`;
    params.push(`%${search}%`);
  }
  sql += ` ORDER BY u.created_at DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
  params.push(limit, offset);
  const { rows } = await require('../config/database').query(sql, params);
  res.json({ success: true, data: rows });
});

userRouter.post('/', restrictTo('admin'), async (req, res) => {
  const { full_name, email, password, phone, role = 'user' } = req.body;
  if (!full_name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Full name, email and password are required' });
  }

  const db = require('../config/database');
  const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (exists.rows.length) {
    return res.status(409).json({ success: false, message: 'Email already registered' });
  }

  const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', [role]);
  const roleId = roleResult.rows[0]?.id || 3;

  const bcrypt = require('bcryptjs');
  const SALT_ROUNDS = 12;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const { rows } = await db.query(
    `INSERT INTO users (full_name, email, password_hash, phone, role_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, full_name, email, phone, is_active, created_at`,
    [full_name, email, passwordHash, phone || null, roleId]
  );

  res.status(201).json({ success: true, data: rows[0] });
});

userRouter.put('/:id/toggle', restrictTo('admin'), async (req, res) => {
  const { rows } = await require('../config/database').query(
    'UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING id, is_active',
    [req.params.id]
  );
  res.json({ success: true, data: rows[0] });
});

userRouter.put('/:id/password', restrictTo('admin'), async (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required' });
  }

  const db = require('../config/database');
  const bcrypt = require('bcryptjs');
  const SALT_ROUNDS = 12;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const { rows } = await db.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, full_name, email',
    [passwordHash, req.params.id]
  );

  if (!rows.length) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  res.json({ success: true, data: rows[0] });
});

// ═══════════════════════════════════════════
//  fine.routes.js
// ═══════════════════════════════════════════
const fineRouter = express.Router();
fineRouter.use(protect);
fineRouter.get('/', async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const sql = isAdmin
    ? `SELECT f.*, u.full_name, u.email, b.title FROM fines f
       JOIN users u ON f.user_id = u.id
       JOIN borrow_records br ON f.borrow_id = br.id
       JOIN books b ON br.book_id = b.id
       ORDER BY f.created_at DESC`
    : `SELECT f.*, b.title FROM fines f
       JOIN borrow_records br ON f.borrow_id = br.id
       JOIN books b ON br.book_id = b.id
       WHERE f.user_id = $1 ORDER BY f.created_at DESC`;
  const params = isAdmin ? [] : [req.user.id];
  const { rows } = await require('../config/database').query(sql, params);
  res.json({ success: true, data: rows });
});
fineRouter.post('/:id/pay', restrictTo('admin'), async (req, res) => {
  const { rows } = await require('../config/database').query(
    `UPDATE fines SET is_paid = TRUE, paid_at = NOW()
     WHERE id = $1 RETURNING *`, [req.params.id]
  );
  res.json({ success: true, data: rows[0] });
});

// ═══════════════════════════════════════════
//  notification.routes.js
// ═══════════════════════════════════════════
const notifRouter = express.Router();
notifRouter.use(protect);
notifRouter.get('/', async (req, res) => {
  const { rows } = await require('../config/database').query(
    `SELECT * FROM notifications WHERE user_id = $1
     ORDER BY created_at DESC LIMIT 50`, [req.user.id]
  );
  res.json({ success: true, data: rows });
});
notifRouter.put('/read-all', async (req, res) => {
  await require('../config/database').query(
    'UPDATE notifications SET is_read = TRUE WHERE user_id = $1', [req.user.id]
  );
  res.json({ success: true });
});
notifRouter.post('/admin', async (req, res) => {
  const { title, message, type = 'info', userId, bookId } = req.body;
  const { query } = require('../config/database');
  
  // Get all admins and librarians to send them notifications
  const { rows: admins } = await query(
    `SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name IN ('admin', 'librarian')`
  );
  
  // Insert notification for each admin
  const promises = admins.map(admin => 
    query(
      `INSERT INTO notifications (user_id, title, message, type, created_at, is_read)
       VALUES ($1, $2, $3, $4, NOW(), FALSE)`,
      [admin.id, title, message, type]
    )
  );
  
  await Promise.all(promises);
  res.status(201).json({ success: true, message: 'Admin notification sent' });
});

// ═══════════════════════════════════════════
//  activity.routes.js
// ═══════════════════════════════════════════
const actRouter = express.Router();
actRouter.use(protect, restrictTo('admin'));
actRouter.get('/', async (req, res) => {
  const { rows } = await require('../config/database').query(
    `SELECT al.*, u.full_name, u.email FROM activity_logs al
     LEFT JOIN users u ON al.user_id = u.id
     ORDER BY al.created_at DESC LIMIT 100`
  );
  res.json({ success: true, data: rows });
});

// ═══════════════════════════════════════════
//  reservation.routes.js
// ═══════════════════════════════════════════
const resRouter = express.Router();
resRouter.use(protect);
resRouter.post('/', async (req, res) => {
  const { book_id } = req.body;
  const { rows } = await require('../config/database').query(
    `INSERT INTO reservations (user_id, book_id) VALUES ($1,$2) RETURNING *`,
    [req.user.id, book_id]
  );
  res.status(201).json({ success: true, data: rows[0] });
});
resRouter.get('/', async (req, res) => {
  const { rows } = await require('../config/database').query(
    `SELECT r.*, b.title, b.author, b.cover_url FROM reservations r
     JOIN books b ON r.book_id = b.id
     WHERE r.user_id = $1 AND r.status = 'pending'`, [req.user.id]
  );
  res.json({ success: true, data: rows });
});
resRouter.delete('/:id', async (req, res) => {
  await require('../config/database').query(
    `UPDATE reservations SET status='cancelled' WHERE id=$1 AND user_id=$2`,
    [req.params.id, req.user.id]
  );
  res.json({ success: true });
});

module.exports = {
  borrowRoutes:       borrowRouter,
  dashboardRoutes:    dashRouter,
  categoryRoutes:     catRouter,
  userRoutes:         userRouter,
  fineRoutes:         fineRouter,
  notificationRoutes: notifRouter,
  activityRoutes:     actRouter,
  reservationRoutes:  resRouter,
};
