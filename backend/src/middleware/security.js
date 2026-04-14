// Security headers middleware
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // CSP header for production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
    );
  }
  
  next();
};

// Simple rate limiting middleware (basic implementation without express-rate-limit)
const createRateLimiter = (windowMs, max) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const record = requests.get(ip);
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }
    
    if (record.count >= max) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Please try again later'
      });
    }
    
    record.count++;
    next();
  };
};

// Rate limiting for auth endpoints
const authRateLimiter = createRateLimiter(15 * 60 * 1000, 5);

// Rate limiting for general API endpoints
const apiRateLimiter = createRateLimiter(60 * 1000, 100);

// Rate limiting for registration endpoint
const registrationRateLimiter = createRateLimiter(60 * 60 * 1000, 3);

module.exports = {
  securityHeaders,
  authRateLimiter,
  apiRateLimiter,
  registrationRateLimiter
};