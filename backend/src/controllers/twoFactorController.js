// K-176: Two-Factor Authentication (TOTP)
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const User = require('../models/User');
const NativeAuth = require('../auth-native');

// POST /api/auth/2fa/setup
const setup2fa = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByIdWithTotp(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.totp_enabled) return res.status(400).json({ error: '2FA is already enabled' });

    const secret = speakeasy.generateSecret({
      name: `JackNemo:${user.email}`,
      issuer: 'JackNemo',
      length: 32,
    });

    await User.setTotpSecret(userId, secret.base32);
    const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      otpauth_url: secret.otpauth_url,
      qr_code: qrCodeDataUrl,
      message: 'Scan the QR code with your authenticator app, then POST /2fa/verify with the token',
    });
  } catch (err) {
    console.error('2FA setup error:', err);
    res.status(500).json({ error: '2FA setup failed' });
  }
};

// POST /api/auth/2fa/verify — confirm TOTP token and enable 2FA
const verify2fa = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token is required' });

    const user = await User.findByIdWithTotp(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.totp_secret) return res.status(400).json({ error: 'Run /2fa/setup first' });
    if (user.totp_enabled) return res.status(400).json({ error: '2FA is already enabled' });

    const valid = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: token.toString().replace(/\s/g, ''),
      window: 1,
    });
    if (!valid) return res.status(400).json({ error: 'Invalid token' });

    const backupCodes = Array.from({ length: 8 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
    await User.enableTotp(userId, backupCodes);

    res.json({
      message: '2FA enabled successfully',
      backup_codes: backupCodes,
      warning: 'Save these backup codes — they will not be shown again',
    });
  } catch (err) {
    console.error('2FA verify error:', err);
    res.status(500).json({ error: '2FA verify failed' });
  }
};

// POST /api/auth/2fa/disable
const disable2fa = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token is required' });

    const user = await User.findByIdWithTotp(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.totp_enabled) return res.status(400).json({ error: '2FA is not enabled' });

    const valid = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: token.toString().replace(/\s/g, ''),
      window: 1,
    });
    if (!valid) return res.status(400).json({ error: 'Invalid token' });

    await User.disableTotp(userId);
    res.json({ message: '2FA disabled successfully' });
  } catch (err) {
    console.error('2FA disable error:', err);
    res.status(500).json({ error: 'Disable failed' });
  }
};

// POST /api/auth/2fa/validate-login — second step after login challenge
const validate2faLogin = async (req, res) => {
  try {
    const { temp_token, token } = req.body;
    if (!temp_token || !token) return res.status(400).json({ error: 'temp_token and token are required' });

    const auth = new NativeAuth();
    const result = auth.verifyToken(temp_token);
    if (!result.valid) return res.status(401).json({ error: 'Invalid or expired challenge token' });
    if (result.user.type !== '2fa_challenge') return res.status(401).json({ error: 'Invalid token type' });

    const user = await User.findByIdWithTotp(result.user.id);
    if (!user || !user.totp_enabled) return res.status(401).json({ error: 'User or 2FA not found' });

    const tokenStr = token.toString().replace(/\s/g, '');

    const valid = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: tokenStr,
      window: 1,
    });

    if (!valid) {
      const usedBackup = await User.consumeBackupCode(user.id, tokenStr.toUpperCase());
      if (!usedBackup) return res.status(400).json({ error: 'Invalid token or backup code' });
    }

    const tokens = {
      access_token: auth.generateAccessToken(user),
      refresh_token: auth.generateRefreshToken(user),
    };

    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, role: user.role, name: user.name },
      ...tokens,
    });
  } catch (err) {
    console.error('2FA validate-login error:', err);
    res.status(500).json({ error: '2FA validation failed' });
  }
};

module.exports = { setup2fa, verify2fa, disable2fa, validate2faLogin };
