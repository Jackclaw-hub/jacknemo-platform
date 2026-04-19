const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getPendingListings, approveListing, rejectListing } = require('../controllers/adminController');

const adminOnly = [authenticateToken, requireRole(['admin'])];

router.get('/listings', ...adminOnly, getPendingListings);
router.put('/listings/:id/approve', ...adminOnly, approveListing);
router.put('/listings/:id/reject', ...adminOnly, rejectListing);

module.exports = router;
