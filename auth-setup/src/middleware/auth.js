const AuthService = require('./auth');

class AuthMiddleware {
    constructor(secretKey) {
        this.authService = new AuthService(secretKey);
    }

    /**
     * Middleware to require authentication
     */
    requireAuth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            const token = this.authService.extractTokenFromHeader(authHeader);
            
            if (!token) {
                return res.status(401).json({ 
                    error: 'Authentication required',
                    code: 'AUTH_REQUIRED'
                });
            }

            const decoded = this.authService.verifyToken(token);
            req.user = decoded;
            next();
        } catch (error) {
            return res.status(401).json({ 
                error: 'Invalid or expired token',
                code: 'INVALID_TOKEN'
            });
        }
    }

    /**
     * Middleware to require specific role
     */
    requireRole(role) {
        return (req, res, next) => {
            this.requireAuth(req, res, () => {
                if (req.user.role !== role) {
                    return res.status(403).json({ 
                        error: 'Insufficient permissions',
                        code: 'INSUFFICIENT_PERMISSIONS'
                    });
                }
                next();
            });
        };
    }

    /**
     * Middleware to require one of multiple roles
     */
    requireAnyRole(roles) {
        return (req, res, next) => {
            this.requireAuth(req, res, () => {
                if (!roles.includes(req.user.role)) {
                    return res.status(403).json({ 
                        error: 'Insufficient permissions',
                        code: 'INSUFFICIENT_PERMISSIONS'
                    });
                }
                next();
            });
        };
    }

    /**
     * Optional authentication - sets req.user if token is valid
     */
    optionalAuth(req, res, next) {
        const authHeader = req.headers.authorization;
        const token = this.authService.extractTokenFromHeader(authHeader);
        
        if (token) {
            try {
                const decoded = this.authService.verifyToken(token);
                req.user = decoded;
            } catch (error) {
                // Token is invalid, but we continue without user
                req.user = null;
            }
        } else {
            req.user = null;
        }
        
        next();
    }
}

module.exports = AuthMiddleware;