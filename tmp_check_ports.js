const http = require('http');

for (const port of [5000, 5001]) {
  const options = { host: 'localhost', port, path: '/api/health', method: 'GET', timeout: 2000 };
  const req = http.request(options, (res) => {
    console.log(port, res.statusCode);
    res.on('data', () => {});
  });
  req.on('error', (err) => console.log(port, 'ERR', err.message));
  req.end();
}
