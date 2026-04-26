const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  verifyEmail,
  resendVerification,
  refreshToken,
  logout,
  requestPasswordReset,
  confirmPasswordReset
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { authRateLimiter, registrationRateLimiter, resetRateLimiter, validateRegistration, validateLogin } = require('../middleware/security');

// POST /api/auth/register - User registration
router.post('/register', registrationRateLimiter, validateRegistration, register);

// POST /api/auth/login - User login
router.post('/login', authRateLimiter, validateLogin, login);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', refreshToken);

// POST /api/auth/logout - User logout
router.post('/logout', authenticateToken, logout);

// GET /api/auth/profile - Get user profile (protected)
router.get('/profile', authenticateToken, getProfile);

// PUT /api/auth/profile - Update user profile (protected)
router.put('/profile', authenticateToken, updateProfile);

// GET /api/auth/verify/:token - Verify email (public)
router.get('/verify/:token', verifyEmail);

// POST /api/auth/resend-verification - Resend verification email (public)
router.post('/resend-verification', resendVerification);

// POST /api/auth/reset-password - Request reset (K-22)
router.post('/reset-password', resetRateLimiter, requestPasswordReset);

// POST /api/auth/reset-password/confirm - Confirm reset (K-22)
router.post('/reset-password/confirm', confirmPasswordReset);

module.exports = router;