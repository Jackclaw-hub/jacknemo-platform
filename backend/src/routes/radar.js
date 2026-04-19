const express = require('express');
const router = express.Router();
const { getRadar } = require('../controllers/radarController');
const { addHistory, getHistory } = require('../controllers/radarHistoryController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', authenticateToken, getRadar);
router.post('/history', authenticateToken, requireRole(['founder']), addHistory);
router.get('/history', authenticateToken, requireRole(['founder']), getHistory);

module.exports = router;
