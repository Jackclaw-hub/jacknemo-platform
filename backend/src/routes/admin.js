const express = require('express');
const router = express.Router();
const { getPendingListings, approveListing, rejectListing, featureListing, unfeatureListing } = require('../controllers/adminController');
const { getAnalytics } = require('../controllers/adminAnalyticsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const adminOnly = [authenticateToken, requireRole(['admin'])];

router.get('/listings/pending', ...adminOnly, getPendingListings);
router.put('/listings/:id/approve', ...adminOnly, approveListing);
router.put('/listings/:id/reject', ...adminOnly, rejectListing);
router.get('/analytics', ...adminOnly, getAnalytics);
router.put('/listings/:id/feature', ...adminOnly, featureListing);
router.put('/listings/:id/unfeature', ...adminOnly, unfeatureListing);

module.exports = router;
