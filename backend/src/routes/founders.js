const express = require('express');
const router = express.Router();
const { upsertProfile, getProfile } = require('../controllers/founderController');
const { requireAuth, requireRole } = require('../middleware/auth');
router.post('/profile', requireAuth, requireRole(['founder']), upsertProfile);
router.get('/profile', requireAuth, requireRole(['founder']), getProfile);
module.exports = router;
