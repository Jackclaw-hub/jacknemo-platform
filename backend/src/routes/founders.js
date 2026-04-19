const express = require('express');
const router = express.Router();
const { upsertProfile, getProfile } = require('../controllers/founderController');
const { authenticateToken, requireRole } = require('../middleware/auth');
router.post('/profile', authenticateToken, requireRole(['founder']), upsertProfile);
router.get('/profile', authenticateToken, requireRole(['founder']), getProfile);
module.exports = router;
