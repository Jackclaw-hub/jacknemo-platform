const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

// Helper to generate a TOTP secret
const generateSecret = () => {
  return speakeasy.generateSecret({
    length: 20,
    name: 'JackNemoPlatform',
  });
};

// Helper to verify a TOTP token
const verifyToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret: secret,
    encoding: 'base32',
    token: token,
    window: 1, // Allow 1-time step difference for clock drift
  });
};


function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );
}

exports.register = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'password must be at least 8 characters' });
  try {
    const hash = await bcrypt.hash(password, 12);
    const result = await db.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email, role, created_at',
      [email.toLowerCase().trim(), hash]
    );
    const user = result.rows[0];
    return res.status(201).json({ user, token: signToken(user) });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already registered' });
    return res.status(500).json({ error: 'Registration failed' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  try {
    const result = await db.query(
      'SELECT id, email, password, role, two_factor_enabled FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.two_factor_enabled) {
      // If 2FA is enabled, require TOTP token
      return res.json({ requiresTwoFactor: true, userId: user.id });
    }

    return res.json({ token: signToken(user) });
  } catch {
    return res.status(500).json({ error: 'Login failed' });
  }
};

exports.verify2fa = async (req, res) => {
  const userId = req.user.id;
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'TOTP token is required.' });
  }

  try {
    const userResult = await db.query(
      'SELECT two_factor_temp_secret, two_factor_enabled FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (user.two_factor_enabled) {
      return res.status(400).json({ error: 'Two-factor authentication is already enabled.' });
    }
    if (!user.two_factor_temp_secret) {
      return res.status(400).json({ error: '2FA setup not initiated or expired.' });
    }

    const verified = verifyToken(user.two_factor_temp_secret, token);

    if (verified) {
      // Move temp secret to permanent and enable 2FA
      await db.query(
        'UPDATE users SET two_factor_secret = $1, two_factor_temp_secret = NULL, two_factor_enabled = TRUE, updated_at = NOW() WHERE id = $2',
        [user.two_factor_temp_secret, userId]
      );
      return res.json({ message: 'Two-factor authentication enabled successfully.' });
    } else {
      return res.status(401).json({ error: 'Invalid TOTP token.' });
    }
  } catch (err) {
    console.error('2FA verification error:', err);
    res.status(500).json({ error: 'Failed to verify 2FA.' });
  }
};

exports.disable2fa = async (req, res) => {
  const userId = req.user.id;
  const { password, token } = req.body;

  if (!password || !token) {
    return res.status(400).json({ error: 'Password and TOTP token are required to disable 2FA.' });
  }

  try {
    const userResult = await db.query(
      'SELECT password, two_factor_secret, two_factor_enabled FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    if (!user.two_factor_enabled) {
      return res.status(400).json({ error: 'Two-factor authentication is not enabled.' });
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid password.' });
    }

    // Verify TOTP token
    const verified = verifyToken(user.two_factor_secret, token);

    if (verified) {
      await db.query(
        'UPDATE users SET two_factor_secret = NULL, two_factor_enabled = FALSE, two_factor_temp_secret = NULL, updated_at = NOW() WHERE id = $2',
        [userId]
      );
      return res.json({ message: 'Two-factor authentication disabled successfully.' });
    } else {
      return res.status(401).json({ error: 'Invalid TOTP token.' });
    }
  } catch (err) {
    console.error('2FA disable error:', err);
    res.status(500).json({ error: 'Failed to disable 2FA.' });
  }
};

exports.login2fa = async (req, res) => {
  const { email, password, token } = req.body;

  if (!email || !password || !token) {
    return res.status(400).json({ error: 'Email, password, and TOTP token are required.' });
  }

  try {
    const userResult = await db.query(
      'SELECT id, email, password, role, two_factor_enabled, two_factor_secret FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }
    if (!user.two_factor_enabled) {
      return res.status(400).json({ error: 'Two-factor authentication is not enabled for this account.' });
    }

    // Verify password first
    const passwordValid = await bcrypt.compare(password, user.password);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Verify TOTP token
    const verified = verifyToken(user.two_factor_secret, token);

    if (verified) {
      return res.json({ token: signToken(user) });
    } else {
      return res.status(401).json({ error: 'Invalid TOTP token.' });
    }
  } catch (err) {
    console.error('2FA login error:', err);
    res.status(500).json({ error: '2FA login failed.' });
  }
};




exports.setup2fa = async (req, res) => {
  const userId = req.user.id; // From authenticateToken middleware

  try {
    const userResult = await db.query('SELECT two_factor_enabled FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    if (user.two_factor_enabled) {
      return res.status(400).json({ error: 'Two-factor authentication is already enabled.' });
    }

    const secret = generateSecret();
    // Store the temporary secret in the database
    await db.query(
      'UPDATE users SET two_factor_temp_secret = $1, updated_at = NOW() WHERE id = $2',
      [secret.base32, userId]
    );

    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) {
        console.error('QR Code generation error:', err);
        return res.status(500).json({ error: 'Failed to generate QR code.' });
      }
      res.json({ secret: secret.base32, qrCodeUrl: data_url });
    });
  } catch (err) {
    console.error('2FA setup error:', err);
    res.status(500).json({ error: 'Failed to set up 2FA.' });
  }
};
