// K-32: Per-endpoint rate limiting
// In test mode, all limiters are no-ops to avoid test interference
const noop = (req, res, next) => next();

if (process.env.NODE_ENV === 'test') {
  module.exports = { authLimiter: noop, listingsWriteLimiter: noop, messageLimiter: noop, generalLimiter: noop, twoFaLimiter: noop };
} else {
  const rateLimit = require('express-rate-limit');

  const windowMs15 = 15 * 60 * 1000; // 15 min
  const windowMs1h  = 60 * 60 * 1000; // 1 hour

  const baseOpts = {
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.'
    })
  };

  // Auth: 5 attempts per 15 min per IP (brute-force protection)
  const authLimiter = rateLimit({ ...baseOpts, windowMs: windowMs15, max: 5 });

  // Listings create/update: 20 per hour per IP
  const listingsWriteLimiter = rateLimit({ ...baseOpts, windowMs: windowMs1h, max: 20 });

  // Messages/contact: 30 per hour per IP
  const messageLimiter = rateLimit({ ...baseOpts, windowMs: windowMs1h, max: 30 });

  // General API catch-all: 200 per 15 min per IP
  const generalLimiter = rateLimit({ ...baseOpts, windowMs: windowMs15, max: 200 });

  // K-181: 2FA brute-force protection — 5 attempts per 15min per IP
  const twoFaLimiter = rateLimit({ ...baseOpts, windowMs: windowMs15, max: 5,
    message: { error: 'Too many 2FA attempts', message: 'Try again in 15 minutes' } });

  module.exports = { authLimiter, listingsWriteLimiter, messageLimiter, generalLimiter, twoFaLimiter };
}
