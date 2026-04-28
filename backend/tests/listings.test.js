// K-44: Tests for listing CRUD + draft/publish flow
const request = require('supertest');
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const app = require('../src/app');

let providerToken;
let draftListingId;

beforeAll(async () => {
  // Register a provider
  const reg = await request(app).post('/api/auth/register')
    .send({ email: 'listing-test@provider.com', password: 'password123', role: 'equipment_provider', name: 'Test Provider' });
  providerToken = reg.body.access_token || reg.body.token;
});

describe('POST /api/listings', () => {
  it('401 when not authenticated', async () => {
    const res = await request(app).post('/api/listings')
      .send({ title: 'No Auth', type: 'equipment', geo: 'local' });
    expect(res.status).toBe(401);
  });

  it('403 when founder (not provider) tries to create', async () => {
    const reg = await request(app).post('/api/auth/register')
      .send({ email: 'founder-listing@test.com', password: 'password123', role: 'founder', name: 'F' });
    const founderToken = reg.body.access_token || reg.body.token;
    const res = await request(app).post('/api/listings')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ title: 'Nope', type: 'equipment', geo: 'local' });
    expect(res.status).toBe(403);
  });

  it('201 creates listing with status pending', async () => {
    const res = await request(app).post('/api/listings')
      .set('Authorization', 'Bearer ' + providerToken)
      .send({ title: 'Test Drill Press', type: 'equipment', geo: 'local', city: 'Berlin' });
    expect(res.status).toBe(201);
    expect(res.body.listing.status).toBe('pending');
    expect(res.body.listing.title).toBe('Test Drill Press');
  });

  it('201 creates listing with status draft when draft=true', async () => {
    const res = await request(app).post('/api/listings')
      .set('Authorization', 'Bearer ' + providerToken)
      .send({ title: 'Draft Laser Cutter', type: 'equipment', geo: 'regional', draft: true });
    expect(res.status).toBe(201);
    expect(res.body.listing.status).toBe('draft');
    expect(res.body.message).toMatch(/draft/i);
    draftListingId = res.body.listing.id;
  });
});

describe('GET /api/listings/me/listings', () => {
  it('401 when not authenticated', async () => {
    const res = await request(app).get('/api/listings/me/listings');
    expect(res.status).toBe(401);
  });

  it('200 returns own listings including drafts', async () => {
    const res = await request(app).get('/api/listings/me/listings')
      .set('Authorization', 'Bearer ' + providerToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.listings)).toBe(true);
    // Should include the draft we just created
    const hasDraft = res.body.listings.some(l => l.status === 'draft');
    expect(hasDraft).toBe(true);
  });
});

describe('PATCH /api/listings/:id/publish', () => {
  it('401 when not authenticated', async () => {
    const res = await request(app).patch('/api/listings/999/publish');
    expect(res.status).toBe(401);
  });

  it('404 for non-existent listing', async () => {
    const res = await request(app).patch('/api/listings/99999/publish')
      .set('Authorization', 'Bearer ' + providerToken);
    expect(res.status).toBe(404);
  });

  it('200 publishes draft → pending', async () => {
    expect(draftListingId).toBeDefined();
    const res = await request(app).patch(`/api/listings/${draftListingId}/publish`)
      .set('Authorization', 'Bearer ' + providerToken);
    expect(res.status).toBe(200);
    expect(res.body.listing.status).toBe('pending');
    expect(res.body.message).toMatch(/moderation/i);
  });

  it('409 when trying to publish an already-pending listing', async () => {
    const res = await request(app).patch(`/api/listings/${draftListingId}/publish`)
      .set('Authorization', 'Bearer ' + providerToken);
    expect(res.status).toBe(409);
  });
});

describe('GET /api/listings (public)', () => {
  it('200 returns active listings', async () => {
    const res = await request(app).get('/api/listings');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.listings)).toBe(true);
  });

  it('200 filters by type', async () => {
    const res = await request(app).get('/api/listings?type=equipment');
    expect(res.status).toBe(200);
  });
});

afterAll(async () => {});
