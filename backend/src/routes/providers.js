const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { getProfile, saveProfile } = require("../controllers/providersController");

router.get("/profile", authenticateToken, getProfile);
router.post("/profile", authenticateToken, saveProfile);

module.exports = router;
