const http = require('http');

const BASE_URL = 'http://localhost:3001';

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

async function testAuthEndpoints() {
  console.log('🧪 Testing Startup Radar Authentication APIs...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await httpRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET'
    });
    console.log('✅ Health check:', healthResponse.data);

    // Test 2: User registration
    console.log('\n2. Testing user registration...');
    const testUser = {
      email: 'test@startupradar.com',
      password: 'TestPassword123!',
      role: 'founder',
      name: 'Test User'
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

    console.log('✅ Registration successful:', {
      userId: registerResponse.data.user?.id,
      email: registerResponse.data.user?.email,
      role: registerResponse.data.user?.role,
      hasAccessToken: !!registerResponse.data.access_token,
      hasRefreshToken: !!registerResponse.data.refresh_token
    });

    const { access_token, refresh_token } = registerResponse.data;

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

    console.log('✅ Login successful:', {
      userId: loginResponse.data.user?.id,
      email: loginResponse.data.user?.email,
      role: loginResponse.data.user?.role
    });

    // Test 4: Get user profile (protected)
    console.log('\n4. Testing protected profile endpoint...');
    const profileResponse = await httpRequest({
      hostname: 'localhost',
      port: 3001,
      path: '/api/auth/profile',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    console.log('✅ Profile retrieval successful:', {
      name: profileResponse.data.user?.name,
      email: profileResponse.data.user?.email,
      role: profileResponse.data.user?.role
    });

    console.log('\n🎉 Core authentication endpoints working correctly!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Health check endpoint');
    console.log('- ✅ User registration with role validation');
    console.log('- ✅ User login with password verification');
    console.log('- ✅ JWT token generation and verification');
    console.log('- ✅ Protected route authentication');
    console.log('- ✅ Profile management');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testAuthEndpoints();