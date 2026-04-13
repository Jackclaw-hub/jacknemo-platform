const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { calculateScore } = require('../controllers/scoringController');

// POST /api/scoring/calculate - Calculate match score (protected)
router.post('/calculate', authenticateToken, calculateScore);

module.exports = router;