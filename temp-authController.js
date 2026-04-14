const User = require('../models/User');
const NativeAuth = require('../auth-native');
const auth = new NativeAuth();

const generateToken = (user) => {
  return auth.generateToken(user);
};

const register = async (req, res) => {
  try {
    const { email, password, role, name } = req.body;
    
    // Validate role
    const validRoles = ['founder', 'equipment_provider', 'service_provider', 'investor', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        error: 'Invalid role', 
        validRoles 
      });
    }

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists with this email' 
      });
    }

    // Create user
    const user = await User.create({ email, password, role, name });
    
    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        email_verified: user.email_verified
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      message: error.message 
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Verify password
    const isValidPassword = await auth.verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        email_verified: user.email_verified
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: error.message 
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.status(200).json({
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
      error: 'Failed to get profile',
      message: error.message 
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = {};

    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;

    const user = await User.updateProfile(req.user.id, updates);
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        email_verified: user.email_verified,
        updated_at: user.updated_at
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      error: 'Failed to update profile',
      message: error.message 
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findByVerificationToken(token);
    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired verification token' 
      });
    }

    const verifiedUser = await User.verifyEmail(user.id);
    
    res.status(200).json({
      message: 'Email verified successfully',
      user: {
        id: verifiedUser.id,
        email: verifiedUser.email,
        role: verifiedUser.role,
        name: verifiedUser.name,
        email_verified: verifiedUser.email_verified
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ 
      error: 'Email verification failed',
      message: error.message 
    });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    
    const user = await User.resendVerification(email);
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.status(200).json({
      message: 'Verification email sent',
      user: {
        id: user.id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ 
      error: 'Failed to resend verification',
      message: error.message 
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  verifyEmail,
  resendVerification
};