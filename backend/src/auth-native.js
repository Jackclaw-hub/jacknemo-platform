// Zero-dependency authentication implementation using native Node.js crypto
const crypto = require('crypto');

class NativeAuth {
  constructor(jwtSecret = 'fallback-secret-key', jwtExpire = '24h') {
    this.jwtSecret = jwtSecret;
    this.jwtExpire = jwtExpire;
  }

  // Simple password hashing using SHA256 (for development only)
  async hashPassword(password) {
    return crypto.createHash('sha256').update(password + this.jwtSecret).digest('hex');
  }

  async verifyPassword(plainPassword, hashedPassword) {
    const hashed = await this.hashPassword(plainPassword);
    return hashed === hashedPassword;
  }

  // Simple JWT-like token generation
  generateToken(user) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    })).toString('base64');
    
    const signature = crypto
      .createHmac('sha256', this.jwtSecret)
      .update(`${header}.${payload}`)
      .digest('base64');

    return `${header}.${payload}.${signature}`;
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