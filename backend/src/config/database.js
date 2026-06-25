const { Pool } = require('pg');
const logger   = require('../utils/logger');
const AppError = require('../utils/AppError');

const defaultHost = process.env.DB_HOST || 'postgres';
const defaultPort = parseInt(process.env.DB_PORT || '5432', 10);
const defaultDatabase = process.env.DB_NAME;
const defaultUser = process.env.DB_USER;
const defaultPassword = process.env.DB_PASSWORD;

function createPool(host) {
  return new Pool({
    host,
    port: defaultPort,
    database: defaultDatabase,
    user: defaultUser,
    password: defaultPassword,
    max: 20,           // max connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
  });
}

let pool = createPool(defaultHost);

pool.on('error', (err) => {
  logger.error('Unexpected DB pool error:', err);
});

async function connectDB() {
  const maxAttempts = parseInt(process.env.DB_CONNECT_RETRIES || '5', 10);
  const baseDelay = 500; // ms
  let lastErr;

  function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  const fallbackHosts = defaultHost === 'postgres' ? ['localhost', '127.0.0.1'] : [];
  const hostsToTry = [defaultHost, ...fallbackHosts];

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    for (const host of hostsToTry) {
      try {
        // use existing pool if host matches, otherwise create a temporary pool
        if (host === pool.options.host) {
          const client = await pool.connect();
          try {
            await client.query('SELECT 1');
            logger.info(`PostgreSQL connected to ${host}`);
            return;
          } finally {
            client.release();
          }
        }

        const attemptPool = createPool(host);
        try {
          const client = await attemptPool.connect();
          try {
            await client.query('SELECT 1');
            // switch main pool to this working pool
            await pool.end().catch(() => {});
            pool = attemptPool;
            logger.info(`PostgreSQL connected using host ${host}`);
            return;
          } finally {
            client.release();
          }
        } catch (e) {
          lastErr = e;
          logger.warn(`Unable to connect to DB host ${host}: ${e.message}`);
          await attemptPool.end().catch(() => {});
        }
      } catch (err) {
        lastErr = err;
        logger.warn(`DB connection attempt failed for host ${host}: ${err.message}`);
      }
    }

    const delay = Math.min(baseDelay * 2 ** (attempt - 1), 10000);
    logger.info(`DB connect attempt ${attempt} failed, retrying in ${delay}ms`);
    // eslint-disable-next-line no-await-in-loop
    await sleep(delay);
  }

  throw lastErr || new Error('Unable to connect to PostgreSQL');
}

/**
 * Execute a query with optional parameters.
 * @param {string} text - SQL query
 * @param {Array}  params - Query parameters
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn(`Slow query (${duration}ms): ${text}`);
    }
    return result;
  } catch (err) {
    // Map connection-level errors to 503 Service Unavailable
    if (err && (err.code === 'ECONNREFUSED' || err.code === '57P01' || /connection|connect/i.test(err.message || ''))) {
      logger.error({ err }, 'Database connection error during query');
      throw new AppError('Database unavailable', 503);
    }
    throw err;
  }
}

/**
 * Get a client for transactions.
 */
async function getClient() {
  try {
    return await pool.connect();
  } catch (err) {
    if (err && (err.code === 'ECONNREFUSED' || /connection|connect/i.test(err.message || ''))) {
      logger.error({ err }, 'Database connection error when getting client');
      throw new AppError('Database unavailable', 503);
    }
    throw err;
  }
}

module.exports = { pool, connectDB, query, getClient };
