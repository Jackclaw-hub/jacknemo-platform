const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { getRadar } = require('../controllers/radarController');

// GET /api/radar — personalized radar for authenticated founder
router.get('/', authenticateToken, getRadar);

module.exports = router;
