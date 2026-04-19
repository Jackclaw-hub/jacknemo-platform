const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { apiRateLimiter } = require('../middleware/security');
const {
  createListing, getListings, getListing,
  updateListing, deleteListing, getMyListings
} = require('../controllers/listingsController');

// Public routes
router.get('/', apiRateLimiter, getListings);
router.get('/:id', apiRateLimiter, getListing);

// Protected routes (provider only)
router.post('/', authenticateToken, createListing);
router.put('/:id', authenticateToken, updateListing);
router.delete('/:id', authenticateToken, deleteListing);
router.get('/me/listings', authenticateToken, getMyListings);

module.exports = router;
