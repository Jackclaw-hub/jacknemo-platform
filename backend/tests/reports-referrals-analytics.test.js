// K-175: Tests for reportController, referralController, adminAnalyticsController
const request = require('supertest');
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const app = require('../src/app');

let founderToken, providerToken, adminToken, listingId;

beforeAll(async () => {
  const adminLogin = await request(app).post('/api/auth/login')
    .send({ email: 'admin@nemoclaw.dev', password: 'admin2026!' });
  adminToken = adminLogin.body.access_token;

  const prv = await request(app).post('/api/auth/register')
    .send({ email: 'rra-provider@test.com', password: 'password123', role: 'equipment_provider', name: 'RRA Provider' });
  providerToken = prv.body.access_token || prv.body.token;

  const fnd = await request(app).post('/api/auth/register')
    .send({ email: 'rra-founder@test.com', password: 'password123', role: 'founder', name: 'RRA Founder' });
  founderToken = fnd.body.access_token || fnd.body.token;

  // Create + approve a listing to report
  const lst = await request(app).post('/api/listings')
    .set('Authorization', 'Bearer ' + providerToken)
    .send({ title: 'RRA Test Listing', type: 'equipment', geo: 'national' });
  listingId = lst.body.listing?.id;
  if (listingId && adminToken) {
    await request(app).put('/api/admin/listings/' + listingId + '/approve')
      .set('Authorization', 'Bearer ' + adminToken);
  }
});

// ── Listing Reports ───────────────────────────────────────────────────────────

describe('POST /api/listings/:id/report', () => {
  it('401 without auth', async () => {
    const res = await request(app).post('/api/listings/' + listingId + '/report')
      .send({ reason: 'spam' });
    expect(res.status).toBe(401);
  });

  it('400 for invalid reason', async () => {
    const res = await request(app).post('/api/listings/' + listingId + '/report')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ reason: 'invalid_reason' });
    expect(res.status).toBe(400);
  });

  it('404 for non-existent listing', async () => {
    const res = await request(app).post('/api/listings/99999/report')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ reason: 'spam' });
    expect(res.status).toBe(404);
  });

  it('201 submits report', async () => {
    const res = await request(app).post('/api/listings/' + listingId + '/report')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ reason: 'misleading', details: 'Beschreibung stimmt nicht' });
    expect(res.status).toBe(201);
    expect(res.body.report).toBeDefined();
    expect(res.body.report.reason).toContain('misleading');
  });

  it('409 on duplicate report from same user', async () => {
    const res = await request(app).post('/api/listings/' + listingId + '/report')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ reason: 'spam' });
    expect(res.status).toBe(409);
  });
});

describe('GET /api/listings/:id/reports/count', () => {
  it('200 returns count', async () => {
    const res = await request(app).get('/api/listings/' + listingId + '/reports/count')
      .set('Authorization', 'Bearer ' + founderToken);
    expect(res.status).toBe(200);
    expect(typeof res.body.count).toBe('number');
    expect(res.body.count).toBeGreaterThanOrEqual(1);
  });
});

describe('GET /api/admin/reports', () => {
  it('401 without auth', async () => {
    const res = await request(app).get('/api/admin/reports');
    expect(res.status).toBe(401);
  });

  it('403 for non-admin', async () => {
    const res = await request(app).get('/api/admin/reports')
      .set('Authorization', 'Bearer ' + founderToken);
    expect(res.status).toBe(403);
  });

  it('200 returns {groups, total}', async () => {
    const res = await request(app).get('/api/admin/reports')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.groups)).toBe(true);
    expect(typeof res.body.total).toBe('number');
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });
});

describe('PATCH /api/admin/reports/:id/dismiss', () => {
  let reportId;

  beforeAll(async () => {
    const res = await request(app).get('/api/admin/reports')
      .set('Authorization', 'Bearer ' + adminToken);
    reportId = res.body.groups?.[0]?.reports?.[0]?.id;
  });

  it('401 without auth', async () => {
    const res = await request(app).patch('/api/admin/reports/1/dismiss');
    expect(res.status).toBe(401);
  });

  it('200 dismisses report', async () => {
    if (!reportId) return;
    const res = await request(app).patch('/api/admin/reports/' + reportId + '/dismiss')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  it('GET reports: dismissed report no longer in list', async () => {
    const res = await request(app).get('/api/admin/reports')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(200);
    // Total should now be 0 (we only had 1 report and dismissed it)
    expect(res.body.total).toBe(0);
  });
});

// ── Referral Codes ────────────────────────────────────────────────────────────

describe('GET /api/founders/referral-code', () => {
  it('401 without auth', async () => {
    const res = await request(app).get('/api/founders/referral-code');
    expect(res.status).toBe(401);
  });

  it('403 for provider', async () => {
    const res = await request(app).get('/api/founders/referral-code')
      .set('Authorization', 'Bearer ' + providerToken);
    expect(res.status).toBe(403);
  });

  it('200 returns {code, stats} for founder', async () => {
    const res = await request(app).get('/api/founders/referral-code')
      .set('Authorization', 'Bearer ' + founderToken);
    expect(res.status).toBe(200);
    expect(res.body.code).toBeDefined();
    expect(typeof res.body.code.code).toBe('string');
    expect(res.body.code.code.length).toBeGreaterThan(0);
    expect(res.body.stats).toBeDefined();
    expect(typeof res.body.stats.uses).toBe('number');
  });

  it('200 same code returned on second call (idempotent)', async () => {
    const r1 = await request(app).get('/api/founders/referral-code')
      .set('Authorization', 'Bearer ' + founderToken);
    const r2 = await request(app).get('/api/founders/referral-code')
      .set('Authorization', 'Bearer ' + founderToken);
    expect(r1.body.code.code).toBe(r2.body.code.code);
  });

  it('earlyAdopter is false with 0 uses', async () => {
    const res = await request(app).get('/api/founders/referral-code')
      .set('Authorization', 'Bearer ' + founderToken);
    expect(res.body.stats.earlyAdopter).toBe(false);
    expect(res.body.stats.badge).toBeNull();
  });
});

describe('GET /api/founders/referral-stats', () => {
  it('200 returns stats', async () => {
    const res = await request(app).get('/api/founders/referral-stats')
      .set('Authorization', 'Bearer ' + founderToken);
    expect(res.status).toBe(200);
    expect(typeof res.body.uses).toBe('number');
    expect(typeof res.body.earlyAdopter).toBe('boolean');
  });
});

// ── Admin Analytics ───────────────────────────────────────────────────────────

describe('GET /api/admin/analytics', () => {
  it('401 without auth', async () => {
    const res = await request(app).get('/api/admin/analytics');
    expect(res.status).toBe(401);
  });

  it('403 for non-admin', async () => {
    const res = await request(app).get('/api/admin/analytics')
      .set('Authorization', 'Bearer ' + founderToken);
    expect(res.status).toBe(403);
  });

  it('200 returns analytics object', async () => {
    const res = await request(app).get('/api/admin/analytics')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    // Mock returns via db.getAnalytics() — check basic structure
    expect(typeof res.body).toBe('object');
  });
});

describe('GET /api/admin/analytics/trends', () => {
  it('401 without auth', async () => {
    const res = await request(app).get('/api/admin/analytics/trends');
    expect(res.status).toBe(401);
  });

  it('200 returns {weeks} array', async () => {
    const res = await request(app).get('/api/admin/analytics/trends')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.weeks)).toBe(true);
    expect(res.body.weeks.length).toBeGreaterThan(0);
  });

  it('200 with custom date range (?from=&to=)', async () => {
    const res = await request(app).get('/api/admin/analytics/trends?from=2026-01-01&to=2026-03-31')
      .set('Authorization', 'Bearer ' + adminToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.weeks)).toBe(true);
  });
});
