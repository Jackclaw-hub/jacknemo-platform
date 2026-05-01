const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { apiRateLimiter, validateListing } = require('../middleware/security');
const { listingsWriteLimiter } = require('../middleware/rateLimiter');
const {
  createListing, getListings, getListing, contactListing,
  updateListing, deleteListing, getMyListings, getMyListingById, promoteListing, demoteListing, publishListing, pauseListing,
  renewListing, runListingExpiry, recordView, duplicateListing, suggestListings, getRelatedListings
} = require('../controllers/listingsController');
const { reportListing, getReportCount } = require('../controllers/reportController');

// SSE clients registry (in-memory, resets on restart — sufficient for polling fallback)
const sseClients = new Map(); // userId → res

// Expose emitter for use by other routes (e.g. messagesController can call notifyUser)
router.emitToUser = (userId, event, data) => {
  const res = sseClients.get(String(userId));
  if (res) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
};

// GET /api/listings/events?token=xxx  — SSE stream for real-time notifications
router.get('/events', (req, res) => {
  // Auth via query token (EventSource cannot set headers)
  const token = req.query.token;
  if (!token) return res.status(401).end();

  let userId = null;
  try {
    const NativeAuth = require('../auth-native');
    const a = new NativeAuth();
    const result = a.verifyToken(token);
    if (!result.valid) return res.status(401).end();
    userId = String(result.user.id);
  } catch { return res.status(401).end(); }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send connected event
  res.write(`event: connected\ndata: {"ok":true}\n\n`);

  // Register client
  sseClients.set(userId, res);

  // Heartbeat every 20s to keep connection alive
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { cleanup(); }
  }, 20000);

  // Auto-close after 5 min (browser reconnects automatically)
  const timeout = setTimeout(() => { cleanup(); res.end(); }, 300000);

  function cleanup() {
    clearInterval(heartbeat);
    clearTimeout(timeout);
    sseClients.delete(userId);
  }

  req.on('close', cleanup);
  req.on('error', cleanup);
});

// Must be before /:id to avoid being matched as id="me"
router.get('/me/listings', authenticateToken, getMyListings);
// K-131: Single owned listing by id (provider ownership check)
router.get('/me/listings/:id', authenticateToken, getMyListingById);

// Public routes
router.get('/suggest', suggestListings); // K-88: autocomplete — must be before /:id
router.get('/', apiRateLimiter, getListings);
router.get('/:id', apiRateLimiter, getListing);
router.post('/:id/contact', authenticateToken, contactListing);

// Admin: premium management (K-20)
router.patch('/:id/premium', authenticateToken, promoteListing);
router.delete('/:id/premium', authenticateToken, demoteListing);

// K-43: Publish draft listing
router.patch('/:id/publish', authenticateToken, publishListing);

// K-103: Pause active listing → draft
router.patch('/:id/pause', authenticateToken, pauseListing);

// K-56: Renew listing (provider) / expire old listings (admin)
router.patch('/:id/renew', authenticateToken, renewListing);
router.post('/admin/expire', authenticateToken, runListingExpiry);

// K-67: Report abuse
router.post('/:id/report', authenticateToken, reportListing);
router.get('/:id/reports/count', authenticateToken, getReportCount);

// K-69: Explicit view tracking (session-deduplicated by frontend)
router.post('/:id/view', recordView);

// K-73: Duplicate listing as draft
router.post('/:id/duplicate', authenticateToken, duplicateListing);

// K-100: Related listings
router.get('/:id/related', getRelatedListings);

// Protected routes (provider only)
router.post('/', authenticateToken, listingsWriteLimiter, validateListing, createListing);
router.put('/:id', authenticateToken, listingsWriteLimiter, validateListing, updateListing);
router.delete('/:id', authenticateToken, deleteListing);

module.exports = router;
