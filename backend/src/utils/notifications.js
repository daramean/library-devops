const { query } = require('../config/database');

async function sendNotification(userId, { title, message, type = 'info' }) {
  await query(
    `INSERT INTO notifications (user_id, title, message, type) VALUES ($1,$2,$3,$4)`,
    [userId, title, message, type]
  );
}

module.exports = { sendNotification };
