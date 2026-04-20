const express = require("express");
const router = express.Router();
const { authenticateToken, requireRole } = require("../middleware/auth");
const { getPendingListings, approveListing, rejectListing, getAnalytics } = require("../controllers/adminController");

const adminOnly = [authenticateToken, requireRole(["admin"])];

router.get("/listings", ...adminOnly, getPendingListings);
router.put("/listings/:id/approve", ...adminOnly, approveListing);
router.put("/listings/:id/reject", ...adminOnly, rejectListing);
router.get("/analytics", ...adminOnly, getAnalytics);

// Bootstrap: create first admin (setup token protected)
router.post("/bootstrap", async (req, res) => {
  const { setup_token, email, password, name } = req.body;
  const expected = process.env.ADMIN_SETUP_TOKEN || "nemoclaw-admin-setup-2026";
  if (setup_token !== expected) return res.status(403).json({ error: "Invalid setup token" });

  const User = require("../models/User");
  const NativeAuth = require("../auth-native");

  try {
    const existing = await User.findByEmail(email);
    if (existing) return res.status(409).json({ error: "User already exists" });

    const auth = new NativeAuth();
    const password_hash = await auth.hashPassword(password);
    const user = await User.create({ email, password_hash, role: "admin", name, email_verified: true, verification_token: null });
    const tokens = {
      access_token: auth.generateAccessToken(user),
      refresh_token: auth.generateRefreshToken(user)
    };
    res.status(201).json({ message: "Admin created", user: { id: user.id, email: user.email, role: user.role }, ...tokens });
  } catch (err) {
    console.error("Bootstrap error:", err);
    res.status(500).json({ error: "Failed to create admin" });
  }
});

module.exports = router;
