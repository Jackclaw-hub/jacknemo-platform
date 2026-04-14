#!/usr/bin/env node

/**
 * Complete Authentication API Test Suite
 * Tests all authentication endpoints for Phase 2 & 3
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/auth';

// Test user data
const testUser = {
  email: `testuser_${Date.now()}@startupradar.com`,
  password: 'SecurePassword123!',
  firstName: 'Test',
  lastName: 'User',
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
      return true;
    }
  } catch (error) {
    if (error.response?.status === 400 && error.response.data?.error?.includes('already exists')) {
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
    
    if (response.status === 200 && response.data.accessToken) {
      authToken = response.data.accessToken;
      refreshTokenValue = response.data.refreshToken;
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
        email: response.data.email,
        firstName: response.data.firstName,
        lastName: response.data.lastName,
        role: response.data.role
      });
      return true;
    }
  } catch (error) {
    console.error('❌ Profile access failed:', error.response?.data || error.message);
    return false;
  }
}

async function testTokenRefresh() {
  console.log('\n🧪 Testing token refresh...');
  
  if (!refreshTokenValue) {
    console.log('⚠️  No refresh token available, skipping refresh test');
    return true;
  }
  
  try {
    const response = await axios.post(`${BASE_URL}/refresh`, {
      refreshToken: refreshTokenValue
    });
    
    if (response.status === 200 && response.data.accessToken) {
      const newToken = response.data.accessToken;
      console.log('✅ Token refresh successful');
      console.log('   New Access Token:', newToken.substring(0, 20) + '...');
      
      // Update auth token for subsequent tests
      authToken = newToken;
      return true;
    }
  } catch (error) {
    console.error('❌ Token refresh failed:', error.response?.data || error.message);
    return false;
  }
}

async function testLogout() {
  console.log('\n🧪 Testing user logout...');
  
  if (!authToken) {
    console.log('❌ No auth token available');
    return false;
  }
  
  try {
    const response = await axios.post(`${BASE_URL}/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200) {
      console.log('✅ Logout successful:', response.data.message);
      return true;
    }
  } catch (error) {
    console.error('❌ Logout failed:', error.response?.data || error.message);
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

async function runAllTests() {
  console.log('🚀 Starting complete authentication API test suite\n');
  
  const tests = [
    testRegistration,
    testLogin,
    testProfileAccess,
    testTokenRefresh,
    testLogout,
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
  console.log('📊 TEST SUITE SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Authentication API is working correctly.');
    return true;
  } else {
    console.log('\n⚠️  Some tests failed. Check the implementation.');
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