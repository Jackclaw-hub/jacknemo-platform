#!/usr/bin/env node

/**
 * Simple Authentication API Test using curl/child_process
 * Tests core authentication endpoints
 */

const { execSync } = require('child_process');

const BASE_URL = 'http://localhost:3001/api/auth';

// Test user data
const testUser = {
  email: `testuser_${Date.now()}@startupradar.com`,
  password: 'SecurePassword123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'founder'
};

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

async function testRegistration() {
  console.log('🧪 Testing user registration...');
  
  const result = curlRequest('POST', '/register', testUser, {
    'Content-Type': 'application/json'
  });
  
  if (result.success && result.data.message) {
    console.log('✅ Registration successful:', result.data.message);
    return true;
  } else if (!result.success && result.data?.error?.includes('already exists')) {
    console.log('⚠️  User already exists (expected for retry), continuing...');
    return true;
  } else {
    console.error('❌ Registration failed:', result.data || result.error);
    return false;
  }
}

async function testLogin() {
  console.log('\n🧪 Testing user login...');
  
  const result = curlRequest('POST', '/login', {
    email: testUser.email,
    password: testUser.password
  }, {
    'Content-Type': 'application/json'
  });
  
  if (result.success && result.data.accessToken) {
    console.log('✅ Login successful');
    console.log('   Access Token:', result.data.accessToken.substring(0, 20) + '...');
    return true;
  } else {
    console.error('❌ Login failed:', result.data || result.error);
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log('\n🧪 Testing unauthorized access...');
  
  const result = curlRequest('GET', '/profile');
  
  if (!result.success && result.status === 401) {
    console.log('✅ Unauthorized access correctly blocked (401)');
    return true;
  } else {
    console.error('❌ Unexpected response:', result);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting authentication API test suite\n');
  
  const tests = [
    testRegistration,
    testLogin,
    testUnauthorizedAccess
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 CORE AUTHENTICATION TESTS PASSED!');
    return true;
  } else {
    console.log('\n⚠️  Some core tests failed.');
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = { runTests };