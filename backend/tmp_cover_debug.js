require('dotenv').config({ path: '../.env' });
const { Client } = require('pg');
(async () => {
  try {
    const client = new Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), database: process.env.DB_NAME, user: process.env.DB_USER, password: process.env.DB_PASSWORD });
    await client.connect();
    const res = await client.query('SELECT id, title, author, isbn, cover_url FROM books ORDER BY id DESC LIMIT 20');
    console.log(JSON.stringify(res.rows, null, 2));
    await client.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
