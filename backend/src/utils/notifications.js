const { query } = require('../config/database');

async function sendNotification(userId, { title, message, type = 'info' }) {
  try {
    await query(
      `INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,$4)`,
      [userId, title, message, type]
    );
  } catch (err) {
    console.error('Failed to send notification:', err.message);
    // Non-fatal - don't throw, just log
  }
}

async function sendAdminNotifications({ title, message, type = 'info' }) {
  try {
    const { rows: admins } = await query(
      `SELECT u.id FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE r.name IN ('admin','librarian')`
    );

    const promises = admins.map((a) =>
      query(
        `INSERT INTO notifications (user_id, title, message, type, created_at, is_read)
         VALUES ($1,$2,$3,$4,NOW(),FALSE)`,
        [a.id, title, message, type]
      )
    );

    await Promise.all(promises);
  } catch (err) {
    console.error('Failed to send admin notifications:', err.message);
  }
}

module.exports = { sendNotification, sendAdminNotifications };
