const express = require('express');
const router = express.Router();
const { upsertProfile, getProfile, getProviderListings, requestVerification, getProviderAnalytics, getResponseRate, saveAvailability, getAvailability } = require('../controllers/providerProfileController');
const { submitRating, getRating, getRatings } = require('../controllers/ratingController');
const { getTemplates, createTemplate, deleteTemplate } = require('../controllers/templateController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Protected — provider only
router.post('/profile', authenticateToken, requireRole(['equipment_provider','service_provider']), upsertProfile);
router.get('/profile', authenticateToken, requireRole(['equipment_provider','service_provider']), getProfile);

// Public — any user can view a provider profile
router.get('/:userId/profile', getProfile);
router.get('/:userId/listings', getProviderListings);

// Ratings (KAN-022 / K-166)
router.post('/:userId/rate', authenticateToken, requireRole(['founder']), submitRating);
router.get('/:userId/rating', getRating);
router.get('/:userId/ratings', getRatings);

// K-40: Provider analytics
router.get('/analytics', authenticateToken, requireRole(['equipment_provider','service_provider']), getProviderAnalytics);

// K-35: Provider requests verification badge
router.post('/verify-request', authenticateToken, requireRole(['equipment_provider','service_provider']), requestVerification);

// K-68: Quick-reply templates (any authenticated user — providers + founders both message)
router.get('/templates', authenticateToken, getTemplates);
router.post('/templates', authenticateToken, createTemplate);
router.delete('/templates/:id', authenticateToken, deleteTemplate);

// K-71: Provider response rate (public)
router.get('/:userId/response-rate', getResponseRate);

// K-164: Availability — provider saves, public reads
router.post('/availability', authenticateToken, requireRole(['equipment_provider','service_provider']), saveAvailability);
router.get('/:userId/availability', getAvailability);

module.exports = router;
