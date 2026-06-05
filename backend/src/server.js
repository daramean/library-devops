require('./config/env');
const app = require('./app');
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { runMigrations } = require('./utils/migrate');
const logger = require('./utils/logger');

const DEFAULT_PORT = 5000;
const requestedPort = Number(process.env.PORT) || DEFAULT_PORT;
const MAX_PORT_ATTEMPTS = 3;

function listen(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      logger.info(`Server on port ${port} | Docs: http://localhost:${port}/api/docs`);
      resolve(server);
    });

    server.on('error', reject);
  });
}

async function start(port = requestedPort, attempt = 1) {
  try {
    await runMigrations();
    await connectDB();
    await connectRedis();
    await listen(port);
  } catch (err) {
    if (err.code === 'EADDRINUSE' && attempt < MAX_PORT_ATTEMPTS) {
      const nextPort = port + 1;
      logger.warn(`Port ${port} is already in use. Trying port ${nextPort} instead...`);
      return start(nextPort, attempt + 1);
    }

    logger.error('Failed to start:', err);
    process.exit(1);
  }
}

start();
module.exports = app;
