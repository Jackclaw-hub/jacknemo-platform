const request = require('supertest');
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test';
const app = require('../src/app');

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});
