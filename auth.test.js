const assert = require('assert');
const http = require('http');

function httpRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
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

async function runTests() {
  console.log('🧪 Running Authentication Tests...\n');
  
  let accessToken = '';
  let refreshToken = '';
  let userId = '';

  try {
    // Test 1: Health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await httpRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET'
    });
    
    assert.strictEqual(healthResponse.status, 200, 'Health endpoint should return 200');
    assert.strictEqual(healthResponse.data.status, 'OK', 'Health status should be OK');
    console.log('✅ Health endpoint test passed');

    // Test 2: User registration
    console.log('\n2. Testing user registration...');
    const testUser = {
      email: 'test-user@startupradar.com',
      password: 'SecurePassword123!',
      role: 'founder',
      name: 'Test Founder'
    };

    const registerResponse = await httpRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/register',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, testUser);

    assert.strictEqual(registerResponse.status, 201, 'Registration should return 201');
    assert.ok(registerResponse.data.user.id, 'User should have an ID');
    assert.strictEqual(registerResponse.data.user.email, testUser.email, 'Email should match');
    assert.strictEqual(registerResponse.data.user.role, testUser.role, 'Role should match');
    assert.ok(registerResponse.data.access_token, 'Should have access token');
    assert.ok(registerResponse.data.refresh_token, 'Should have refresh token');
    
    accessToken = registerResponse.data.access_token;
    refreshToken = registerResponse.data.refresh_token;
    userId = registerResponse.data.user.id;
    
    console.log('✅ Registration test passed');

    // Test 3: User login
    console.log('\n3. Testing user login...');
    const loginResponse = await httpRequest({
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

    assert.strictEqual(loginResponse.status, 200, 'Login should return 200');
    assert.strictEqual(loginResponse.data.user.email, testUser.email, 'Login email should match');
    assert.ok(loginResponse.data.access_token, 'Login should return access token');
    console.log('✅ Login test passed');

    // Test 4: Protected profile endpoint
    console.log('\n4. Testing protected profile endpoint...');
    const profileResponse = await httpRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/profile',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    assert.strictEqual(profileResponse.status, 200, 'Profile should return 200');
    assert.strictEqual(profileResponse.data.user.name, testUser.name, 'Profile name should match');
    console.log('✅ Protected profile test passed');

    // Test 5: Invalid token protection
    console.log('\n5. Testing invalid token protection...');
    const invalidTokenResponse = await httpRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/profile',
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token-123'
      }
    });

    assert.strictEqual(invalidTokenResponse.status, 403, 'Invalid token should return 403');
    console.log('✅ Invalid token protection test passed');

    // Test 6: Missing token protection
    console.log('\n6. Testing missing token protection...');
    const noTokenResponse = await httpRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/profile',
      method: 'GET'
    });

    assert.strictEqual(noTokenResponse.status, 401, 'Missing token should return 401');
    console.log('✅ Missing token protection test passed');

    console.log('\n🎉 All authentication tests passed!');
    console.log('\n📋 Test Summary:');
    console.log('- ✅ Health endpoint');
    console.log('- ✅ User registration with role validation');
    console.log('- ✅ User login with password verification');
    console.log('- ✅ JWT token authentication');
    console.log('- ✅ Protected route access control');
    console.log('- ✅ Invalid token rejection');
    console.log('- ✅ Missing token rejection');
    
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.actual !== undefined) {
      console.error('   Expected:', error.expected);
      console.error('   Actual:', error.actual);
    }
    return false;
  }
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Unhandled test error:', error);
  process.exit(1);
});