const fs = require('fs').promises;
const path = require('path');
const dotenv = require('dotenv');
const { Pool } = require('pg');

const PROJECT_ROOT = path.resolve(process.cwd());
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

dotenv.config({ path: path.resolve(PROJECT_ROOT, '.env') });

const logger = require('./logger');
const targetDb = process.env.DB_NAME || 'library_db';

function createPool(host, database = targetDb) {
  return new Pool({
    host,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'library_pass',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });
}

async function testConnection(pool) {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
  } finally {
    client.release();
  }
}

async function createDatabaseIfMissing(host) {
  const adminPool = createPool(host, 'postgres');
  try {
    const client = await adminPool.connect();
    try {
      await client.query(`CREATE DATABASE ${targetDb}`);
      logger.info(`Created missing database ${targetDb} on host ${host}`);
    } catch (err) {
      if (err.code === '42P04') {
        logger.info(`Database ${targetDb} already exists on host ${host}`);
      } else {
        throw err;
      }
    } finally {
      client.release();
    }
  } finally {
    await adminPool.end().catch(() => {});
  }
}

async function getMigrationPool() {
  const originalHost = process.env.DB_HOST || 'localhost';
  const candidateHosts = [originalHost];

  if (originalHost === 'postgres') {
    candidateHosts.push('localhost', '127.0.0.1');
  }

  let lastError;
  for (const host of candidateHosts) {
    const pool = createPool(host);
    try {
      await testConnection(pool);
      if (host !== originalHost) {
        logger.info(`DB host fallback: using ${host} instead of ${originalHost}`);
      }
      return pool;
    } catch (err) {
      lastError = err;
      if (err.code === '3D000') {
        logger.warn(`Database ${targetDb} does not exist on host ${host}, creating it now`);
        await pool.end().catch(() => {});
        await createDatabaseIfMissing(host);
        const retryPool = createPool(host);
        try {
          await testConnection(retryPool);
          logger.info(`Connected to ${targetDb} on host ${host}`);
          return retryPool;
        } catch (retryErr) {
          lastError = retryErr;
          await retryPool.end().catch(() => {});
        }
      } else {
        logger.warn(`Unable to connect to DB host ${host}: ${err.message}`);
        await pool.end().catch(() => {});
      }
    }
  }

  throw lastError;
}

const MIGRATION_TABLE = 'schema_migrations';

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATION_TABLE} (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
}

async function getAppliedMigrations(client) {
  const { rows } = await client.query(`SELECT filename FROM ${MIGRATION_TABLE}`);
  return new Set(rows.map((row) => row.filename));
}

async function resolveMigrationsDir() {
  const candidates = [
    process.env.MIGRATIONS_DIR,
    process.env.MIGRATIONS_PATH,
    path.resolve(REPO_ROOT, 'database', 'migrations'),
    path.resolve(PROJECT_ROOT, '..', 'database', 'migrations'),
    path.resolve(PROJECT_ROOT, 'database', 'migrations'),
  ].filter(Boolean);

  for (const dir of candidates) {
    try {
      const stat = await fs.stat(dir);
      if (stat.isDirectory()) {
        return dir;
      }
    } catch (err) {
      // ignore missing candidate and continue
    }
  }

  return path.resolve(REPO_ROOT, 'database', 'migrations');
}

async function runMigrations() {
  const migrationsDir = await resolveMigrationsDir();
  logger.info(`Running migrations from ${migrationsDir}`);

  const files = (await fs.readdir(migrationsDir))
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (!files.length) {
    logger.info('No migration files found.');
    return;
  }

  const pool = await getMigrationPool();
  const client = await pool.connect();

  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);
    const pending = files.filter((file) => !applied.has(file));

    if (!pending.length) {
      logger.info('No pending migrations to apply.');
      return;
    }

    for (const file of pending) {
      const filePath = path.join(migrationsDir, file);
      logger.info(`Applying migration ${file}`);
      const sql = await fs.readFile(filePath, 'utf8');
      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(`INSERT INTO ${MIGRATION_TABLE} (filename) VALUES ($1)`, [file]);
        await client.query('COMMIT');
        logger.info(`Migration ${file} applied.`);
      } catch (err) {
        await client.query('ROLLBACK');
        logger.warn(`Migration ${file} failed: ${err.message}`);
        throw err;
      }
    }

    logger.info('All pending migrations applied successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations()
    .catch((err) => {
      logger.error('Migration process exited with error:', err);
      process.exit(1);
    });
}

module.exports = { runMigrations };
