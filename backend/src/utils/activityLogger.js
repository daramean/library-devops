// ── activityLogger.js ─────────────────────────────────
const { query } = require('../config/database');

async function logActivity(userId, action, entityType, entityId, req, metadata = {}) {
  try {
    await query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, metadata, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, entityType, entityId, JSON.stringify(metadata),
       req?.ip, req?.headers?.['user-agent']]
    );
  } catch (e) {
    // non-fatal
  }
}

module.exports = { logActivity };
