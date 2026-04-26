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

afterAll(async () => {});
