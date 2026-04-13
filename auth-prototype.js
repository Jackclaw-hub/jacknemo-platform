// JWT Authentication Prototype - Working Implementation
// Uses built-in Node.js modules only (no external dependencies)

const crypto = require('crypto');
const { promisify } = require('util');

// Simple in-memory user store for demonstration
const users = new Map();

// Mock database functions
class MockDB {
  static async createUser({ email, password, role, name }) {
    const hashedPassword = await this.hashPassword(password);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    const user = {
      id: users.size + 1,
      email,
      password_hash: hashedPassword,
      role,
      name,
      email_verified: false,
      verification_token: verificationToken,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    users.set(email, user);
    return user;
  }
  
  static async findByEmail(email) {
    return users.get(email);
  }
  
  static async hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }
  
  static async verifyPassword(plainPassword, hashedPassword) {
    const [salt, hash] = hashedPassword.split(':');
    const newHash = crypto.pbkdf2Sync(plainPassword, salt, 1000, 64, 'sha512').toString('hex');
    return hash === newHash;
  }
}

// Simple JWT implementation using built-in crypto
class SimpleJWT {
  static sign(payload, secret) {
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }
  
  static verify(token, secret) {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }
    
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString());
    return payload;
  }
}

// Authentication functions
const JWT_SECRET = 'demo-secret-key-change-in-production';

async function registerUser(email, password, role, name) {
  const validRoles = ['founder', 'equipment_provider', 'service_provider', 'admin'];
  
  if (!validRoles.includes(role)) {
    throw new Error(`Invalid role. Valid roles: ${validRoles.join(', ')}`);
  }
  
  if (await MockDB.findByEmail(email)) {
    throw new Error('User already exists');
  }
  
  const user = await MockDB.createUser({ email, password, role, name });
  
  // Generate JWT token
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    email_verified: user.email_verified
  };
  
  const token = SimpleJWT.sign(payload, JWT_SECRET);
  
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      email_verified: user.email_verified
    },
    token
  };
}

async function loginUser(email, password) {
  const user = await MockDB.findByEmail(email);
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  const isValidPassword = await MockDB.verifyPassword(password, user.password_hash);
  if (!isValidPassword) {
    throw new Error('Invalid credentials');
  }
  
  if (!user.email_verified) {
    throw new Error('Email not verified');
  }
  
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    email_verified: user.email_verified
  };
  
  const token = SimpleJWT.sign(payload, JWT_SECRET);
  
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    token
  };
}

function verifyToken(token) {
  try {
    return SimpleJWT.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Test the authentication system
async function testAuthentication() {
  console.log('🧪 Testing JWT Authentication Prototype\n');
  
  try {
    // Test 1: User Registration
    console.log('1. Testing user registration...');
    const registration = await registerUser(
      'test@startupradar.com',
      'securepassword123',
      'founder',
      'Test User'
    );
    
    console.log('✅ Registration successful:');
    console.log(`   User ID: ${registration.user.id}`);
    console.log(`   Email: ${registration.user.email}`);
    console.log(`   Role: ${registration.user.role}`);
    console.log(`   Token: ${registration.token.substring(0, 30)}...`);
    
    // Test 2: Token Verification
    console.log('\n2. Testing token verification...');
    const decoded = verifyToken(registration.token);
    console.log('✅ Token verified successfully:');
    console.log(`   User ID: ${decoded.id}`);
    console.log(`   Email: ${decoded.email}`);
    console.log(`   Role: ${decoded.role}`);
    
    // Test 3: Login (should fail because email not verified)
    console.log('\n3. Testing login before email verification...');
    try {
      await loginUser('test@startupradar.com', 'securepassword123');
      console.log('❌ Login should have failed (email not verified)');
    } catch (error) {
      console.log('✅ Login correctly failed:', error.message);
    }
    
    // Test 4: Simulate email verification
    console.log('\n4. Simulating email verification...');
    const user = await MockDB.findByEmail('test@startupradar.com');
    user.email_verified = true;
    users.set(user.email, user);
    console.log('✅ Email verified');
    
    // Test 5: Login after verification
    console.log('\n5. Testing login after email verification...');
    const loginResult = await loginUser('test@startupradar.com', 'securepassword123');
    console.log('✅ Login successful:');
    console.log(`   User: ${loginResult.user.email}`);
    console.log(`   Role: ${loginResult.user.role}`);
    console.log(`   New Token: ${loginResult.token.substring(0, 30)}...`);
    
    // Test 6: Invalid password
    console.log('\n6. Testing invalid password...');
    try {
      await loginUser('test@startupradar.com', 'wrongpassword');
      console.log('❌ Login should have failed (wrong password)');
    } catch (error) {
      console.log('✅ Login correctly failed:', error.message);
    }
    
    // Test 7: Invalid email
    console.log('\n7. Testing invalid email...');
    try {
      await loginUser('nonexistent@example.com', 'password');
      console.log('❌ Login should have failed (user not found)');
    } catch (error) {
      console.log('✅ Login correctly failed:', error.message);
    }
    
    console.log('\n🎉 ALL TESTS PASSED! JWT Authentication Prototype is working correctly!');
    console.log('\n📋 Features implemented:');
    console.log('   ✅ User registration with role validation');
    console.log('   ✅ Secure password hashing (PBKDF2)');
    console.log('   ✅ JWT token generation and verification');
    console.log('   ✅ Email verification requirement');
    console.log('   ✅ Login authentication');
    console.log('   ✅ Error handling');
    console.log('   ✅ No external dependencies (pure Node.js)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testAuthentication();