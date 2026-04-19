const express = require('express');
const router = express.Router();
const { upsertProfile, getProfile } = require('../controllers/founderController');
const { saveSearch, getSavedSearches, deleteSavedSearch } = require('../controllers/savedSearchController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Founder profile
router.post('/profile', authenticateToken, requireRole(['founder']), upsertProfile);
router.get('/profile', authenticateToken, requireRole(['founder']), getProfile);

// Saved searches (KAN-020)
router.post('/saved-searches', authenticateToken, requireRole(['founder']), saveSearch);
router.get('/saved-searches', authenticateToken, requireRole(['founder']), getSavedSearches);
router.delete('/saved-searches/:id', authenticateToken, requireRole(['founder']), deleteSavedSearch);

module.exports = router;
