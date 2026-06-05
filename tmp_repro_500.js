const { execSync } = require('child_process');

const fetchJson = async (url, opts) => {
  const res = await fetch(url, opts);
  const text = await res.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
};

(async () => {
  try {
    const email = `test500-${Date.now()}@example.com`;
    const password = 'TestPass123!';
    await fetchJson('http://localhost:5001/api/v1/auth/register', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ full_name:'Test 500', email, password }),
    });

    execSync(`docker exec library_postgres psql -U postgres -d library_db -c "UPDATE users SET role_id = 1 WHERE email = '${email}';"`);

    const login = await fetchJson('http://localhost:5001/api/v1/auth/login', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ email, password }),
    });
    const token = login.body.data.accessToken;

    const bookRes1 = await fetchJson('http://localhost:5001/api/v1/books', {
      method: 'POST', headers: {'Content-Type':'application/json', Authorization: `Bearer ${token}`},
      body: JSON.stringify({ author:'A', total_copies:1 }),
    });
    console.log('missing title', bookRes1);

    const bookRes2 = await fetchJson('http://localhost:5001/api/v1/books', {
      method: 'POST', headers: {'Content-Type':'application/json', Authorization: `Bearer ${token}`},
      body: JSON.stringify({ title:'T', author:'A', total_copies:'not-a-number' }),
    });
    console.log('invalid total', bookRes2);

    const id = execSync('docker exec library_postgres psql -U postgres -d library_db -At -c "SELECT id FROM books LIMIT 1;"').toString().trim();
    const bookRes3 = await fetchJson(`http://localhost:5001/api/v1/books/${id}`, {
      method: 'PUT', headers: {'Content-Type':'application/json', Authorization: `Bearer ${token}`},
      body: JSON.stringify({ publish_year:'not-a-number' }),
    });
    console.log('invalid publish_year', bookRes3);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
