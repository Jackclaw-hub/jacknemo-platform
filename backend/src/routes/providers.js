const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { getProfile, saveProfile, getPublicProfile, getPublicListings } = require("../controllers/providersController");

// Own profile (authenticated)
router.get("/profile", authenticateToken, getProfile);
router.post("/profile", authenticateToken, saveProfile);

// Public provider view (no auth required)
router.get("/:id/profile", getPublicProfile);
router.get("/:id/listings", getPublicListings);

module.exports = router;
