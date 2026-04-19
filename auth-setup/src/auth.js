const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class AuthService {
    constructor(secretKey, saltRounds = 12) {
        this.secretKey = secretKey || process.env.JWT_SECRET || 'fallback-secret-key';
        this.saltRounds = saltRounds;
    }

    /**
     * Hash a password using bcrypt
     * @param {string} password - Plain text password
     * @returns {Promise<string>} Hashed password
     */
    async hashPassword(password) {
        try {
            return await bcrypt.hash(password, this.saltRounds);
        } catch (error) {
            throw new Error(`Password hashing failed: ${error.message}`);
        }
    }

    /**
     * Compare plain text password with hashed password
     * @param {string} password - Plain text password
     * @param {string} hash - Hashed password
     * @returns {Promise<boolean>} True if passwords match
     */
    async comparePassword(password, hash) {
        try {
            return await bcrypt.compare(password, hash);
        } catch (error) {
            throw new Error(`Password comparison failed: ${error.message}`);
        }
    }

    /**
     * Generate JWT token for user
     * @param {object} user - User object
     * @param {number} expiresIn - Token expiration in seconds
     * @returns {string} JWT token
     */
    generateToken(user, expiresIn = 3600) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
            name: user.full_name
        };

        return jwt.sign(payload, this.secretKey, { expiresIn });
    }

    /**
     * Verify JWT token
     * @param {string} token - JWT token
     * @returns {object} Decoded token payload
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, this.secretKey);
        } catch (error) {
            throw new Error(`Token verification failed: ${error.message}`);
        }
    }

    /**
     * Extract token from Authorization header
     * @param {string} authHeader - Authorization header
     * @returns {string|null} Token or null
     */
    extractTokenFromHeader(authHeader) {
        if (!authHeader) return null;
        
        const parts = authHeader.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
            return parts[1];
        }
        
        return null;
    }

    /**
     * Generate password reset token
     * @param {string} email - User email
     * @param {number} expiresIn - Expiration in seconds (default: 1 hour)
     * @returns {string} Reset token
     */
    generateResetToken(email, expiresIn = 3600) {
        return jwt.sign({ email, purpose: 'reset' }, this.secretKey, { expiresIn });
    }

    /**
     * Verify password reset token
     * @param {string} token - Reset token
     * @returns {object} Decoded token
     */
    verifyResetToken(token) {
        try {
            const decoded = jwt.verify(token, this.secretKey);
            if (decoded.purpose !== 'reset') {
                throw new Error('Invalid token purpose');
            }
            return decoded;
        } catch (error) {
            throw new Error(`Reset token verification failed: ${error.message}`);
        }
    }
}

module.exports = AuthService;