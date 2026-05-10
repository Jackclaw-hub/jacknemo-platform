const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { getProfile, saveProfile, getPublicProfile, getPublicListings, getRatings, submitRating, getResponseTime } = require("../controllers/providersController");

// Own profile (authenticated)
router.get("/profile", authenticateToken, getProfile);
router.post("/profile", authenticateToken, saveProfile);

// Public provider view (no auth required)
router.get("/:id/profile", getPublicProfile);
router.get("/:id/listings", getPublicListings);
router.get("/:id/ratings", getRatings);
router.get('/:userId/response-time', getResponseTime);

// Submit rating (auth required)
router.post("/:id/rate", authenticateToken, submitRating);

module.exports = router;
