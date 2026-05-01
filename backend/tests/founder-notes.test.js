const request = require('supertest');
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

const app = require('../src/app');

let founderToken;
let otherFounderToken;

beforeAll(async () => {
  const r1 = await request(app).post('/api/auth/register')
    .send({ email: 'notes-founder1@test.com', password: 'password123', role: 'founder', name: 'Note F1' });
  founderToken = r1.body.access_token || r1.body.token;

  const r2 = await request(app).post('/api/auth/register')
    .send({ email: 'notes-founder2@test.com', password: 'password123', role: 'founder', name: 'Note F2' });
  otherFounderToken = r2.body.access_token || r2.body.token;
});

describe('GET /api/founders/listings/:id/note', () => {
  it('401 when not authenticated', async () => {
    const res = await request(app).get('/api/founders/listings/1/note');
    expect(res.status).toBe(401);
  });

  it('200 returns null when no note exists', async () => {
    const res = await request(app).get('/api/founders/listings/9999/note')
      .set('Authorization', 'Bearer ' + founderToken);
    expect(res.status).toBe(200);
    expect(res.body.note).toBeNull();
  });
});

describe('POST /api/founders/listings/:id/note', () => {
  it('401 when not authenticated', async () => {
    const res = await request(app).post('/api/founders/listings/1/note').send({ note: 'test' });
    expect(res.status).toBe(401);
  });

  it('400 when note is not a string', async () => {
    const res = await request(app).post('/api/founders/listings/1/note')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ note: 123 });
    expect(res.status).toBe(400);
  });

  it('200 saves a note', async () => {
    const res = await request(app).post('/api/founders/listings/42/note')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ note: 'Interesting provider, follow up next week.' });
    expect(res.status).toBe(200);
    expect(res.body.note.note).toBe('Interesting provider, follow up next week.');
  });

  it('200 upserts — updates existing note', async () => {
    await request(app).post('/api/founders/listings/43/note')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ note: 'First note' });
    const res = await request(app).post('/api/founders/listings/43/note')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ note: 'Updated note' });
    expect(res.status).toBe(200);
    expect(res.body.note.note).toBe('Updated note');
  });

  it('200 different founders have isolated notes for same listing', async () => {
    await request(app).post('/api/founders/listings/55/note')
      .set('Authorization', 'Bearer ' + founderToken)
      .send({ note: 'Founder 1 note' });
    const res = await request(app).get('/api/founders/listings/55/note')
      .set('Authorization', 'Bearer ' + otherFounderToken);
    expect(res.status).toBe(200);
    expect(res.body.note).toBeNull();
  });
});
