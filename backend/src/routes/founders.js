const express = require('express');
const router = express.Router();
const { upsertProfile, getProfile, getFeed } = require('../controllers/founderController');
const { saveSearch, getSavedSearches, deleteSavedSearch } = require('../controllers/savedSearchController');
const { getReferralCode, getReferralStatsEndpoint } = require('../controllers/referralController');
const { saveBookmark, getBookmarks, deleteBookmark } = require('../controllers/bookmarksController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Founder profile
router.post('/profile', authenticateToken, requireRole(['founder']), upsertProfile);
router.get('/profile', authenticateToken, requireRole(['founder']), getProfile);

// K-72: Activity feed
router.get('/feed', authenticateToken, requireRole(['founder']), getFeed);

// Saved searches (KAN-020)
router.post('/saved-searches', authenticateToken, requireRole(['founder']), saveSearch);
router.get('/saved-searches', authenticateToken, requireRole(['founder']), getSavedSearches);
router.delete('/saved-searches/:id', authenticateToken, requireRole(['founder']), deleteSavedSearch);

// Referral system (KAN-026)
router.get('/referral-code', authenticateToken, requireRole(['founder']), getReferralCode);
router.get('/referral-stats', authenticateToken, requireRole(['founder']), getReferralStatsEndpoint);

// K-48: Bookmarks
router.post('/bookmarks', authenticateToken, requireRole(['founder']), saveBookmark);
router.get('/bookmarks', authenticateToken, requireRole(['founder']), getBookmarks);
router.delete('/bookmarks/:listing_id', authenticateToken, requireRole(['founder']), deleteBookmark);

module.exports = router;
