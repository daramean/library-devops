const { query } = require('../config/database');

// ── Admin Dashboard ───────────────────────────────────
exports.getAdminStats = async (req, res) => {
  const [books, users, borrows, overdue, fines, recent] = await Promise.all([
    query(`SELECT COUNT(*) AS total, SUM(available_copies) AS available,
                  SUM(total_copies - available_copies) AS borrowed
           FROM books WHERE is_active = TRUE`),
    query(`SELECT COUNT(*) AS total FROM users WHERE is_active = TRUE`),
    query(`SELECT COUNT(*) AS total FROM borrow_records WHERE status IN ('borrowed','overdue')`),
    query(`SELECT COUNT(*) AS total FROM borrow_records WHERE status = 'overdue'`),
    query(`SELECT COALESCE(SUM(amount),0) AS total, COUNT(*) AS count
           FROM fines WHERE is_paid = FALSE`),
    query(`SELECT br.id, u.full_name, b.title, br.borrowed_at, br.due_date, br.status
           FROM borrow_records br
           JOIN users u ON br.user_id = u.id
           JOIN books b ON br.book_id = b.id
           ORDER BY br.created_at DESC LIMIT 10`),
  ]);

  // Category breakdown
  const { rows: categoryStats } = await query(
    `SELECT c.name, COUNT(br.id) AS borrows
     FROM categories c
     LEFT JOIN books b ON b.category_id = c.id
     LEFT JOIN borrow_records br ON br.book_id = b.id
     GROUP BY c.name ORDER BY borrows DESC LIMIT 8`
  );

  // Monthly trend (last 6 months)
  const { rows: monthlyTrend } = await query(
    `SELECT TO_CHAR(borrowed_at, 'Mon YYYY') AS month,
            COUNT(*) AS borrows
     FROM borrow_records
     WHERE borrowed_at >= NOW() - INTERVAL '6 months'
     GROUP BY month, DATE_TRUNC('month', borrowed_at)
     ORDER BY DATE_TRUNC('month', borrowed_at)`
  );

  res.json({
    success: true,
    data: {
      books:        books.rows[0],
      users:        users.rows[0],
      activeBorrows:borrows.rows[0].total,
      overdue:      overdue.rows[0].total,
      fines:        fines.rows[0],
      recentActivity: recent.rows,
      categoryStats,
      monthlyTrend,
    },
  });
};

// ── User Dashboard ────────────────────────────────────
exports.getUserStats = async (req, res) => {
  const uid = req.user.id;

  const [active, history, dueSoon, fines, recommended] = await Promise.all([
    query(`SELECT br.*, b.title, b.author, b.cover_url, br.due_date
           FROM borrow_records br JOIN books b ON br.book_id = b.id
           WHERE br.user_id = $1 AND br.status IN ('borrowed','overdue')
           ORDER BY br.due_date ASC`, [uid]),
    query(`SELECT COUNT(*) AS total FROM borrow_records WHERE user_id = $1`, [uid]),
    query(`SELECT br.*, b.title, b.cover_url FROM borrow_records br
           JOIN books b ON br.book_id = b.id
           WHERE br.user_id = $1 AND br.status = 'borrowed'
             AND br.due_date BETWEEN NOW() AND NOW() + INTERVAL '3 days'`, [uid]),
    query(`SELECT COALESCE(SUM(amount),0) AS total FROM fines
           WHERE user_id = $1 AND is_paid = FALSE`, [uid]),
    query(`SELECT b.* FROM books b
           WHERE b.is_active = TRUE AND b.available_copies > 0
             AND b.category_id IN (
               SELECT DISTINCT bk.category_id FROM borrow_records br
               JOIN books bk ON br.book_id = bk.id WHERE br.user_id = $1
             )
           ORDER BY RANDOM() LIMIT 6`, [uid]),
  ]);

  res.json({
    success: true,
    data: {
      activeBorrows:  active.rows,
      totalBorrowed:  history.rows[0].total,
      dueSoon:        dueSoon.rows,
      unpaidFines:    fines.rows[0].total,
      recommended:    recommended.rows,
    },
  });
};
