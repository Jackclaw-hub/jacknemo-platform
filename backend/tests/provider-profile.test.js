// K-174: Tests for provider profile, analytics, availability, verification
const request = require('supertest');
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const app = require('../src/app');

let providerToken, providerId, adminToken, founderToken;

beforeAll(async () => {
  const adminLogin = await request(app).post('/api/auth/login')
    .send({ email: 'admin@nemoclaw.dev', password: 'admin2026!' });
  adminToken = adminLogin.body.access_token;

  const prv = await request(app).post('/api/auth/register')
    .send({ email: 'pp-provider@test.com', password: 'password123', role: 'equipment_provider', name: 'PP Provider' });
  providerToken = prv.body.access_token || prv.body.token;
  providerId = prv.body.user?.id;

  const fnd = await request(app).post('/api/auth/register')
    .send({ email: 'pp-founder@test.com', password: 'password123', role: 'founder', name: 'PP Founder' });
  founderToken = fnd.body.access_token || fnd.body.token;
});

// ── Profile upsert ────────────────────────────────────────────────────────────

describe('POST /api/providers/profile', () => {
  it('401 without auth', async () => {
    const res = await request(app).post('/api/providers/profile').send({ company_name: 'Test' });
    expect(res.status).toBe(401);
  });

  it('403 for founder role', async () => {
    const res = await request(app).post('/api/providers/profile')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ company_name: 'Test' });
    expect(res.status).toBe(403);
  });

  it('200 creates profile', async () => {
    const res = await request(app).post('/api/providers/profile')
      .set('Authorization', 'Bearer ' + providerToken)
      .send({ company_name: 'TestCo GmbH', description: 'Wir bieten Equipment', website: 'https://testco.de', contact_email: 'info@testco.de' });
    expect(res.status).toBe(200);
    expect(res.body.profile?.company_name).toBe('TestCo GmbH');
  });

  it('200 upserts (updates) existing profile', async () => {
    const res = await request(app).post('/api/providers/profile')
      .set('Authorization', 'Bearer ' + providerToken)
      .send({ company_name: 'TestCo GmbH Updated' });
    expect(res.status).toBe(200);
    expect(res.body.profile?.company_name).toBe('TestCo GmbH Updated');
  });
});

// ── Get profile ───────────────────────────────────────────────────────────────

describe('GET /api/providers/profile', () => {
  it('401 without auth', async () => {
    const res = await request(app).get('/api/providers/profile');
    expect(res.status).toBe(401);
  });

  it('200 returns own profile', async () => {
    const res = await request(app).get('/api/providers/profile')
      .set('Authorization', 'Bearer ' + providerToken);
    expect(res.status).toBe(200);
    expect(res.body.profile?.company_name).toBe('TestCo GmbH Updated');
  });
});

describe('GET /api/providers/:userId/profile (public)', () => {
  it('200 returns public profile without auth', async () => {
    const res = await request(app).get('/api/providers/' + providerId + '/profile');
    expect(res.status).toBe(200);
    expect(res.body.profile).toBeDefined();
  });

  it('200 returns null profile for unknown user', async () => {
    const res = await request(app).get('/api/providers/99999/profile');
    expect(res.status).toBe(200);
    expect(res.body.profile).toBeNull();
  });
});

// ── Verification request ──────────────────────────────────────────────────────

describe('POST /api/providers/verify-request', () => {
  it('401 without auth', async () => {
    const res = await request(app).post('/api/providers/verify-request');
    expect(res.status).toBe(401);
  });

  it('200 submits verification request', async () => {
    const res = await request(app).post('/api/providers/verify-request')
      .set('Authorization', 'Bearer ' + providerToken);
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  it('profile now has verification_status=pending', async () => {
    const res = await request(app).get('/api/providers/' + providerId + '/profile');
    expect(res.status).toBe(200);
    expect(res.body.profile?.verification_status).toBe('pending');
  });
});

// ── Analytics ─────────────────────────────────────────────────────────────────

describe('GET /api/providers/analytics', () => {
  it('401 without auth', async () => {
    const res = await request(app).get('/api/providers/analytics');
    expect(res.status).toBe(401);
  });

  it('403 for founder', async () => {
    const res = await request(app).get('/api/providers/analytics')
      .set('Authorization', 'Bearer ' + founderToken);
    expect(res.status).toBe(403);
  });

  it('200 returns {listings, totals}', async () => {
    const res = await request(app).get('/api/providers/analytics')
      .set('Authorization', 'Bearer ' + providerToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.listings)).toBe(true);
    expect(res.body.totals).toBeDefined();
    expect(typeof res.body.totals.total_listings).toBe('number');
  });

  it('listings include sparkline array', async () => {
    // Create a listing first so analytics has data
    await request(app).post('/api/listings')
      .set('Authorization', 'Bearer ' + providerToken)
      .send({ title: 'Analytics Listing', type: 'equipment', geo: 'national' });

    const res = await request(app).get('/api/providers/analytics')
      .set('Authorization', 'Bearer ' + providerToken);
    expect(res.status).toBe(200);
    if (res.body.listings.length > 0) {
      expect(Array.isArray(res.body.listings[0].sparkline)).toBe(true);
      expect(res.body.listings[0].sparkline).toHaveLength(7);
    }
  });
});

// ── Availability ──────────────────────────────────────────────────────────────

describe('POST /api/providers/availability', () => {
  it('401 without auth', async () => {
    const res = await request(app).post('/api/providers/availability').send({ blocked: [] });
    expect(res.status).toBe(401);
  });

  it('400 if blocked is not an array', async () => {
    const res = await request(app).post('/api/providers/availability')
      .set('Authorization', 'Bearer ' + providerToken)
      .send({ blocked: 'not-an-array' });
    expect(res.status).toBe(400);
  });

  it('200 saves availability', async () => {
    const res = await request(app).post('/api/providers/availability')
      .set('Authorization', 'Bearer ' + providerToken)
      .send({ blocked: [{ from: '2026-07-01', to: '2026-07-15' }], lead_time_days: 3 });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

describe('GET /api/providers/:userId/availability', () => {
  it('200 returns availability for provider', async () => {
    const res = await request(app).get('/api/providers/' + providerId + '/availability');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.blocked)).toBe(true);
    expect(res.body.lead_time_days).toBe(3);
  });

  it('200 returns empty availability for unknown user', async () => {
    const res = await request(app).get('/api/providers/99999/availability');
    expect(res.status).toBe(200);
    expect(res.body.blocked).toEqual([]);
    expect(res.body.lead_time_days).toBe(0);
  });
});

// ── Response rate ─────────────────────────────────────────────────────────────

describe('GET /api/providers/:userId/response-rate', () => {
  it('200 returns {rate, total, replied} — no messages initially', async () => {
    const res = await request(app).get('/api/providers/' + providerId + '/response-rate');
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.rate).toBeNull();
  });
});
