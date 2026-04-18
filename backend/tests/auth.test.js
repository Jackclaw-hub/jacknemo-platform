const request = require('supertest');
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test';

jest.mock('../src/config/db', () => ({ query: jest.fn() }));
const db = require('../src/config/db');
const app = require('../src/app');

describe('POST /api/auth/register', () => {
  it('400 when email missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ password: 'secret123' });
    expect(res.status).toBe(400);
  });
  it('400 when password too short', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'short' });
    expect(res.status).toBe(400);
  });
  it('201 on success', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 'uuid-1', email: 'a@b.com', role: 'user', created_at: new Date() }] });
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'password123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
  });
  it('409 on duplicate email', async () => {
    const err = Object.assign(new Error('dup'), { code: '23505' });
    db.query.mockRejectedValueOnce(err);
    const res = await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'password123' });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('400 when fields missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });
  it('401 for unknown email', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/login').send({ email: 'no@one.com', password: 'pass1234' });
    expect(res.status).toBe(401);
  });
});
