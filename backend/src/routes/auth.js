const { Router } = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../db");
const router = Router();

router.post("/auth/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password required" });
  if (password.length < 8) return res.status(400).json({ error: "password must be at least 8 characters" });
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await query(
      "INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, role, created_at",
      [email.toLowerCase().trim(), hash]
    );
    const user = result.rows[0];
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
    return res.status(201).json({ user, token });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Email already registered" });
    return res.status(500).json({ error: "Registration failed" });
  }
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password required" });
  try {
    const result = await query("SELECT id, email, password, role FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
    return res.json({ token });
  } catch { return res.status(500).json({ error: "Login failed" }); }
});

module.exports = router;
