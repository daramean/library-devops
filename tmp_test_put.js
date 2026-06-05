const { execSync } = require('child_process');

const API_BASE = 'http://localhost:5001/api/v1';

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const json = await res.text();
  try {
    return { status: res.status, body: JSON.parse(json) };
  } catch {
    return { status: res.status, body: json };
  }
}

(async () => {
  try {
    const email = `admin-test-${Date.now()}@example.com`;
    const password = 'TestPass123!';

    console.log('Registering test user:', email);
    const register = await fetchJson(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Admin Test', email, password }),
    });
    console.log('register', register.status, register.body);

    if (register.status !== 201 && register.status !== 200) {
      throw new Error('Registration failed');
    }

    console.log('Promoting user to admin role');
    execSync(
      `docker exec library_postgres psql -U postgres -d library_db -c "UPDATE users SET role_id = 1 WHERE email = '${email}';"`
    );

    console.log('Logging in');
    const login = await fetchJson(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    console.log('login', login.status, login.body);

    if (login.status !== 200 || !login.body.data?.accessToken) {
      throw new Error('Login failed');
    }

    const token = login.body.data.accessToken;
    const id = execSync('docker exec library_postgres psql -U postgres -d library_db -At -c "SELECT id FROM books WHERE is_active = TRUE LIMIT 1;"').toString().trim();
    if (!id) throw new Error('No active book found to update');
    console.log('BOOK_ID=' + id);

    const update = await fetchJson(`${API_BASE}/books/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: 'Test update', default_loan_days: 14 }),
    });

    console.log('update', update.status, update.body);
  } catch (err) {
    console.error('ERROR', err);
    process.exit(1);
  }
})();
