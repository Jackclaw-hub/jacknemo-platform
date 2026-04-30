const { adminVerifyProvider } = require('../controllers/providerProfileController');
const express = require('express');
const router = express.Router();
const { getPendingListings, getAllListings, approveListing, rejectListing, featureListing, unfeatureListing, getPendingVerification, getExpiredPremium, runPremiumExpiry, bulkAction } = require('../controllers/adminController');
const { getAnalytics } = require('../controllers/adminAnalyticsController');
const { listUsers, disableUser, enableUser } = require('../controllers/adminUserController');
const { exportListings, exportUsers } = require('../controllers/adminExportController');
const { getReports, dismissReport } = require('../controllers/reportController');
const { authenticateToken, requireRole } = require('../middleware/auth');

const adminOnly = [authenticateToken, requireRole(['admin'])];

router.get('/listings/pending', ...adminOnly, getPendingListings);
// K-60: All listings with search/filter
router.get('/listings', ...adminOnly, getAllListings);
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

// K-55: Bulk action
router.post('/listings/bulk-action', ...adminOnly, bulkAction);

// K-65: User management
router.get('/users', ...adminOnly, listUsers);
router.patch('/users/:id/disable', ...adminOnly, disableUser);
router.patch('/users/:id/enable', ...adminOnly, enableUser);

// K-66: CSV exports
router.get('/export/listings.csv', ...adminOnly, exportListings);
router.get('/export/users.csv', ...adminOnly, exportUsers);

// K-67: Abuse reports
router.get('/reports', ...adminOnly, getReports);
router.patch('/reports/:id/dismiss', ...adminOnly, dismissReport);

module.exports = router;
