const { adminVerifyProvider } = require('../controllers/providerProfileController');
const express = require('express');
const router = express.Router();
const { getPendingListings, getAllListings, approveListing, rejectListing, featureListing, unfeatureListing, getPendingVerification, getExpiredPremium, runPremiumExpiry, bulkAction, getAdminListingDetail, getListingHistory, exportListingsCSV, exportUsersCSV } = require('../controllers/adminController');
const { getAnalytics, getTrends, getSearchTerms, getStatsOverview, getTopProviders } = require('../controllers/adminAnalyticsController');
const { listUsers, disableUser, enableUser, getUserDetail } = require('../controllers/adminUserController');

const { getReports, dismissReport } = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const adminOnly = [authenticateToken, requireRole(['admin'])];

router.get('/listings/pending', ...adminOnly, getPendingListings);
// K-60: All listings with search/filter
router.get('/listings', ...adminOnly, getAllListings);
router.put('/listings/:id/approve', ...adminOnly, approveListing);
router.put('/listings/:id/reject', ...adminOnly, rejectListing);
router.get('/analytics', ...adminOnly, getAnalytics);
router.get('/analytics/trends', ...adminOnly, getTrends);
router.get('/analytics/search-terms', ...adminOnly, getSearchTerms); // K-104
router.get('/analytics/top-providers', ...adminOnly, getTopProviders); // K-157
router.get('/stats/overview', ...adminOnly, getStatsOverview); // K-137
router.put('/listings/:id/feature', ...adminOnly, featureListing);
router.put('/listings/:id/unfeature', ...adminOnly, unfeatureListing);

// K-37: Pending verification queue
router.get('/providers/pending-verification', ...adminOnly, getPendingVerification);
// K-38: Expired premium listings
router.get('/listings/expired-premium', ...adminOnly, getExpiredPremium);
router.post('/listings/run-expiry', ...adminOnly, runPremiumExpiry);
// K-35: Admin approves/rejects provider verification
router.patch('/providers/:userId/verify', ...adminOnly, adminVerifyProvider);

// K-55: Bulk action
router.post('/listings/bulk-action', ...adminOnly, bulkAction);
// K-126: Admin listing detail (enriched)
router.get('/listings/:id/detail', ...adminOnly, getAdminListingDetail);
// K-147: Listing status history
router.get('/listings/:id/history', ...adminOnly, getListingHistory);

// K-65: User management
router.get('/users', ...adminOnly, listUsers);
router.get('/users/:id', ...adminOnly, getUserDetail);
router.patch('/users/:id/disable', ...adminOnly, disableUser);
router.patch('/users/:id/enable', ...adminOnly, enableUser);

// K-66: CSV exports
router.get('/export/listings', ...adminOnly, exportListingsCSV);
router.get('/export/users', ...adminOnly, exportUsersCSV);

// K-67: Abuse reports
router.get('/reports', ...adminOnly, getReports);
router.patch('/reports/:id/dismiss', ...adminOnly, dismissReport);

module.exports = router;
