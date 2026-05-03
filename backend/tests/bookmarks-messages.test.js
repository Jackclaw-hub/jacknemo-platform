// K-172: Tests for bookmarks (K-48/K-158) and messages (K-21)
const request = require('supertest');
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const app = require('../src/app');

let founderToken, providerToken, founderId, providerId, listingId;

beforeAll(async () => {
  // Register founder
  const fnd = await request(app).post('/api/auth/register')
    .send({ email: 'bm-founder@test.com', password: 'password123', role: 'founder', name: 'BM Founder' });
  founderToken = fnd.body.access_token || fnd.body.token;
  founderId = fnd.body.user?.id;

  // Register provider
  const prv = await request(app).post('/api/auth/register')
    .send({ email: 'bm-provider@test.com', password: 'password123', role: 'equipment_provider', name: 'BM Provider' });
  providerToken = prv.body.access_token || prv.body.token;
  providerId = prv.body.user?.id;

  // Create + approve listing so bookmarks can reference it
  const lst = await request(app).post('/api/listings')
    .set('Authorization', 'Bearer ' + providerToken)
    .send({ title: 'BM Test Listing', type: 'equipment', geo: 'national' });
  listingId = lst.body.listing?.id;

  const adminLogin = await request(app).post('/api/auth/login')
    .send({ email: 'admin@nemoclaw.dev', password: 'admin2026!' });
  const adminToken = adminLogin.body.access_token;
  if (listingId && adminToken) {
    await request(app).put('/api/admin/listings/' + listingId + '/approve')
      .set('Authorization', 'Bearer ' + adminToken);
  }
});

// ── Bookmarks ─────────────────────────────────────────────────────────────────

describe('POST /api/founders/bookmarks', () => {
  it('401 without auth', async () => {
    const res = await request(app).post('/api/founders/bookmarks').send({ listing_id: listingId });
    expect(res.status).toBe(401);
  });

  it('400 without listing_id', async () => {
    const res = await request(app).post('/api/founders/bookmarks')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({});
    expect(res.status).toBe(400);
  });

  it('404 for non-existent listing', async () => {
    const res = await request(app).post('/api/founders/bookmarks')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ listing_id: 99999 });
    expect(res.status).toBe(404);
  });

  it('201 saves bookmark', async () => {
    const res = await request(app).post('/api/founders/bookmarks')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ listing_id: listingId });
    expect(res.status).toBe(201);
    expect(res.body.bookmark).toBeDefined();
  });

  it('201 idempotent — re-save does not error', async () => {
    const res = await request(app).post('/api/founders/bookmarks')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ listing_id: listingId });
    expect(res.status).toBe(201);
  });
});

describe('GET /api/founders/bookmarks', () => {
  it('401 without auth', async () => {
    const res = await request(app).get('/api/founders/bookmarks');
    expect(res.status).toBe(401);
  });

  it('200 returns array including saved listing', async () => {
    const res = await request(app).get('/api/founders/bookmarks')
      .set('Authorization', 'Bearer ' + founderToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.bookmarks)).toBe(true);
    const ids = res.body.bookmarks.map(b => b.listing_id);
    expect(ids).toContain(listingId);
  });
});

describe('DELETE /api/founders/bookmarks/:listing_id', () => {
  it('200 removes bookmark', async () => {
    const res = await request(app).delete('/api/founders/bookmarks/' + listingId)
      .set('Authorization', 'Bearer ' + founderToken);
    expect(res.status).toBe(200);
  });

  it('GET bookmarks no longer contains the deleted listing', async () => {
    const res = await request(app).get('/api/founders/bookmarks')
      .set('Authorization', 'Bearer ' + founderToken);
    expect(res.status).toBe(200);
    const ids = res.body.bookmarks.map(b => b.listing_id);
    expect(ids).not.toContain(listingId);
  });
});

// ── Bookmark collections (K-158) ──────────────────────────────────────────────

describe('POST /api/founders/collections', () => {
  it('400 without name', async () => {
    const res = await request(app).post('/api/founders/collections')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({});
    expect(res.status).toBe(400);
  });

  it('201 creates collection', async () => {
    const res = await request(app).post('/api/founders/collections')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ name: 'Favorieten' });
    expect(res.status).toBe(201);
    expect(res.body.collection?.name).toBe('Favorieten');
  });
});

describe('GET /api/founders/collections', () => {
  it('200 returns collections list', async () => {
    const res = await request(app).get('/api/founders/collections')
      .set('Authorization', 'Bearer ' + founderToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.collections)).toBe(true);
    expect(res.body.collections.length).toBeGreaterThanOrEqual(1);
  });
});

// ── Messages ──────────────────────────────────────────────────────────────────

describe('POST /api/messages', () => {
  it('401 without auth', async () => {
    const res = await request(app).post('/api/messages')
      .send({ recipient_id: providerId, body: 'Hallo' });
    expect(res.status).toBe(401);
  });

  it('400 without body', async () => {
    const res = await request(app).post('/api/messages')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ recipient_id: providerId });
    expect(res.status).toBe(400);
  });

  it('400 without recipient_id', async () => {
    const res = await request(app).post('/api/messages')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ body: 'Hallo' });
    expect(res.status).toBe(400);
  });

  it('201 sends message', async () => {
    const res = await request(app).post('/api/messages')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ recipient_id: providerId, body: 'Interesse an eurem Angebot', listing_id: listingId });
    expect(res.status).toBe(201);
    expect(res.body.message?.body).toBe('Interesse an eurem Angebot');
  });
});

describe('GET /api/messages/unread', () => {
  it('401 without auth', async () => {
    const res = await request(app).get('/api/messages/unread');
    expect(res.status).toBe(401);
  });

  it('200 returns unread count for provider (has 1 unread)', async () => {
    const res = await request(app).get('/api/messages/unread')
      .set('Authorization', 'Bearer ' + providerToken);
    expect(res.status).toBe(200);
    expect(typeof res.body.unread).toBe('number');
    expect(res.body.unread).toBeGreaterThanOrEqual(1);
  });

  it('200 returns 0 unread for founder (sender has none)', async () => {
    const res = await request(app).get('/api/messages/unread')
      .set('Authorization', 'Bearer ' + founderToken);
    expect(res.status).toBe(200);
    expect(res.body.unread).toBe(0);
  });
});

describe('GET /api/messages/thread', () => {
  it('400 without otherUserId', async () => {
    const res = await request(app).get('/api/messages/thread')
      .set('Authorization', 'Bearer ' + founderToken);
    expect(res.status).toBe(400);
  });

  it('200 returns messages between founder and provider', async () => {
    const res = await request(app).get('/api/messages/thread?otherUserId=' + providerId)
      .set('Authorization', 'Bearer ' + founderToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.messages)).toBe(true);
    expect(res.body.messages.length).toBeGreaterThanOrEqual(1);
    expect(res.body.messages[0].body).toBe('Interesse an eurem Angebot');
  });
});
