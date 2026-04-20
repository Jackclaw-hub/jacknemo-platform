const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { getProfile, saveProfile, getPublicProfile, getPublicListings, getRatings, submitRating } = require("../controllers/providersController");

// Own profile (authenticated)
router.get("/profile", authenticateToken, getProfile);
router.post("/profile", authenticateToken, saveProfile);

// Public provider view (no auth required)
router.get("/:id/profile", getPublicProfile);
router.get("/:id/listings", getPublicListings);
router.get("/:id/ratings", getRatings);

// Submit rating (auth required)
router.post("/:id/rate", authenticateToken, submitRating);

module.exports = router;
