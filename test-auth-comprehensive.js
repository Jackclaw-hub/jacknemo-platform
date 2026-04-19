#!/usr/bin/env node

/**
 * Comprehensive Authentication API Test Suite
 * Tests all auth endpoints with proper assertions
 */

const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:3001/api/auth';

// Test user data
const testUser = {
  email: `testuser_${Date.now()}@startupradar.com`,
  password: 'SecurePassword123!',
  role: 'founder',
  name: 'Test User'
};

let accessToken = '';
let refreshToken = '';
let verificationToken = '';

function curlRequest(method, endpoint, data = null, headers = {}) {
  const headersStr = Object.entries(headers)
    .map(([key, value]) => `-H "${key}: ${value}"`)
    .join(' ');
  
  const dataStr = data ? `-d '${JSON.stringify(data)}'` : '';
  
  const command = `curl -s -X ${method} ${headersStr} ${dataStr} ${BASE_URL}${endpoint}`;
  
  try {
    const result = execSync(command, { encoding: 'utf8' });
    return { success: true, data: JSON.parse(result) };
  } catch (error) {
    try {
      const errorData = JSON.parse(error.stdout);
      return { success: false, data: errorData, status: error.status };
    } catch {
      return { success: false, error: error.message };
    }
  }
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✅ ${message}`);
}

async function testRegistration() {
  console.log('🧪 Testing user registration...');
  
  const result = curlRequest('POST', '/register', testUser, {
    'Content-Type': 'application/json'
  });
  
  assert(result.success, 'Registration should succeed');
  assert(result.data.message === 'User registered successfully', 'Should return success message');
  assert(result.data.user.email === testUser.email, 'Should return user with correct email');
  assert(result.data.user.role === testUser.role, 'Should return user with correct role');
  assert(result.data.access_token, 'Should return access token');
  assert(result.data.refresh_token, 'Should return refresh token');
  assert(result.data.verification_token, 'Should return verification token');
  
  verificationToken = result.data.verification_token;
  console.log('✅ Registration test passed');
}

async function testLogin() {
  console.log('\n🧪 Testing user login...');
  
  const result = curlRequest('POST', '/login', {
    email: testUser.email,
    password: testUser.password
  }, {
    'Content-Type': 'application/json'
  });
  
  assert(result.success, 'Login should succeed');
  assert(result.data.message === 'Login successful', 'Should return success message');
  assert(result.data.access_token, 'Should return access token');
  assert(result.data.refresh_token, 'Should return refresh token');
  
  accessToken = result.data.access_token;
  refreshToken = result.data.refresh_token;
  console.log('✅ Login test passed');
}

async function testProfileAccess() {
  console.log('\n🧪 Testing profile access with valid token...');
  
  const result = curlRequest('GET', '/profile', null, {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  });
  
  assert(result.success, 'Profile access should succeed');
  assert(result.data.user.email === testUser.email, 'Should return user profile');
  console.log('✅ Profile access test passed');
}

async function testUnauthorizedAccess() {
  console.log('\n🧪 Testing unauthorized access...');
  
  const result = curlRequest('GET', '/profile');
  
  assert(!result.success, 'Should fail without token');
  assert(result.status === 401, 'Should return 401 status');
  console.log('✅ Unauthorized access test passed');
}

async function testInvalidToken() {
  console.log('\n🧪 Testing access with invalid token...');
  
  const result = curlRequest('GET', '/profile', null, {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer invalid_token_here'
  });
  
  assert(!result.success, 'Should fail with invalid token');
  assert(result.status === 403, 'Should return 403 status');
  console.log('✅ Invalid token test passed');
}

async function testRefreshToken() {
  console.log('\n🧪 Testing token refresh...');
  
  const result = curlRequest('POST', '/refresh', {
    refresh_token: refreshToken
  }, {
    'Content-Type': 'application/json'
  });
  
  assert(result.success, 'Token refresh should succeed');
  assert(result.data.access_token, 'Should return new access token');
  assert(result.data.refresh_token, 'Should return new refresh token');
  
  // Update tokens for subsequent tests
  accessToken = result.data.access_token;
  refreshToken = result.data.refresh_token;
  console.log('✅ Token refresh test passed');
}

async function testLogout() {
  console.log('\n🧪 Testing logout...');
  
  const result = curlRequest('POST', '/logout', null, {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  });
  
  assert(result.success, 'Logout should succeed');
  assert(result.data.message === 'Logout successful', 'Should return success message');
  console.log('✅ Logout test passed');
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive authentication API test suite\n');
  
  const tests = [
    testRegistration,
    testLogin,
    testProfileAccess,
    testUnauthorizedAccess,
    testInvalidToken,
    testRefreshToken,
    testLogout
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await test();
      passed++;
    } catch (error) {
      console.error(`Test failed: ${error.message}`);
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 COMPREHENSIVE TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(50));
  
  if (failed === 0) {
    console.log('🎉 ALL AUTHENTICATION TESTS PASSED!');
    return true;
  } else {
    console.log('⚠️  Some tests failed.');
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  // Start the server first
  const { spawn } = require('child_process');
  const server = spawn('node', ['src/app.js'], {
    cwd: '/sandbox/.openclaw-data/workspace/backend',
    stdio: 'pipe'
  });
  
  server.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
    if (data.includes('running on port')) {
      // Server is ready, run tests
      runAllTests().then(success => {
        server.kill();
        process.exit(success ? 0 : 1);
      });
    }
  });
  
  server.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });
  
  // Handle server exit
  server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    server.kill();
    process.exit(0);
  });
}

module.exports = { runAllTests };