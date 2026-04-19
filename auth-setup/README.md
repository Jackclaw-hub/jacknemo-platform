# Startup Radar Authentication Module

Node.js authentication module using bcrypt and JWT for the Startup Radar platform.

## Features

- ✅ Password hashing with bcrypt (salt rounds: 12)
- ✅ JWT token generation and verification
- ✅ Role-based access control middleware
- ✅ Password reset token generation
- ✅ Express.js middleware integration
- ✅ Comprehensive test suite

## Installation

```bash
npm install
```

## Usage

### Basic Authentication

```javascript
const AuthService = require('./src/auth');

const authService = new AuthService(process.env.JWT_SECRET);

// Hash password
const hash = await authService.hashPassword('securepassword123');

// Compare password
const match = await authService.comparePassword('securepassword123', hash);

// Generate JWT token
const user = { id: 1, email: 'test@example.com', role: 'user', full_name: 'Test User' };
const token = authService.generateToken(user, 3600); // 1 hour expiration

// Verify token
const decoded = authService.verifyToken(token);
```

### Express Middleware

```javascript
const AuthMiddleware = require('./src/middleware/auth');
const authMiddleware = new AuthMiddleware(process.env.JWT_SECRET);

// Require authentication
app.get('/protected', authMiddleware.requireAuth, (req, res) => {
    res.json({ user: req.user });
});

// Require specific role
app.get('/admin', authMiddleware.requireRole('admin'), (req, res) => {
    res.json({ message: 'Admin access granted' });
});

// Require any of multiple roles
app.get('/management', authMiddleware.requireAnyRole(['admin', 'manager']), (req, res) => {
    res.json({ message: 'Management access granted' });
});
```

## Environment Variables

```bash
JWT_SECRET=your-super-secret-key-here
SALT_ROUNDS=12 # Optional, default: 12
```

## Testing

```bash
npm test
```

## Security Features

- ✅ Password hashing with bcrypt (industry standard)
- ✅ JWT tokens with expiration
- ✅ Role-based access control
- ✅ Token extraction from Authorization header
- ✅ Secure password reset tokens
- ✅ Input validation ready

## Integration with Database

This module is designed to work with the PostgreSQL user schema:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    email_verification_token VARCHAR(255),
    reset_password_token VARCHAR(255),
    reset_password_expires TIMESTAMPTZ
);
```

## Error Codes

- `AUTH_REQUIRED` - Authentication required
- `INVALID_TOKEN` - Invalid or expired token
- `INSUFFICIENT_PERMISSIONS` - User lacks required role

## Next Steps

1. ✅ Complete authentication core module
2. Integrate with Express.js backend
3. Add database integration (PostgreSQL)
4. Implement registration endpoint
5. Implement login endpoint
6. Implement password reset flow
7. Add email verification
8. Add rate limiting
9. Add comprehensive logging

## License

MIT