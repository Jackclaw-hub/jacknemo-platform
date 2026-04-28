const request = require('supertest');
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV  = 'test';

const app = require('../src/app');

describe('GET /api/payments/status/:listing_id', () => {
  it('404 for unknown listing', async () => {
    const res = await request(app).get('/api/payments/status/99999');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/payments/checkout-session', () => {
  it('401 when not authenticated', async () => {
    const res = await request(app).post('/api/payments/checkout-session')
      .send({ listing_id: 1 });
    expect(res.status).toBe(401);
  });

  it('503 when STRIPE_SECRET_KEY not set', async () => {
    // Register a provider and get token
    const reg = await request(app).post('/api/auth/register')
      .send({ email: 'stripe-test@test.com', password: 'password123', role: 'equipment_provider', name: 'Stripe Test' });
    const token = reg.body.access_token;
    const res = await request(app).post('/api/payments/checkout-session')
      .set('Authorization', 'Bearer ' + token)
      .send({ listing_id: 1 });
    // No STRIPE_SECRET_KEY set in test env → 503
    expect(res.status).toBe(503);
  });

  it('503 when listing_id missing (stripe not configured)', async () => {
    const reg = await request(app).post('/api/auth/register')
      .send({ email: 'stripe-test2@test.com', password: 'password123', role: 'equipment_provider', name: 'Stripe Test 2' });
    const token = reg.body.access_token;
    const res = await request(app).post('/api/payments/checkout-session')
      .set('Authorization', 'Bearer ' + token)
      .send({});
    // STRIPE_SECRET_KEY not set in test env — always 503
    expect(res.status).toBe(503);
  });
});

afterAll(async () => {});
