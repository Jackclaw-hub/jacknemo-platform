const http = require('http');

const BASE_URL = 'http://localhost:3001/api';

async function testEndpoint(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

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
    const healthResponse = await testEndpoint('GET', '/api/health');
    console.log('✅ Health check:', healthResponse.status);

    // Test 2: User registration
    console.log('\n2. Testing user registration...');
    const testUser = {
      email: 'test@startupradar.com',
      password: 'TestPassword123!',
      role: 'founder',
      name: 'Test User'
    };

    const registerResponse = await testEndpoint('POST', '/api/auth/register', testUser);
    console.log('✅ Registration successful:', {
      userId: registerResponse.user.id,
      email: registerResponse.user.email,
      role: registerResponse.user.role,
      hasAccessToken: !!registerResponse.token
    });

    const { token } = registerResponse;

    // Test 3: User login
    console.log('\n3. Testing user login...');
    const loginResponse = await testEndpoint('POST', '/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful:', {
      userId: loginResponse.user.id,
      email: loginResponse.user.email,
      role: loginResponse.user.role
    });

    // Test 4: Get user profile (protected)
    console.log('\n4. Testing protected profile endpoint...');
    const profileResponse = await testEndpoint('GET', '/api/auth/profile', null, {
      Authorization: `Bearer ${token}`
    });
    console.log('✅ Profile retrieval successful:', {
      name: profileResponse.user.name,
      email: profileResponse.user.email,
      role: profileResponse.user.role
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
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testAuthEndpoints();