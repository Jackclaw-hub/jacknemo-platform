const { adminVerifyProvider } = require('../controllers/providerProfileController');
const express = require('express');
const router = express.Router();
const { getPendingListings, approveListing, rejectListing, featureListing, unfeatureListing, getPendingVerification, getExpiredPremium, runPremiumExpiry } = require('../controllers/adminController');
const { getAnalytics } = require('../controllers/adminAnalyticsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const adminOnly = [authenticateToken, requireRole(['admin'])];

router.get('/listings/pending', ...adminOnly, getPendingListings);
router.put('/listings/:id/approve', ...adminOnly, approveListing);
router.put('/listings/:id/reject', ...adminOnly, rejectListing);
router.get('/analytics', ...adminOnly, getAnalytics);
router.put('/listings/:id/feature', ...adminOnly, featureListing);
router.put('/listings/:id/unfeature', ...adminOnly, unfeatureListing);

// K-37: Pending verification queue
router.get('/providers/pending-verification', ...adminOnly, getPendingVerification);
// K-38: Expired premium listings
router.get('/listings/expired-premium', ...adminOnly, getExpiredPremium);
router.post('/listings/run-expiry', ...adminOnly, runPremiumExpiry);
// K-35: Admin approves/rejects provider verification
router.patch('/providers/:userId/verify', ...adminOnly, adminVerifyProvider);

module.exports = router;
