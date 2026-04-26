const User = require('../models/User');
const NativeAuth = require('../auth-native');
const auth = new NativeAuth();

const generateTokens = (user) => ({
  access_token: auth.generateAccessToken(user),
  refresh_token: auth.generateRefreshToken(user)
});

// Generate a short unique referral code
function makeReferralCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 7; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const register = async (req, res) => {
  try {
    const { email, password, role, name, referral_code } = req.body;

    const validRoles = ['founder', 'equipment_provider', 'service_provider', 'investor'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role', message: `Role must be one of: ${validRoles.join(', ')}` });
    }
    if (!email || !password || !role || !name) {
      return res.status(400).json({ error: 'Missing required fields', message: 'Email, password, role, and name are required' });
    }

    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists', message: 'A user with this email already exists' });
    }

    // Validate referral code if provided
    let referredById = null;
    if (referral_code) {
      const referrer = await User.findByReferralCode(referral_code);
      if (!referrer) {
        return res.status(400).json({ error: 'Invalid referral code', message: 'The referral code is not valid' });
      }
      referredById = referrer.id;
    }

    const hashedPassword = await auth.hashPassword(password);
    const verificationToken = auth.generateVerificationToken();
    const myReferralCode = makeReferralCode();

    const user = await User.create({
      email,
      password_hash: hashedPassword,
      role,
      name,
      email_verified: false,
      verification_token: verificationToken,
      referral_code: myReferralCode,
      referred_by: referredById
    });

    const tokens = generateTokens(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: { id: user.id, email: user.email, role: user.role, name: user.name, email_verified: user.email_verified },
      ...tokens,
      verification_token: verificationToken,
      my_referral_code: myReferralCode
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', message: 'Could not create user account' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields', message: 'Email and password are required' });
    }
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials', message: 'Email or password is incorrect' });
    }
    const isValidPassword = await auth.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials', message: 'Email or password is incorrect' });
    }
    const tokens = generateTokens(user);
    res.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, role: user.role, name: user.name, email_verified: user.email_verified },
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: 'Could not authenticate user' });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      user: {
        id: user.id, email: user.email, role: user.role, name: user.name,
        email_verified: user.email_verified, referral_code: user.referral_code,
        created_at: user.created_at, updated_at: user.updated_at
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Could not fetch profile' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing required field', message: 'Name is required' });
    const updatedUser = await User.update(req.user.id, { name, updated_at: new Date() });
    res.json({
      message: 'Profile updated successfully',
      user: { id: updatedUser.id, email: updatedUser.email, role: updatedUser.role, name: updatedUser.name, email_verified: updatedUser.email_verified }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Could not update profile' });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findByVerificationToken(token);
    if (!user) return res.status(404).json({ error: 'Invalid verification token' });
    await User.update(user.id, { email_verified: true, verification_token: null, updated_at: new Date() });
    res.json({ message: 'Email verified successfully', user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await User.findByEmail(email);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.email_verified) return res.status(400).json({ error: 'Email already verified' });
    const newToken = auth.generateVerificationToken();
    await User.update(user.id, { verification_token: newToken, updated_at: new Date() });
    res.json({ message: 'Verification email resent', verification_token: newToken });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Could not resend verification' });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'Refresh token required' });
    const result = auth.verifyRefreshToken(refresh_token);
    if (!result.valid) return res.status(401).json({ error: 'Invalid refresh token', message: result.error });
    const user = await User.findById(result.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Token refresh successful', ...generateTokens(user) });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

const logout = async (req, res) => {
  // Blacklist the current token on logout
  const { blacklistToken } = require('../middleware/security');
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) blacklistToken(auth.slice(7));
  res.json({ message: 'Logout successful' });
};

// K-22: Password Reset — mock (kein echter Email-Service, zeigt Reset-Token im Response für dev)
const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const user = await User.findByEmail(email);
    if (!user) return res.json({ message: 'If that email exists, a reset link was sent' });
    const token = require('crypto').randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000).toISOString();
    await User.setResetToken(user.id, token, expires);
    const isDev = process.env.NODE_ENV !== 'production';
    res.json({ message: 'If that email exists, a reset link was sent', ...(isDev && { dev_token: token, dev_expires: expires }) });
  } catch (err) {
    console.error('requestPasswordReset error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
};

const confirmPasswordReset = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: 'token and password required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const user = await User.findByResetToken(token);
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });
    const authInst = new NativeAuth();
    const hash = await authInst.hashPassword(password);
    await User.updatePassword(user.id, hash);
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('confirmPasswordReset error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

module.exports = {
  requestPasswordReset,
  confirmPasswordReset, register, login, getProfile, updateProfile, verifyEmail, resendVerification, refreshToken, logout };
