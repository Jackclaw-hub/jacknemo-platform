const request = require("supertest");
process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";
const app = require("../src/app");

let founderToken;

beforeAll(async () => {
  // Register a founder for radar tests
  const res = await request(app).post("/api/auth/register").send({
    email: "testfounder@scoring.test", password: "password123",
    role: "founder", name: "Test Founder"
  });
  founderToken = res.body.access_token || res.body.token;
});

describe("Radar scoring API", () => {
  it("GET /api/radar with founder token returns 200", async () => {
    const res = await request(app).get("/api/radar")
      .set("Authorization", `Bearer ${founderToken}`);
    expect(res.status).toBe(200);
  });

  it("GET /api/radar without auth returns 401", async () => {
    const res = await request(app).get("/api/radar");
    expect(res.status).toBe(401);
  });

  it("GET /api/radar with admin token returns 403 (founders only)", async () => {
    const login = await request(app).post("/api/auth/login")
      .send({ email: "admin@nemoclaw.dev", password: "admin2026!" });
    const adminTok = login.body.access_token || login.body.token;
    const res = await request(app).get("/api/radar")
      .set("Authorization", `Bearer ${adminTok}`);
    expect(res.status).toBe(403);
  });
});

describe("Listings API", () => {
  it("POST /api/listings requires auth", async () => {
    const res = await request(app).post("/api/listings")
      .send({ title: "test", type: "equipment" });
    expect(res.status).toBe(401);
  });

  it("GET /api/listings returns 200", async () => {
    const res = await request(app).get("/api/listings");
    expect(res.status).toBe(200);
  });
});

afterAll(done => done());
