// K-173: Tests for notifications, saved searches, and message templates
const request = require('supertest');
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const app = require('../src/app');

let founderToken, providerToken, founderId, providerId, adminToken;

beforeAll(async () => {
  const adminLogin = await request(app).post('/api/auth/login')
    .send({ email: 'admin@nemoclaw.dev', password: 'admin2026!' });
  adminToken = adminLogin.body.access_token;

  const prv = await request(app).post('/api/auth/register')
    .send({ email: 'nst-provider@test.com', password: 'password123', role: 'equipment_provider', name: 'NST Provider' });
  providerToken = prv.body.access_token || prv.body.token;
  providerId = prv.body.user?.id;

  const fnd = await request(app).post('/api/auth/register')
    .send({ email: 'nst-founder@test.com', password: 'password123', role: 'founder', name: 'NST Founder' });
  founderToken = fnd.body.access_token || fnd.body.token;
  founderId = fnd.body.user?.id;
});

// ── Notifications ─────────────────────────────────────────────────────────────

describe('GET /api/notifications', () => {
  it('401 without auth', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });

  it('200 returns {notifications, unread} — empty initially', async () => {
    const res = await request(app).get('/api/notifications')
      .set('Authorization', 'Bearer ' + providerToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notifications)).toBe(true);
    expect(typeof res.body.unread).toBe('number');
  });

  it('200 unread count increases after listing approval', async () => {
    // Create + approve listing — triggers notifyListingApproved → inserts notification
    const lst = await request(app).post('/api/listings')
      .set('Authorization', 'Bearer ' + providerToken)
      .send({ title: 'NST Listing', type: 'equipment', geo: 'national' });
    const listingId = lst.body.listing?.id;
    if (listingId && adminToken) {
      await request(app).put('/api/admin/listings/' + listingId + '/approve')
        .set('Authorization', 'Bearer ' + adminToken);
    }
    const res = await request(app).get('/api/notifications')
      .set('Authorization', 'Bearer ' + providerToken);
    expect(res.status).toBe(200);
    expect(res.body.unread).toBeGreaterThanOrEqual(1);
  });
});

describe('PATCH /api/notifications/read-all', () => {
  it('401 without auth', async () => {
    const res = await request(app).patch('/api/notifications/read-all');
    expect(res.status).toBe(401);
  });

  it('200 marks all as read', async () => {
    const res = await request(app).patch('/api/notifications/read-all')
      .set('Authorization', 'Bearer ' + providerToken);
    expect(res.status).toBe(200);
  });

  it('unread count is 0 after read-all', async () => {
    const res = await request(app).get('/api/notifications')
      .set('Authorization', 'Bearer ' + providerToken);
    expect(res.status).toBe(200);
    expect(res.body.unread).toBe(0);
  });
});

// ── Saved Searches ────────────────────────────────────────────────────────────

describe('POST /api/founders/saved-searches', () => {
  it('401 without auth', async () => {
    const res = await request(app).post('/api/founders/saved-searches')
      .send({ name: 'Test', filters: { type: 'equipment' } });
    expect(res.status).toBe(401);
  });

  it('400 without filters', async () => {
    const res = await request(app).post('/api/founders/saved-searches')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ name: 'Test' });
    expect(res.status).toBe(400);
  });

  it('201 creates saved search', async () => {
    const res = await request(app).post('/api/founders/saved-searches')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ name: 'Equipment Berlin', filters: { type: 'equipment', city: 'Berlin' } });
    expect(res.status).toBe(201);
    expect(res.body.savedSearch?.name).toBe('Equipment Berlin');
  });

  it('201 creates second saved search with default name', async () => {
    const res = await request(app).post('/api/founders/saved-searches')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ filters: { geo: 'national' } });
    expect(res.status).toBe(201);
    expect(res.body.savedSearch).toBeDefined();
  });
});

describe('GET /api/founders/saved-searches', () => {
  it('401 without auth', async () => {
    const res = await request(app).get('/api/founders/saved-searches');
    expect(res.status).toBe(401);
  });

  it('200 returns saved searches list', async () => {
    const res = await request(app).get('/api/founders/saved-searches')
      .set('Authorization', 'Bearer ' + founderToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.savedSearches)).toBe(true);
    expect(res.body.savedSearches.length).toBeGreaterThanOrEqual(2);
  });
});

describe('DELETE /api/founders/saved-searches/:id', () => {
  let savedSearchId;

  beforeAll(async () => {
    const res = await request(app).get('/api/founders/saved-searches')
      .set('Authorization', 'Bearer ' + founderToken);
    savedSearchId = res.body.savedSearches?.[0]?.id;
  });

  it('404 for non-existent id', async () => {
    const res = await request(app).delete('/api/founders/saved-searches/99999')
      .set('Authorization', 'Bearer ' + founderToken);
    expect(res.status).toBe(404);
  });

  it('200 deletes saved search', async () => {
    if (!savedSearchId) return;
    const res = await request(app).delete('/api/founders/saved-searches/' + savedSearchId)
      .set('Authorization', 'Bearer ' + founderToken);
    expect(res.status).toBe(200);
  });
});

// ── Message Templates ─────────────────────────────────────────────────────────

describe('POST /api/providers/templates', () => {
  it('401 without auth', async () => {
    const res = await request(app).post('/api/providers/templates')
      .send({ name: 'Test', body: 'Hallo!' });
    expect(res.status).toBe(401);
  });

  it('400 without name or body', async () => {
    const res = await request(app).post('/api/providers/templates')
      .set('Authorization', 'Bearer ' + providerToken)
      .send({ name: 'Only Name' });
    expect(res.status).toBe(400);
  });

  it('201 creates template', async () => {
    const res = await request(app).post('/api/providers/templates')
      .set('Authorization', 'Bearer ' + providerToken)
      .send({ name: 'Begrüßung', body: 'Vielen Dank für Ihre Anfrage!' });
    expect(res.status).toBe(201);
    expect(res.body.template?.name).toBe('Begrüßung');
  });
});

describe('GET /api/providers/templates', () => {
  it('401 without auth', async () => {
    const res = await request(app).get('/api/providers/templates');
    expect(res.status).toBe(401);
  });

  it('200 returns templates list', async () => {
    const res = await request(app).get('/api/providers/templates')
      .set('Authorization', 'Bearer ' + providerToken);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.templates)).toBe(true);
    expect(res.body.templates.length).toBeGreaterThanOrEqual(1);
    expect(res.body.templates[0].name).toBe('Begrüßung');
  });
});

describe('DELETE /api/providers/templates/:id', () => {
  let templateId;

  beforeAll(async () => {
    const res = await request(app).get('/api/providers/templates')
      .set('Authorization', 'Bearer ' + providerToken);
    templateId = res.body.templates?.[0]?.id;
  });

  it('404 for non-existent template', async () => {
    const res = await request(app).delete('/api/providers/templates/99999')
      .set('Authorization', 'Bearer ' + providerToken);
    expect(res.status).toBe(404);
  });

  it('200 deletes template', async () => {
    if (!templateId) return;
    const res = await request(app).delete('/api/providers/templates/' + templateId)
      .set('Authorization', 'Bearer ' + providerToken);
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  it('GET templates now empty after deletion', async () => {
    const res = await request(app).get('/api/providers/templates')
      .set('Authorization', 'Bearer ' + providerToken);
    expect(res.status).toBe(200);
    expect(res.body.templates.length).toBe(0);
  });
});
