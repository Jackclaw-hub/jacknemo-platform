const request = require('supertest');
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV  = 'test';

const app = require('../src/app');

let adminToken;

beforeAll(async () => {
  const res = await request(app).post('/api/auth/login')
    .send({ email: 'admin@nemoclaw.dev', password: 'admin2026!' });
  adminToken = res.body.access_token;
});

describe('GET /api/admin/analytics', () => {
  it('401 without token', async () => {
    const res = await request(app).get('/api/admin/analytics');
    expect(res.status).toBe(401);
  });

  it('200 with admin token', async () => {
    const res = await request(app).get('/api/admin/analytics')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
  });
});

describe('GET /api/admin/listings/pending', () => {
  it('401 without token', async () => {
    const res = await request(app).get('/api/admin/listings/pending');
    expect(res.status).toBe(401);
  });

  it('200 with admin token', async () => {
    const res = await request(app).get('/api/admin/listings/pending')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('listings');
  });
});

describe('GET /api/admin/providers/pending-verification', () => {
  it('401 without token', async () => {
    const res = await request(app).get('/api/admin/providers/pending-verification');
    expect(res.status).toBe(401);
  });

  it('200 with admin token returns providers array', async () => {
    const res = await request(app).get('/api/admin/providers/pending-verification')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('providers');
    expect(Array.isArray(res.body.providers)).toBe(true);
  });
});

describe('Listing approve/reject flow', () => {
  let listingId;

  beforeAll(async () => {
    // Register provider and create a listing
    const reg = await request(app).post('/api/auth/register')
      .send({ email: 'admintest-provider@test.com', password: 'password123', role: 'equipment_provider', name: 'Admin Test Provider' });
    const token = reg.body.access_token;
    const listing = await request(app).post('/api/listings')
      .set('Authorization', 'Bearer ' + token)
      .send({ type: 'equipment', title: 'Admin Test Listing', description: 'Test', geo: 'de', city: 'Berlin', tags: [], stages: [], sectors: [] });
    listingId = listing.body.listing?.id || listing.body.id;
  });

  it('200 approve listing', async () => {
    if (!listingId) return;
    const res = await request(app).put('/api/admin/listings/' + listingId + '/approve')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(200);
  });

  it('200 reject listing', async () => {
    if (!listingId) return;
    const res = await request(app).put('/api/admin/listings/' + listingId + '/reject')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ reason: 'Test rejection' });
    expect(res.status).toBe(200);
  });
});

afterAll(async () => {});
