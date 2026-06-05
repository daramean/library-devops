const client = require('prom-client');

client.collectDefaultMetrics();

const httpDuration = new client.Histogram({
  name:    'http_request_duration_seconds',
  help:    'HTTP request duration',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

const httpTotal = new client.Counter({
  name:    'http_requests_total',
  help:    'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

function metricsMiddleware(req, res, next) {
  const end = httpDuration.startTimer();
  res.on('finish', () => {
    const labels = { method: req.method, route: req.path, status: res.statusCode };
    end(labels);
    httpTotal.inc(labels);
  });
  next();
}

async function metricsRoute(req, res) {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
}

module.exports = { metricsMiddleware, metricsRoute };
