#!/usr/bin/env node

/**
 * Final Authentication System Test
 * Tests all authentication endpoints comprehensively
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/auth';

// Test user data
const testUser = {
  email: `final_test_${Date.now()}@startupradar.com`,
  password: 'SecurePassword123!',
  name: 'Final Test User',
  role: 'founder'
};

let authToken = null;
let refreshTokenValue = null;

async function testRegistration() {
  console.log('🧪 Testing user registration...');
  
  try {
    const response = await axios.post(`${BASE_URL}/register`, testUser);
    
    if (response.status === 201) {
      console.log('✅ Registration successful:', response.data.message);
      console.log('   User ID:', response.data.user.id);
      return true;
    }
  } catch (error) {
    if (error.response?.status === 409 && error.response.data?.error?.includes('already exists')) {
      console.log('⚠️  User already exists (expected for retry), continuing...');
      return true;
    }
    console.error('❌ Registration failed:', error.response?.data || error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n🧪 Testing user login...');
  
  try {
    const response = await axios.post(`${BASE_URL}/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (response.status === 200 && response.data.access_token) {
      authToken = response.data.access_token;
      refreshTokenValue = response.data.refresh_token;
      console.log('✅ Login successful');
      console.log('   Access Token:', authToken.substring(0, 20) + '...');
      console.log('   Refresh Token:', refreshTokenValue ? refreshTokenValue.substring(0, 20) + '...' : 'Not provided');
      return true;
    }
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testProfileAccess() {
  console.log('\n🧪 Testing profile access (protected route)...');
  
  if (!authToken) {
    console.log('❌ No auth token available');
    return false;
  }
  
  try {
    const response = await axios.get(`${BASE_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Profile access successful');
      console.log('   User data:', {
        email: response.data.user.email,
        name: response.data.user.name,
        role: response.data.user.role
      });
      return true;
    }
  } catch (error) {
    console.error('❌ Profile access failed:', error.response?.data || error.message);
    return false;
  }
}

async function testUnauthorizedAccess() {
  console.log('\n🧪 Testing unauthorized access...');
  
  try {
    await axios.get(`${BASE_URL}/profile`);
    console.error('❌ Should have failed with 401');
    return false;
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Unauthorized access correctly blocked (401)');
      return true;
    }
    console.error('❌ Unexpected error:', error.response?.data || error.message);
    return false;
  }
}

async function testHealthEndpoint() {
  console.log('\n🧪 Testing health endpoint...');
  
  try {
    const response = await axios.get('http://localhost:3001/api/health');
    
    if (response.status === 200) {
      console.log('✅ Health endpoint working:', response.data.message);
      return true;
    }
  } catch (error) {
    console.error('❌ Health endpoint failed:', error.response?.data || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting final authentication system test suite\n');
  
  const tests = [
    testRegistration,
    testLogin,
    testProfileAccess,
    testUnauthorizedAccess,
    testHealthEndpoint
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
  console.log('📊 FINAL TEST SUITE SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Authentication system is fully operational.');
    console.log('\n📋 SYSTEM STATUS:');
    console.log('   ✅ Express backend running');
    console.log('   ✅ JWT authentication working');
    console.log('   ✅ Protected routes secured');
    console.log('   ✅ Error handling implemented');
    console.log('   ✅ Health endpoint available');
    console.log('   ✅ Mock database functioning');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Authentication system needs attention.');
    return false;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };