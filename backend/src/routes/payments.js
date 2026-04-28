// K-31: Stripe payment routes
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { createCheckoutSession, handleWebhook, getPaymentStatus } = require('../controllers/paymentsController');

// POST /api/payments/checkout-session — authenticated founder/provider
router.post('/checkout-session', authenticateToken, createCheckoutSession);

// POST /api/payments/webhook — Stripe calls this (no auth, signature-verified)
// rawBody is saved by the verify callback in app.js express.json() setup (K-41)
router.post('/webhook', handleWebhook);

// GET /api/payments/status/:listing_id — public status check
router.get('/status/:listing_id', getPaymentStatus);

module.exports = router;
