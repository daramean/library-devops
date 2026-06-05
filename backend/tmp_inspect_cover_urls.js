require('dotenv').config({ path: require('path').resolve(process.cwd(), '..', '.env') });
const { Client } = require('pg');
const client = new Client({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});
(async () => {
  try {
    await client.connect();
    const res = await client.query("SELECT id, title, author, isbn, cover_url FROM books ORDER BY id LIMIT 20");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await client.end();
  }
})();
