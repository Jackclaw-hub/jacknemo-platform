// K-27: API Security Hardening — enhanced security middleware
const crypto = require('crypto');

// ── Security Headers ───────────────────────────────────────────────────────
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('X-Request-ID', crypto.randomBytes(8).toString('hex'));
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    );
  }
  next();
};

// ── Rate Limiting ──────────────────────────────────────────────────────────
const isProd = process.env.NODE_ENV === 'production';

const createRateLimiter = (windowMs, max, message = 'Too many requests') => {
  const store = new Map();
  // Cleanup stale entries every 10 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store) { if (now > v.resetTime) store.delete(k); }
  }, 600000).unref();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    if (!isProd && (ip === '::1' || ip === '127.0.0.1' || ip.includes('::ffff:127.'))) return next();
    const now = Date.now();
    const record = store.get(ip) || { count: 0, resetTime: now + windowMs };
    if (now > record.resetTime) { record.count = 0; record.resetTime = now + windowMs; }
    record.count++;
    store.set(ip, record);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    if (record.count > max) {
      return res.status(429).json({ error: 'Too many requests', message, retryAfter: Math.ceil((record.resetTime - now) / 1000) });
    }
    next();
  };
};

const authRateLimiter         = createRateLimiter(15 * 60 * 1000, isProd ? 5  : 100, 'Too many login attempts');
const apiRateLimiter          = createRateLimiter(60 * 1000,       isProd ? 100: 1000);
const registrationRateLimiter = createRateLimiter(60 * 60 * 1000,  isProd ? 3  : 50,  'Too many registrations');
const resetRateLimiter        = createRateLimiter(60 * 60 * 1000,  isProd ? 3  : 20,  'Too many reset attempts');

// ── Input Sanitization ─────────────────────────────────────────────────────
const HTML_RE = /<[^>]*>/g;
const NULL_BYTE_RE = /\0/g;
const CRLF_RE = /[\r\n]/g;

function sanitizeValue(v) {
  if (typeof v !== 'string') return v;
  return v.replace(HTML_RE, '').replace(NULL_BYTE_RE, '').trim();
}

function sanitizeObject(obj, depth = 0) {
  if (depth > 5 || obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.slice(0, 50).map(v => sanitizeObject(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    // Strip prototype pollution keys
    if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
    // Strip NoSQL injection operators ($ keys)
    if (k.startsWith('$')) continue;
    out[k] = typeof v === 'object' ? sanitizeObject(v, depth + 1) : sanitizeValue(v);
  }
  return out;
}

const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  // Sanitize query params
  if (req.query) {
    for (const [k, v] of Object.entries(req.query)) {
      if (typeof v === 'string') req.query[k] = v.replace(HTML_RE, '').replace(NULL_BYTE_RE, '').trim().slice(0, 500);
    }
  }
  next();
};

// ── Input Validators ───────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const SAFE_STRING_RE = /^[\w\s.,!?@#\-'&()+:/éàüöäßÉÀÜÖÄ]*$/;

const validateRegistration = (req, res, next) => {
  const { email, password, name } = req.body;
  const errors = [];
  if (!email || !EMAIL_RE.test(email)) errors.push('Valid email required');
  if (!password || password.length < 8) errors.push('Password must be at least 8 characters');
  if (password && password.length > 128) errors.push('Password too long');
  if (!name || name.trim().length < 2) errors.push('Name must be at least 2 characters');
  if (name && name.length > 100) errors.push('Name too long');
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Invalid email format' });
  if (password.length > 256) return res.status(400).json({ error: 'Invalid credentials' }); // Don't say too long
  next();
};

const validateListing = (req, res, next) => {
  const { title, description } = req.body;
  if (title && title.length > 200) return res.status(400).json({ error: 'Title too long (max 200)' });
  if (description && description.length > 5000) return res.status(400).json({ error: 'Description too long (max 5000)' });
  next();
};

// ── JWT Token Blacklist (in-memory, resets on restart — sufficient for mock mode) ──
const tokenBlacklist = new Set();
// Cleanup blacklist hourly
setInterval(() => {
  // Can't check expiry without decoding — just cap the size
  if (tokenBlacklist.size > 10000) tokenBlacklist.clear();
}, 3600000).unref();

const blacklistToken = (token) => tokenBlacklist.add(token);

const checkBlacklist = (req, res, next) => {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    const token = auth.slice(7);
    if (tokenBlacklist.has(token)) {
      return res.status(401).json({ error: 'Token revoked', message: 'Please log in again' });
    }
  }
  next();
};

module.exports = {
  securityHeaders,
  sanitizeBody,
  checkBlacklist,
  blacklistToken,
  authRateLimiter,
  apiRateLimiter,
  registrationRateLimiter,
  resetRateLimiter,
  validateRegistration,
  validateLogin,
  validateListing,
};
