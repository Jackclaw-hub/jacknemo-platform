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
  confirmPasswordReset,
  changePassword,
  setup2fa,
  verify2fa,
  disable2fa,
  login2fa
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

// POST /api/auth/change-password - Change password (K-80, authenticated)
router.post('/change-password', authenticateToken, changePassword);

// POST /api/auth/login/2fa - 2FA login
router.post('/login/2fa', authRateLimiter, login2fa);

// POST /api/auth/2fa/setup - Setup 2FA (protected)
router.post('/2fa/setup', authenticateToken, setup2fa);

// POST /api/auth/2fa/verify - Verify 2FA setup (protected)
router.post('/2fa/verify', authenticateToken, verify2fa);

// POST /api/auth/2fa/disable - Disable 2FA (protected)
router.post('/2fa/disable', authenticateToken, disable2fa);

module.exports = router;