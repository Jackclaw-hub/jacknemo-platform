// Zero-dependency authentication implementation using native Node.js crypto
const crypto = require('crypto');

class NativeAuth {
  constructor(jwtSecret = 'fallback-secret-key', jwtExpire = '24h') {
    this.jwtSecret = jwtSecret;
    this.jwtExpire = jwtExpire;
  }

  // Secure password hashing using PBKDF2 (OWASP recommended)
  async hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const iterations = 100000;
    const keylen = 64;
    const digest = 'sha512';
    
    const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest).toString('hex');
    
    // Store as: algorithm$iterations$salt$hash
    return `pbkdf2$${iterations}$${salt}$${hash}`;
  }

  async verifyPassword(plainPassword, storedHash) {
    try {
      const [algorithm, iterations, salt, hash] = storedHash.split('$');
      
      if (algorithm !== 'pbkdf2') {
        // Fallback for legacy SHA256 hashes during migration
        const legacyHash = crypto.createHash('sha256').update(plainPassword + this.jwtSecret).digest('hex');
        return legacyHash === storedHash;
      }
      
      const derivedHash = crypto.pbkdf2Sync(
        plainPassword, 
        salt, 
        parseInt(iterations), 
        64, 
        'sha512'
      ).toString('hex');
      
      return derivedHash === hash;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  // JWT-like access token generation (short-lived)
  generateAccessToken(user) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified,
      type: 'access',
      exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
    })).toString('base64');
    
    const signature = crypto
      .createHmac('sha256', this.jwtSecret)
      .update(`${header}.${payload}`)
      .digest('base64');

    return `${header}.${payload}.${signature}`;
  }

  // Refresh token generation (long-lived)
  generateRefreshToken(user) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({
      id: user.id,
      type: 'refresh',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    })).toString('base64');
    
    const signature = crypto
      .createHmac('sha256', this.jwtSecret + '_refresh') // Different secret for refresh tokens
      .update(`${header}.${payload}`)
      .digest('base64');

    return `${header}.${payload}.${signature}`;
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      const [header, payload, signature] = token.split('.');
      
      const expectedSignature = crypto
        .createHmac('sha256', this.jwtSecret + '_refresh')
        .update(`${header}.${payload}`)
        .digest('base64');

      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid signature' };
      }

      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
      
      // Check expiration
      if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false, error: 'Token expired' };
      }

      // Check token type
      if (decodedPayload.type !== 'refresh') {
        return { valid: false, error: 'Invalid token type' };
      }

      return { valid: true, user: { id: decodedPayload.id } };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  verifyToken(token) {
    try {
      const [header, payload, signature] = token.split('.');
      
      const expectedSignature = crypto
        .createHmac('sha256', this.jwtSecret)
        .update(`${header}.${payload}`)
        .digest('base64');

      if (signature !== expectedSignature) {
        return { valid: false, error: 'Invalid signature' };
      }

      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
      
      // Check expiration
      if (decodedPayload.exp && decodedPayload.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false, error: 'Token expired' };
      }

      return { valid: true, user: decodedPayload };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
  }
}

module.exports = NativeAuth;