const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { apiRateLimiter, validateListing } = require('../middleware/security');
const {
  createListing, getListings, getListing, contactListing,
  updateListing, deleteListing, getMyListings, promoteListing, demoteListing
} = require('../controllers/listingsController');

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

// Public routes
router.get('/', apiRateLimiter, getListings);
router.get('/:id', apiRateLimiter, getListing);
router.post('/:id/contact', authenticateToken, contactListing);

// Admin: premium management (K-20)
router.patch('/:id/premium', authenticateToken, promoteListing);
router.delete('/:id/premium', authenticateToken, demoteListing);

// Protected routes (provider only)
router.post('/', authenticateToken, validateListing, createListing);
router.put('/:id', authenticateToken, validateListing, updateListing);
router.delete('/:id', authenticateToken, deleteListing);

module.exports = router;
