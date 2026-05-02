// K-169: Tests for provider ratings (K-166) and listing filters (K-168)
const request = require('supertest');
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const app = require('../src/app');

let founderToken, providerToken, providerId;

beforeAll(async () => {
  // Register a provider
  const provReg = await request(app).post('/api/auth/register')
    .send({ email: 'rating-provider@test.com', password: 'password123', role: 'equipment_provider', name: 'Rating Provider' });
  providerToken = provReg.body.access_token || provReg.body.token;
  providerId = provReg.body.user?.id;

  // Register a founder
  const fndReg = await request(app).post('/api/auth/register')
    .send({ email: 'rating-founder@test.com', password: 'password123', role: 'founder', name: 'Rating Founder' });
  founderToken = fndReg.body.access_token || fndReg.body.token;
});

// ── K-166: Provider ratings ────────────────────────────────────────────────

describe('GET /api/providers/:userId/ratings', () => {
  it('200 returns {ratings, average, count} for provider with no reviews', async () => {
    const res = await request(app).get('/api/providers/' + providerId + '/ratings');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.ratings)).toBe(true);
    expect(typeof res.body.average).toBe('number');
    expect(typeof res.body.count).toBe('number');
    expect(res.body.count).toBe(0);
  });
});

describe('POST /api/providers/:userId/rate', () => {
  it('401 without auth', async () => {
    const res = await request(app).post('/api/providers/' + providerId + '/rate')
      .send({ rating: 4 });
    expect(res.status).toBe(401);
  });

  it('403 when provider tries to rate (not a founder)', async () => {
    const res = await request(app).post('/api/providers/' + providerId + '/rate')
      .set('Authorization', 'Bearer ' + providerToken)
      .send({ rating: 4 });
    expect(res.status).toBe(403);
  });

  it('400 when rating missing', async () => {
    const res = await request(app).post('/api/providers/' + providerId + '/rate')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({});
    expect(res.status).toBe(400);
  });

  it('400 when rating out of range', async () => {
    const res = await request(app).post('/api/providers/' + providerId + '/rate')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ rating: 6 });
    expect(res.status).toBe(400);
  });

  it('200 founder submits rating with optional comment', async () => {
    const res = await request(app).post('/api/providers/' + providerId + '/rate')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ rating: 4, comment: 'Great service!' });
    expect(res.status).toBe(200);
    expect(res.body.rating).toBeDefined();
    expect(res.body.rating.rating).toBe(4);
  });

  it('GET /ratings now shows the new review', async () => {
    const res = await request(app).get('/api/providers/' + providerId + '/ratings');
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.average).toBe(4);
    expect(res.body.ratings[0].comment).toBe('Great service!');
  });

  it('200 upsert — updates existing rating', async () => {
    const res = await request(app).post('/api/providers/' + providerId + '/rate')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ rating: 5, comment: 'Updated: excellent!' });
    expect(res.status).toBe(200);
    expect(res.body.rating.rating).toBe(5);
  });
});

// ── K-168: stage and city listing filters ─────────────────────────────────

describe('GET /api/listings with stage/city filter (K-168)', () => {
  let adminToken;

  beforeAll(async () => {
    const adminLogin = await request(app).post('/api/auth/login')
      .send({ email: 'admin@nemoclaw.dev', password: 'admin2026!' });
    adminToken = adminLogin.body.access_token;

    // Create listings with different stages/cities
    const mkListing = (title, city, stages) => request(app).post('/api/listings')
      .set('Authorization', 'Bearer ' + providerToken)
      .send({ title, type: 'equipment', geo: 'local', city, stages: stages || [] });

    const l1 = await mkListing('Seed Machine Berlin', 'Berlin', ['seed']);
    const l2 = await mkListing('Series-A Machine Hamburg', 'Hamburg', ['series-a']);
    const l3 = await mkListing('Seed Machine Munich', 'München', ['seed']);

    // Bulk approve all
    const ids = [l1.body.listing?.id, l2.body.listing?.id, l3.body.listing?.id].filter(Boolean);
    if (ids.length) {
      await request(app).post('/api/admin/listings/bulk-action')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ ids, action: 'approve' });
    }
  });

  it('stage=seed returns only seed-stage listings', async () => {
    const res = await request(app).get('/api/listings?stage=seed');
    expect(res.status).toBe(200);
    const listings = res.body.listings || [];
    expect(listings.length).toBeGreaterThanOrEqual(1);
    listings.forEach(l => {
      const stages = Array.isArray(l.stages) ? l.stages : (typeof l.stages === 'string' ? JSON.parse(l.stages || '[]') : []);
      expect(stages).toContain('seed');
    });
  });

  it('city=berlin returns only Berlin listings (case-insensitive)', async () => {
    const res = await request(app).get('/api/listings?city=berlin');
    expect(res.status).toBe(200);
    const listings = res.body.listings || [];
    expect(listings.length).toBeGreaterThanOrEqual(1);
    listings.forEach(l => {
      expect((l.city || '').toLowerCase()).toContain('berlin');
    });
  });

  it('stage=seed&city=berlin returns intersection', async () => {
    const res = await request(app).get('/api/listings?stage=seed&city=berlin');
    expect(res.status).toBe(200);
    const listings = res.body.listings || [];
    listings.forEach(l => {
      const stages = Array.isArray(l.stages) ? l.stages : (typeof l.stages === 'string' ? JSON.parse(l.stages || '[]') : []);
      expect(stages).toContain('seed');
      expect((l.city || '').toLowerCase()).toContain('berlin');
    });
  });
});
