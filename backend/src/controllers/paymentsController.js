// K-31: Stripe Payment Integration — native fetch, no stripe npm package
const crypto = require('crypto');
const db = require('../config/database');
const { notifyPremiumUpgrade } = require('../services/notificationService');

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || '';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const BASE_URL = process.env.BASE_URL || 'https://jacknemo1994.de';
const PREMIUM_PRICE_EUR = 4900; // €49.00 in cents

async function stripePost(path, body) {
  const params = new URLSearchParams(body).toString();
  const resp = await fetch('https://api.stripe.com/v1' + path, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + STRIPE_SECRET,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params
  });
  const data = await resp.json();
  if (!resp.ok) throw Object.assign(new Error(data.error?.message || 'Stripe error'), { stripeError: data.error });
  return data;
}

// POST /api/payments/checkout-session
// Body: { listing_id }
// Creates a Stripe Checkout Session for premium listing upgrade
const createCheckoutSession = async (req, res) => {
  if (!STRIPE_SECRET) return res.status(503).json({ error: 'Payments not configured' });
  const { listing_id } = req.body;
  if (!listing_id) return res.status(400).json({ error: 'listing_id required' });

  // Verify listing belongs to current user
  let listing;
  try {
    const r = await db.query('SELECT * FROM listings WHERE id = ', [listing_id]);
    listing = r.rows[0];
  } catch (e) {
    return res.status(500).json({ error: 'DB error' });
  }
  if (!listing) return res.status(404).json({ error: 'Listing not found' });
  if (listing.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not your listing' });
  }
  if (listing.is_premium) return res.status(409).json({ error: 'Already premium' });

  try {
    const session = await stripePost('/checkout/sessions', {
      'payment_method_types[]': 'card',
      'line_items[0][price_data][currency]': 'eur',
      'line_items[0][price_data][unit_amount]': String(PREMIUM_PRICE_EUR),
      'line_items[0][price_data][product_data][name]': 'Premium Listing — ' + (listing.title || listing.name || 'Startup'),
      'line_items[0][price_data][product_data][description]': 'Featured placement + priority visibility for 30 days',
      'line_items[0][quantity]': '1',
      'mode': 'payment',
      'success_url': BASE_URL + '/provider-dashboard.html?payment=success&listing=' + listing_id,
      'cancel_url':  BASE_URL + '/provider-dashboard.html?payment=cancelled',
      'metadata[listing_id]': String(listing_id),
      'metadata[user_id]': String(req.user.id)
    });

    res.json({ url: session.url, session_id: session.id });
  } catch (e) {
    console.error('[STRIPE] checkout error:', e.message);
    res.status(502).json({ error: 'Failed to create checkout session', detail: e.message });
  }
};

// POST /api/payments/webhook
// Stripe sends events here — verify signature, handle checkout.session.completed
const handleWebhook = async (req, res) => {
  if (!STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: 'Webhook secret not configured' });

  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).json({ error: 'Missing stripe-signature' });

  // Verify webhook signature (HMAC-SHA256)
  let event;
  try {
    event = verifyStripeWebhook(req.rawBody || req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    console.error('[STRIPE] webhook signature invalid:', e.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const listing_id = session.metadata?.listing_id;
    if (listing_id && session.payment_status === 'paid') {
      try {
        // Set premium, record expiry 30 days from now
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await db.query(
          'UPDATE listings SET is_premium = true, premium_expires_at =  WHERE id = ',
          [expires, listing_id]
        );
        console.log('[STRIPE] listing', listing_id, 'upgraded to premium, expires', expires);
        // K-42: notify provider
        try {
          const provEmail = session.customer_email || session.customer_details?.email;
          if (provEmail) {
            await notifyPremiumUpgrade(
              { id: listing_id, title: session.metadata?.listing_title || 'Inserat', provider_id: session.metadata?.user_id, premium_expires_at: expires },
              provEmail
            );
          }
        } catch (ne) { console.warn('[NOTIFY] premium upgrade email failed:', ne.message); }
      } catch (e) {
        console.error('[STRIPE] DB update failed:', e.message);
        // Still return 200 — Stripe will retry if we return non-2xx
      }
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object;
    console.warn('[STRIPE] payment failed for PI', pi.id, '—', pi.last_payment_error?.message);
  }

  res.json({ received: true });
};

// GET /api/payments/status/:listing_id
const getPaymentStatus = async (req, res) => {
  const { listing_id } = req.params;
  try {
    const r = await db.query('SELECT id, is_premium, premium_expires_at FROM listings WHERE id = ', [listing_id]);
    const listing = r.rows[0];
    if (!listing) return res.status(404).json({ error: 'Not found' });
    res.json({ listing_id: listing.id, is_premium: !!listing.is_premium, expires_at: listing.premium_expires_at || null });
  } catch (e) {
    res.status(500).json({ error: 'DB error' });
  }
};

// Stripe webhook signature verification (replaces stripe.webhooks.constructEvent)
function verifyStripeWebhook(rawBody, sigHeader, secret) {
  const parts = sigHeader.split(',').reduce((acc, part) => {
    const [k, v] = part.split('=');
    acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts['t'];
  const signature = parts['v1'];
  if (!timestamp || !signature) throw new Error('Malformed stripe-signature header');

  // Reject if timestamp > 5 min old
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) throw new Error('Webhook timestamp too old');

  const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
  const payload = timestamp + '.' + body;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    throw new Error('Signature mismatch');
  }

  return JSON.parse(body);
}

module.exports = { createCheckoutSession, handleWebhook, getPaymentStatus };
