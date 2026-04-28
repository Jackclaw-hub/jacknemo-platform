const express = require('express');
const router = express.Router();
const { upsertProfile, getProfile, getProviderListings, requestVerification } = require('../controllers/providerProfileController');
const { submitRating, getRating } = require('../controllers/ratingController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Protected — provider only
router.post('/profile', authenticateToken, requireRole(['equipment_provider','service_provider']), upsertProfile);
router.get('/profile', authenticateToken, requireRole(['equipment_provider','service_provider']), getProfile);

// Public — any user can view a provider profile
router.get('/:userId/profile', getProfile);
router.get('/:userId/listings', getProviderListings);

// Ratings (KAN-022)
router.post('/:userId/rate', authenticateToken, requireRole(['founder']), submitRating);
router.get('/:userId/rating', getRating);

// K-35: Provider requests verification badge
router.post('/verify-request', authenticateToken, requireRole(['equipment_provider','service_provider']), requestVerification);

module.exports = router;
