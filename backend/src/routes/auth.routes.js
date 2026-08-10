const { Router } = require('express');
const { register, login } = require('../controllers/auth.controller');
const { setup2fa, verify2fa, disable2fa, validate2faLogin } = require('../controllers/twoFactorController');
const { authenticateToken } = require('../middleware/auth');

const router = Router();
router.post('/auth/register', register);
router.post('/auth/login', login);

// K-176: 2FA TOTP endpoints
router.post('/auth/2fa/setup', authenticateToken, setup2fa);
router.post('/auth/2fa/verify', authenticateToken, verify2fa);
router.post('/auth/2fa/disable', authenticateToken, disable2fa);
router.post('/auth/2fa/validate-login', validate2faLogin); // This does not require authenticateToken, it uses temp_token

module.exports = router;
