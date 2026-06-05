const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'library_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});
if (!process.env.DB_PASSWORD) {
  throw new Error('DB_PASSWORD is required to run this helper script');
}
(async () => {
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT conname, pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE contype='c' AND conrelid = 'borrow_records'::regclass;`);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();
