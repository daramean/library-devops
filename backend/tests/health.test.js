const request = require('supertest');
const app = require('../src/app');

describe('Health Endpoint', () => {
  it('should return service status and timestamp', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(new Date(res.body.timestamp).toString()).not.toBe('Invalid Date');
  });
});
