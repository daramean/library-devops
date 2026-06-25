const dns    = require('dns').promises;
const Redis  = require('ioredis');
const logger = require('../utils/logger');
const AppError = require('../utils/AppError');

const defaultHost = process.env.REDIS_HOST || 'localhost';
const defaultPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const defaultPassword = process.env.REDIS_PASSWORD || undefined;

let redisClient;

function createRedis(host) {
  const client = new Redis({
    host,
    port: defaultPort,
    password: defaultPassword,
    retryStrategy: (times) => Math.min(times * 50, 2000),
  });

  client.on('connect', () => logger.info(`Redis connected to ${host}:${defaultPort}`));
  client.on('error',   (err) => logger.error('Redis error:', err));

  return client;
}

async function resolveRedisHost() {
  const hosts = [defaultHost];
  if (defaultHost === 'postgres' || defaultHost === 'redis') {
    hosts.push('localhost', '127.0.0.1');
  }

  for (const host of hosts) {
    try {
      await dns.lookup(host);
      return host;
    } catch {
      logger.warn(`Unable to resolve Redis host ${host}`);
    }
  }
  return defaultHost;
}

async function connectRedis() {
  const host = await resolveRedisHost();
  const maxAttempts = parseInt(process.env.REDIS_CONNECT_RETRIES || '5', 10);
  const baseDelay = 300; // ms

  function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (redisClient) {
        try {
          await redisClient.ping();
          logger.info(`Redis connected to ${redisClient.options.host}:${defaultPort}`);
          if (host !== defaultHost) {
            logger.info(`Redis host fallback: using ${host} instead of ${defaultHost}`);
          }
          return;
        } catch (e) {
          // existing client failed, disconnect and recreate
          try { redisClient.disconnect(); } catch (_err) {
            // Ignore disconnect errors
          }
          redisClient = null;
        }
      }

      redisClient = createRedis(host);
      await redisClient.ping();
      logger.info(`Redis connected to ${host}:${defaultPort}`);
      if (host !== defaultHost) {
        logger.info(`Redis host fallback: using ${host} instead of ${defaultHost}`);
      }
      return;
    } catch (err) {
      logger.warn(`Redis connection attempt ${attempt} failed: ${err.message}`);
      try { if (redisClient) { redisClient.disconnect(); redisClient = null; } } catch (_err) {
        // Ignore disconnect errors
      }
      if (attempt < maxAttempts) {
        const delay = Math.min(baseDelay * 2 ** (attempt - 1), 5000);
        // eslint-disable-next-line no-await-in-loop
        await sleep(delay);
      }
    }
  }

  throw new Error('Unable to connect to Redis');
}

function getRedis() {
  if (!redisClient) {
    // translate to AppError so middleware returns 503
    throw new AppError('Redis unavailable', 503);
  }
  return redisClient;
}

module.exports = { connectRedis, getRedis };
