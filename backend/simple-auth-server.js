const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Mock user storage (in-memory for testing)
const users = [];

// Middleware
app.use(cors());
app.use(express.json());

// Simple password hashing using Node.js crypto
const crypto = require('crypto');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password, hashedPassword) {
  return hashPassword(password) === hashedPassword;
}

// Simple JWT-like token generation
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    timestamp: Date.now()
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function verifyToken(token) {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    return payload;
  } catch (error) {
    return null;
  }
}

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  req.user = user;
  next();
}

// Routes
app.post('/api/auth/register', async (req, res) => {
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
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists', 
        message: 'A user with this email already exists' 
      });
    }

    // Hash password
    const hashedPassword = hashPassword(password);
    
    // Create user
    const user = {
      id: users.length + 1,
      email,
      password_hash: hashedPassword,
      role,
      name,
      email_verified: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    users.push(user);

    // Generate token
    const token = generateToken(user);

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
      message: 'Could not create user account' 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
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
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials', 
        message: 'Email or password is incorrect' 
      });
    }

    // Verify password
    const isValidPassword = verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid credentials', 
        message: 'Email or password is incorrect' 
      });
    }

    // Generate token
    const token = generateToken(user);

    res.json({
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
      message: 'Could not authenticate user' 
    });
  }
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  
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
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Simple Auth API is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple Auth Server running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/api/health`);
  console.log(`📍 Register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`📍 Login: POST http://localhost:${PORT}/api/auth/login`);
});