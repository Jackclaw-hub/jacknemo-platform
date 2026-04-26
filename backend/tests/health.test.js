const request = require("supertest");
process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";
const app = require("../src/app");

describe("GET /health", () => {
  it("returns status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

describe("GET /api/admin/analytics", () => {
  it("401 without token", async () => {
    const res = await request(app).get("/api/admin/analytics");
    expect(res.status).toBe(401);
  });
});

describe("GET /api/listings", () => {
  it("200 public endpoint", async () => {
    const res = await request(app).get("/api/listings");
    expect(res.status).toBe(200);
  });
});

afterAll(async () => {});
