const express = require('express');
const router = express.Router();
const { searchListings } = require('../controllers/searchController');
const { authenticateToken } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/security');
const {
  createListing, getListings, getListing,
  updateListing, deleteListing, getMyListings,
  trackView, trackContact
} = require('../controllers/listingsController');

// Search (must come before /:id)
router.get('/search', searchListings);

// Public
router.get('/', apiRateLimiter, getListings);
router.get('/:id', apiRateLimiter, getListing);
router.post('/:id/view', apiRateLimiter, trackView);

// Protected
router.post('/', authenticateToken, createListing);
router.put('/:id', authenticateToken, updateListing);
router.delete('/:id', authenticateToken, deleteListing);
router.get('/me/listings', authenticateToken, getMyListings);
router.post('/:id/contact', authenticateToken, trackContact);

module.exports = router;
