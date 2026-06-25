const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const rootEnvPath = path.resolve(__dirname, '..', '..', '..', '.env');
const localEnvPath = path.resolve(__dirname, '..', '..', '.env');
const envPath = fs.existsSync(rootEnvPath) ? rootEnvPath : localEnvPath;

dotenv.config({ path: envPath });

const requiredVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'REDIS_HOST',
  'REDIS_PORT',
];

// REDIS_PASSWORD is intentionally optional because local Redis instances often do not require auth.

const missing = requiredVars.filter((name) => {
  const value = process.env[name];
  return (
    value === undefined ||
    value === '' ||
    value.startsWith('REPLACE_WITH_')
  );
});

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missing.join(', ')}. ` +
    'Update your .env file or GitHub Secrets and restart the application.',
  );
}

module.exports = {
  env: Object.fromEntries(requiredVars.map((name) => [name, process.env[name]])),
};
