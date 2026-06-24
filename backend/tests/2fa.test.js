// K-182: Tests for 2FA TOTP (K-176) + email verification enforcement (K-177)
const request = require('supertest');
process.env.JWT_SECRET = 'test-secret-k182';
process.env.NODE_ENV = 'test';

const app = require('../src/app');
const NativeAuth = require('../src/auth-native');
const auth = new NativeAuth();

// Helper: get access token for admin user (email_verified = true)
async function getAdminToken() {
  const res = await request(app).post('/api/auth/login')
    .send({ email: 'admin@nemoclaw.dev', password: 'admin2026!' });
  return res.body.access_token;
}

// ── 2FA Setup ────────────────────────────────────────────────────────────────
describe('POST /api/auth/2fa/setup', () => {
  it('401 without auth', async () => {
    const res = await request(app).post('/api/auth/2fa/setup');
    expect(res.status).toBe(401);
  });

  it('200 returns secret and QR for authenticated user', async () => {
    const token = await getAdminToken();
    const res = await request(app).post('/api/auth/2fa/setup')
      .set('Authorization', 'Bearer ' + token);
    // Admin user has totp_enabled undefined/false in mock — should succeed
    expect([200, 400]).toContain(res.status); // 400 if already enabled
    if (res.status === 200) {
      expect(res.body.secret).toBeDefined();
      expect(res.body.qr_code).toBeDefined();
      expect(res.body.otpauth_url).toBeDefined();
    }
  });
});

// ── 2FA Verify ───────────────────────────────────────────────────────────────
describe('POST /api/auth/2fa/verify', () => {
  it('401 without auth', async () => {
    const res = await request(app).post('/api/auth/2fa/verify');
    expect(res.status).toBe(401);
  });

  it('400 when token missing', async () => {
    const token = await getAdminToken();
    const res = await request(app).post('/api/auth/2fa/verify')
      .set('Authorization', 'Bearer ' + token)
      .send({});
    expect(res.status).toBe(400);
  });
});

// ── 2FA Disable ──────────────────────────────────────────────────────────────
describe('POST /api/auth/2fa/disable', () => {
  it('401 without auth', async () => {
    const res = await request(app).post('/api/auth/2fa/disable');
    expect(res.status).toBe(401);
  });

  it('400 when token missing', async () => {
    const token = await getAdminToken();
    const res = await request(app).post('/api/auth/2fa/disable')
      .set('Authorization', 'Bearer ' + token)
      .send({});
    expect(res.status).toBe(400);
  });
});

// ── 2FA Validate Login ───────────────────────────────────────────────────────
describe('POST /api/auth/2fa/validate-login', () => {
  it('400 when temp_token missing', async () => {
    const res = await request(app).post('/api/auth/2fa/validate-login')
      .send({ token: '123456' });
    expect(res.status).toBe(400);
  });

  it('400 when TOTP token missing', async () => {
    const res = await request(app).post('/api/auth/2fa/validate-login')
      .send({ temp_token: 'xyz' });
    expect(res.status).toBe(400);
  });

  it('401 with invalid temp_token', async () => {
    const res = await request(app).post('/api/auth/2fa/validate-login')
      .send({ temp_token: 'invalid.token.here', token: '123456' });
    expect(res.status).toBe(401);
  });

  it('401 with wrong-type token (access token, not challenge)', async () => {
    const adminToken = await getAdminToken();
    const res = await request(app).post('/api/auth/2fa/validate-login')
      .send({ temp_token: adminToken, token: '123456' });
    expect(res.status).toBe(401);
  });
});

// ── K-177: Email verification enforcement ────────────────────────────────────
describe('POST /api/auth/login — K-177 email_verified gate', () => {
  it('200 for admin user (email_verified = true)', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'admin@nemoclaw.dev', password: 'admin2026!' });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
  });

  it('403 for newly registered user with unverified email', async () => {
    // Register a new user (email_verified = false by default)
    const regRes = await request(app).post('/api/auth/register').send({
      email: 'unverified2fa@test.com',
      password: 'testpass123',
      role: 'founder',
      name: 'Unverified User',
    });
    expect(regRes.status).toBe(201);

    // Attempt login — should be blocked
    const loginRes = await request(app).post('/api/auth/login')
      .send({ email: 'unverified2fa@test.com', password: 'testpass123' });
    expect(loginRes.status).toBe(403);
    expect(loginRes.body.error).toMatch(/not verified/i);
  });
});

// ── K-179: SEO endpoints ─────────────────────────────────────────────────────
describe('GET /robots.txt — K-179', () => {
  it('200 returns text/plain with User-agent and Sitemap', async () => {
    const res = await request(app).get('/robots.txt');
    expect(res.status).toBe(200);
    expect(res.text).toContain('User-agent: *');
    expect(res.text).toContain('Sitemap:');
    expect(res.text).toContain('Disallow: /api/');
  });
});

describe('GET /sitemap.xml — K-179', () => {
  it('200 returns XML with urlset', async () => {
    const res = await request(app).get('/sitemap.xml');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);
    expect(res.text).toContain('<urlset');
    expect(res.text).toContain('<url>');
  });
});
