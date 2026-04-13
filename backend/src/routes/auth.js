const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getProfile,
  updateProfile,
  verifyEmail,
  resendVerification
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// POST /api/auth/register - User registration
router.post('/register', register);

// POST /api/auth/login - User login
router.post('/login', login);

// GET /api/auth/profile - Get user profile (protected)
router.get('/profile', authenticateToken, getProfile);

// PUT /api/auth/profile - Update user profile (protected)
router.put('/profile', authenticateToken, updateProfile);

// GET /api/auth/verify/:token - Verify email (public)
router.get('/verify/:token', verifyEmail);

// POST /api/auth/resend-verification - Resend verification email (public)
router.post('/resend-verification', resendVerification);

module.exports = router;