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

// K-65: User management
describe('Admin user management', () => {
  let founderToken, founderId;

  beforeAll(async () => {
    const reg = await request(app).post('/api/auth/register')
      .send({ email: 'usermgmt-founder@test.com', password: 'password123', role: 'founder', name: 'User Mgmt Test' });
    founderToken = reg.body.access_token;
    const me = await request(app).get('/api/founders/profile')
      .set('Authorization', 'Bearer ' + founderToken);
    // get id from list endpoint instead
  });

  it('GET /api/admin/users — 401 without token', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('GET /api/admin/users — 200 with admin token', async () => {
    const res = await request(app).get('/api/admin/users')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(Array.isArray(res.body.users)).toBe(true);
    expect(res.body).toHaveProperty('total');
    // save a non-admin user id for disable test
    const nonAdmin = res.body.users.find(u => u.role !== 'admin');
    if (nonAdmin) founderId = nonAdmin.id;
  });

  it('GET /api/admin/users?role=founder — filters by role', async () => {
    const res = await request(app).get('/api/admin/users?role=founder')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(200);
    res.body.users.forEach(u => expect(u.role).toBe('founder'));
  });

  it('PATCH /api/admin/users/:id/disable — disables a user', async () => {
    if (!founderId) return;
    const res = await request(app).patch('/api/admin/users/' + founderId + '/disable')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(200);
    expect(res.body.user.is_active).toBe(false);
  });

  it('PATCH /api/admin/users/:id/enable — re-enables a user', async () => {
    if (!founderId) return;
    const res = await request(app).patch('/api/admin/users/' + founderId + '/enable')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(200);
    expect(res.body.user.is_active).toBe(true);
  });

  it('Cannot disable own account', async () => {
    const res = await request(app).patch('/api/admin/users/' + 9999 + '/disable')
      .set('Authorization', 'Bearer ' + adminToken);
    // admin id is 9999 in mock
    expect(res.status).toBe(400);
  });
});

afterAll(async () => {});
