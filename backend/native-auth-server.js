const http = require('http');

// Mock user storage (in-memory for testing)
const users = [];

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

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Parse JSON body
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const parsedBody = body ? JSON.parse(body) : {};
      
      // Route handling
      if (req.url === '/api/auth/register' && req.method === 'POST') {
        handleRegister(req, res, parsedBody);
      } else if (req.url === '/api/auth/login' && req.method === 'POST') {
        handleLogin(req, res, parsedBody);
      } else if (req.url === '/api/auth/profile' && req.method === 'GET') {
        handleProfile(req, res);
      } else if (req.url === '/api/health' && req.method === 'GET') {
        handleHealth(req, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route not found' }));
      }
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error', message: error.message }));
    }
  });
});

function handleRegister(req, res, body) {
  try {
    const { email, password, role, name } = body;
    
    // Validate role
    const validRoles = ['founder', 'equipment_provider', 'service_provider', 'investor'];
    if (!validRoles.includes(role)) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Invalid role', 
        message: `Role must be one of: ${validRoles.join(', ')}` 
      }));
      return;
    }

    // Validate required fields
    if (!email || !password || !role || !name) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Missing required fields', 
        message: 'Email, password, role, and name are required' 
      }));
      return;
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'User already exists', 
        message: 'A user with this email already exists' 
      }));
      return;
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

    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        email_verified: user.email_verified
      },
      token
    }));

  } catch (error) {
    console.error('Registration error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Registration failed', 
      message: 'Could not create user account' 
    }));
  }
}

function handleLogin(req, res, body) {
  try {
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Missing required fields', 
        message: 'Email and password are required' 
      }));
      return;
    }

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Invalid credentials', 
        message: 'Email or password is incorrect' 
      }));
      return;
    }

    // Verify password
    const isValidPassword = verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Invalid credentials', 
        message: 'Email or password is incorrect' 
      }));
      return;
    }

    // Generate token
    const token = generateToken(user);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        email_verified: user.email_verified
      },
      token
    }));

  } catch (error) {
    console.error('Login error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Login failed', 
      message: 'Could not authenticate user' 
    }));
  }
}

function handleProfile(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Access token required' }));
      return;
    }

    const userData = verifyToken(token);
    if (!userData) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid token' }));
      return;
    }

    const user = users.find(u => u.id === userData.id);
    if (!user) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'User not found', 
        message: 'User profile does not exist' 
      }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        email_verified: user.email_verified,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    }));

  } catch (error) {
    console.error('Profile error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Could not fetch profile', 
      message: 'Failed to retrieve user profile' 
    }));
  }
}

function handleHealth(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    status: 'OK', 
    message: 'Native Auth API is running',
    timestamp: new Date().toISOString(),
    users_count: users.length
  }));
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Native Auth Server running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/api/health`);
  console.log(`📍 Register: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`📍 Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`📍 Profile: GET http://localhost:${PORT}/api/auth/profile (with Authorization: Bearer <token>)`);
});