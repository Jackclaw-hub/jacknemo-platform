// K-31: Stripe payment routes
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createCheckoutSession, handleWebhook, getPaymentStatus } = require('../controllers/paymentsController');

// Stripe webhook needs raw body for signature verification
// Must be registered BEFORE express.json() parses it — handled via rawBodySaver middleware below
const rawBodySaver = (req, res, buf) => { req.rawBody = buf; };

// POST /api/payments/checkout-session — authenticated founder/provider
router.post('/checkout-session', authenticateToken, createCheckoutSession);

// POST /api/payments/webhook — Stripe calls this (no auth, signature-verified)
router.post('/webhook', express.raw({ type: 'application/json', verify: rawBodySaver }), handleWebhook);

// GET /api/payments/status/:listing_id — public status check
router.get('/status/:listing_id', getPaymentStatus);

module.exports = router;
