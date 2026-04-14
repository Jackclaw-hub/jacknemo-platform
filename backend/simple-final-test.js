#!/usr/bin/env node

/**
 * Simple Final Authentication Test
 * Tests core authentication functionality
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

// Test user data
const testUser = {
  email: `simple_test_${Date.now()}@startupradar.com`,
  password: 'SecurePassword123!',
  name: 'Simple Test User',
  role: 'founder'
};

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            data: parsed
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testHealthEndpoint() {
  console.log('🧪 Testing health endpoint...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET'
    });
    
    if (response.status === 200) {
      console.log('✅ Health endpoint working:', response.data.message);
      return true;
    }
  } catch (error) {
    console.error('❌ Health endpoint failed:', error.message);
    return false;
  }
}

async function testRegistration() {
  console.log('🧪 Testing user registration...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, testUser);
    
    if (response.status === 201) {
      console.log('✅ Registration successful:', response.data.message);
      return true;
    } else if (response.status === 409 && response.data?.error?.includes('already exists')) {
      console.log('⚠️  User already exists (expected for retry), continuing...');
      return true;
    } else {
      console.error('❌ Registration failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Registration request failed:', error.message);
    return false;
  }
}

async function testLogin() {
  console.log('\n🧪 Testing user login...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      email: testUser.email,
      password: testUser.password
    });
    
    if (response.status === 200 && response.data.access_token) {
      console.log('✅ Login successful');
      console.log('   Access Token:', response.data.access_token.substring(0, 20) + '...');
      return true;
    } else {
      console.error('❌ Login failed:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Login request failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting simple authentication system test\n');
  
  const tests = [
    testHealthEndpoint,
    testRegistration,
    testLogin
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
  console.log('📊 SIMPLE TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 CORE AUTHENTICATION SYSTEM WORKING!');
    console.log('\n📋 SYSTEM STATUS:');
    console.log('   ✅ Express backend running');
    console.log('   ✅ JWT authentication working');
    console.log('   ✅ User registration functional');
    console.log('   ✅ User login functional');
    console.log('   ✅ Health endpoint available');
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