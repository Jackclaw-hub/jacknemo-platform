const request = require("supertest");
process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";

// App uses ../src/config/database (mock DB in test mode — no DB_HOST set)
const app = require("../src/app");

describe("POST /api/auth/register", () => {
  it("400 when email missing", async () => {
    const res = await request(app).post("/api/auth/register")
      .send({ password: "secret123", role: "founder", name: "Test" });
    expect(res.status).toBe(400);
  });

  it("400 when password too short", async () => {
    const res = await request(app).post("/api/auth/register")
      .send({ email: "a@b.com", password: "short", role: "founder", name: "Test" });
    expect(res.status).toBe(400);
  });

  it("201 on success", async () => {
    const res = await request(app).post("/api/auth/register")
      .send({ email: "newuser@test.com", password: "password123", role: "founder", name: "Test User" });
    expect(res.status).toBe(201);
    expect(res.body.access_token || res.body.token).toBeDefined();
  });

  it("409 on duplicate email", async () => {
    // Register once
    await request(app).post("/api/auth/register")
      .send({ email: "dup@test.com", password: "password123", role: "founder", name: "Dup" });
    // Register again with same email
    const res = await request(app).post("/api/auth/register")
      .send({ email: "dup@test.com", password: "password123", role: "founder", name: "Dup" });
    expect(res.status).toBe(409);
  });
});

describe("POST /api/auth/login", () => {
  it("400 when fields missing", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });

  it("401 for unknown email", async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email: "nobody@nowhere.com", password: "pass1234" });
    expect(res.status).toBe(401);
  });

  it("200 with valid credentials", async () => {
    // Use seeded admin account
    const res = await request(app).post("/api/auth/login")
      .send({ email: "admin@nemoclaw.dev", password: "admin2026!" });
    expect(res.status).toBe(200);
    expect(res.body.access_token || res.body.token).toBeDefined();
  });
});

// K-80: Change password
describe("POST /api/auth/change-password", () => {
  let token;
  beforeAll(async () => {
    const res = await request(app).post("/api/auth/login")
      .send({ email: "admin@nemoclaw.dev", password: "admin2026!" });
    token = res.body.access_token;
  });

  it("401 without auth", async () => {
    const res = await request(app).post("/api/auth/change-password")
      .send({ current_password: "admin2026!", new_password: "newpass123" });
    expect(res.status).toBe(401);
  });

  it("400 when fields missing", async () => {
    const res = await request(app).post("/api/auth/change-password")
      .set("Authorization", "Bearer " + token)
      .send({ current_password: "admin2026!" });
    expect(res.status).toBe(400);
  });

  it("400 when new password too short", async () => {
    const res = await request(app).post("/api/auth/change-password")
      .set("Authorization", "Bearer " + token)
      .send({ current_password: "admin2026!", new_password: "short" });
    expect(res.status).toBe(400);
  });

  it("401 when current password is wrong", async () => {
    const res = await request(app).post("/api/auth/change-password")
      .set("Authorization", "Bearer " + token)
      .send({ current_password: "wrongpassword", new_password: "newpass123" });
    expect(res.status).toBe(401);
  });

  it("200 on successful change", async () => {
    const res = await request(app).post("/api/auth/change-password")
      .set("Authorization", "Bearer " + token)
      .send({ current_password: "admin2026!", new_password: "admin2026!" });
    expect(res.status).toBe(200);
    expect(res.body.message).toBeDefined();
  });
});

// K-111: Auth brute-force rate limiter
describe("authRateLimiter", () => {
  const { createRateLimiter } = require("../src/middleware/security");

  function makeReqRes(ip = "5.5.5.5") {
    const req = { ip, connection: { remoteAddress: ip }, headers: {} };
    const res = {
      _headers: {},
      _status: null,
      _body: null,
      setHeader(k, v) { this._headers[k.toLowerCase()] = v; },
      status(s) { this._status = s; return this; },
      json(b) { this._body = b; return this; },
    };
    return { req, res };
  }

  it("allows requests under limit", async () => {
    const limiter = createRateLimiter(60000, 3, "Too many");
    for (let i = 0; i < 3; i++) {
      const { req, res } = makeReqRes();
      let nextCalled = false;
      limiter(req, res, () => { nextCalled = true; });
      expect(nextCalled).toBe(true);
      expect(res._status).toBeNull();
    }
  });

  it("returns 429 after limit exceeded", () => {
    const limiter = createRateLimiter(60000, 2, "Too many login attempts");
    const ip = "9.9.9.9";
    // Exhaust limit
    for (let i = 0; i < 2; i++) {
      const { req, res } = makeReqRes(ip);
      limiter(req, res, () => {});
    }
    // One more — should 429
    const { req, res } = makeReqRes(ip);
    limiter(req, res, () => {});
    expect(res._status).toBe(429);
    expect(res._body.error).toBe("Too many requests");
    expect(res._body.message).toBe("Too many login attempts");
    expect(res._body.retryAfter).toBeGreaterThan(0);
  });

  it("sets Retry-After HTTP header on 429", () => {
    const limiter = createRateLimiter(60000, 1, "Too many login attempts");
    const ip = "8.8.8.8";
    const { req: r1, res: rs1 } = makeReqRes(ip);
    limiter(r1, rs1, () => {});
    // Second call triggers 429
    const { req, res } = makeReqRes(ip);
    limiter(req, res, () => {});
    expect(res._status).toBe(429);
    expect(res._headers["retry-after"]).toBeGreaterThan(0);
  });

  it("bypasses localhost in non-prod", () => {
    const limiter = createRateLimiter(60000, 1, "Too many");
    const ip = "127.0.0.1";
    for (let i = 0; i < 5; i++) {
      const { req, res } = makeReqRes(ip);
      let nextCalled = false;
      limiter(req, res, () => { nextCalled = true; });
      expect(nextCalled).toBe(true);
    }
  });

  it("sets X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset headers", () => {
    const limiter = createRateLimiter(60000, 10, "Too many");
    const { req, res } = makeReqRes("7.7.7.7");
    limiter(req, res, () => {});
    expect(res._headers["x-ratelimit-limit"]).toBe(10);
    expect(res._headers["x-ratelimit-remaining"]).toBeGreaterThanOrEqual(0);
    expect(res._headers["x-ratelimit-reset"]).toBeGreaterThan(0);
  });
});

afterAll(async () => {});
