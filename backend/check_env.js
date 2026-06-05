const dotenv = require('dotenv');
const path = require('path');

// Load project .env if present (safe helper)
const envPath = path.resolve(__dirname, '..', '..', '.env');
dotenv.config({ path: envPath });

// Do NOT log secret values. Print presence status only.
const keys = ['DB_HOST','DB_PORT','DB_NAME','DB_USER','DB_PASSWORD','JWT_SECRET'];
const status = keys.map(k => `${k}=${process.env[k] ? 'SET' : 'MISSING'}`);
console.log('Env check:', status.join(', '));

module.exports = { ok: true };
