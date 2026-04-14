#!/usr/bin/env node

/**
 * Integrated Authentication Test
 * Starts server and tests authentication internally
 */

const app = require('./src/app');

// Test user data
const testUser = {
  email: `integrated_test_${Date.now()}@startupradar.com`,
  password: 'SecurePassword123!',
  name: 'Integrated Test User',
  role: 'founder'
};

let server = null;
let authToken = null;

async function startServer() {
  return new Promise((resolve) => {
    server = app.listen(3002, () => {
      console.log('✅ Test server started on port 3002');
      resolve();
    });
  });
}

async function stopServer() {
  if (server) {
    server.close();
    console.log('✅ Test server stopped');
  }
}

async function testHealthEndpoint() {
  console.log('🧪 Testing health endpoint...');
  
  try {
    const response = await fetch('http://localhost:3002/api/health');
    const data = await response.json();
    
    if (response.status === 200) {
      console.log('✅ Health endpoint working:', data.message);
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
    const response = await fetch('http://localhost:3002/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    if (response.status === 201) {
      console.log('✅ Registration successful:', data.message);
      return true;
    } else if (response.status === 409 && data.error?.includes('already exists')) {
      console.log('⚠️  User already exists (expected for retry), continuing...');
      return true;
    } else {
      console.error('❌ Registration failed:', data);
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
    const response = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    
    const data = await response.json();
    
    if (response.status === 200 && data.access_token) {
      authToken = data.access_token;
      console.log('✅ Login successful');
      console.log('   Access Token:', authToken.substring(0, 20) + '...');
      return true;
    } else {
      console.error('❌ Login failed:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Login request failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting integrated authentication system test\n');
  
  try {
    await startServer();
    
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
    console.log('📊 INTEGRATED TEST SUMMARY');
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
    
  } finally {
    await stopServer();
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