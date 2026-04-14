const User = require('../models/User');
const NativeAuth = require('../auth-native');
const auth = new NativeAuth();

const generateTokens = (user) => {
  return {
    access_token: auth.generateAccessToken(user),
    refresh_token: auth.generateRefreshToken(user)
  };
};

const register = async (req, res) => {
  try {
    const { email, password, role, name } = req.body;
    
    // Validate role
    const validRoles = ['founder', 'equipment_provider', 'service_provider', 'investor'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role', 
        message: `Role must be one of: ${validRoles.join(', ')}` 
      });
    }

    // Validate required fields
    if (!email || !password || !role || !name) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'Email, password, role, and name are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists', 
        message: 'A user with this email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await auth.hashPassword(password);
    
    // Create verification token
    const verificationToken = auth.generateVerificationToken();

    // Create user
    const user = await User.create({
      email,
      password_hash: hashedPassword,
      role,
      name,
      email_verified: false,
      verification_token: verificationToken,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Generate tokens
    const tokens = generateTokens(user);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        email_verified: user.email_verified
      },
      ...tokens,
      verification_token: verificationToken // For testing purposes
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed', 
      message: 'Could not create user account' 
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        message: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials', 
        message: 'Email or password is incorrect' 
      });
    }

    // Verify password
    const isValidPassword = await auth.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials', 
        message: 'Email or password is incorrect' 
      });
    }

    // Generate tokens
    const tokens = generateTokens(user);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        email_verified: user.email_verified
      },
      ...tokens
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed', 
      message: 'Could not authenticate user' 
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found', 
        message: 'User profile does not exist' 
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        email_verified: user.email_verified,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      error: 'Could not fetch profile', 
      message: 'Failed to retrieve user profile' 
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ 
        error: 'Missing required field', 
        message: 'Name is required' 
      });
    }

    const updatedUser = await User.update(userId, { name, updated_at: new Date() });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        name: updatedUser.name,
        email_verified: updatedUser.email_verified
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Could not update profile', 
      message: 'Failed to update user profile' 
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findByVerificationToken(token);
    if (!user) {
      return res.status(404).json({ 
        error: 'Invalid verification token', 
        message: 'Verification token is invalid or expired' 
      });
    }

    await User.update(user.id, { 
      email_verified: true, 
      verification_token: null,
      updated_at: new Date() 
    });

    res.json({ 
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ 
      error: 'Email verification failed', 
      message: 'Could not verify email address' 
    });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        error: 'Email required', 
        message: 'Email address is required' 
      });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found', 
        message: 'No user found with this email' 
      });
    }

    if (user.email_verified) {
      return res.status(400).json({ 
        error: 'Email already verified', 
        message: 'This email address is already verified' 
      });
    }

    // Generate new verification token
    const newToken = auth.generateVerificationToken();
    await User.update(user.id, { 
      verification_token: newToken,
      updated_at: new Date() 
    });

    res.json({ 
      message: 'Verification email resent',
      verification_token: newToken // For testing purposes
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ 
      error: 'Could not resend verification', 
      message: 'Failed to resend verification email' 
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ 
        error: 'Refresh token required', 
        message: 'Refresh token is required for token refresh' 
      });
    }

    // Verify refresh token
    const result = auth.verifyRefreshToken(refresh_token);
    if (!result.valid) {
      return res.status(401).json({ 
        error: 'Invalid refresh token', 
        message: result.error 
      });
    }

    // Get user from database
    const user = await User.findById(result.user.id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found', 
        message: 'User associated with refresh token does not exist' 
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    res.json({
      message: 'Token refresh successful',
      ...tokens
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ 
      error: 'Token refresh failed', 
      message: 'Could not refresh authentication tokens' 
    });
  }
};

const logout = async (req, res) => {
  try {
    // In a real implementation, you would invalidate the refresh token
    // For now, we'll just return success since we're using stateless JWT
    
    res.json({
      message: 'Logout successful',
      note: 'In a production system, refresh tokens should be invalidated server-side'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      error: 'Logout failed', 
      message: 'Could not complete logout process' 
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  verifyEmail,
  resendVerification,
  refreshToken,
  logout
};