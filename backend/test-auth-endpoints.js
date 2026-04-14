const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test authentication endpoints
async function testAuthEndpoints() {
  console.log('🧪 Testing Startup Radar Authentication APIs...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check:', healthResponse.data);

    // Test 2: User registration
    console.log('\n2. Testing user registration...');
    const testUser = {
      email: 'test@startupradar.com',
      password: 'TestPassword123!',
      role: 'founder',
      name: 'Test User'
    };

    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    console.log('✅ Registration successful:', {
      userId: registerResponse.data.user.id,
      email: registerResponse.data.user.email,
      role: registerResponse.data.user.role,
      hasAccessToken: !!registerResponse.data.access_token,
      hasRefreshToken: !!registerResponse.data.refresh_token
    });

    const { access_token, refresh_token } = registerResponse.data;

    // Test 3: User login
    console.log('\n3. Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login successful:', {
      userId: loginResponse.data.user.id,
      email: loginResponse.data.user.email,
      role: loginResponse.data.user.role
    });

    // Test 4: Get user profile (protected)
    console.log('\n4. Testing protected profile endpoint...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    console.log('✅ Profile retrieval successful:', {
      name: profileResponse.data.user.name,
      email: profileResponse.data.user.email,
      role: profileResponse.data.user.role
    });

    // Test 5: Update user profile (protected)
    console.log('\n5. Testing profile update...');
    const updateResponse = await axios.put(`${BASE_URL}/auth/profile`, {
      name: 'Updated Test User'
    }, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    console.log('✅ Profile update successful:', {
      name: updateResponse.data.user.name,
      email: updateResponse.data.user.email
    });

    // Test 6: Refresh token
    console.log('\n6. Testing token refresh...');
    const refreshResponse = await axios.post(`${BASE_URL}/auth/refresh`, {
      refresh_token
    });
    console.log('✅ Token refresh successful:', {
      hasNewAccessToken: !!refreshResponse.data.access_token,
      hasNewRefreshToken: !!refreshResponse.data.refresh_token
    });

    // Test 7: Email verification
    console.log('\n7. Testing email verification...');
    const verifyResponse = await axios.get(`${BASE_URL}/auth/verify/${registerResponse.data.verification_token}`);
    console.log('✅ Email verification successful:', {
      message: verifyResponse.data.message,
      userEmail: verifyResponse.data.user.email
    });

    // Test 8: Logout
    console.log('\n8. Testing logout...');
    const logoutResponse = await axios.post(`${BASE_URL}/auth/logout`, {}, {
      headers: {
        Authorization: `Bearer ${access_token}`
      }
    });
    console.log('✅ Logout successful:', logoutResponse.data);

    console.log('\n🎉 All authentication endpoints working correctly!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Health check endpoint');
    console.log('- ✅ User registration with role validation');
    console.log('- ✅ User login with password verification');
    console.log('- ✅ JWT token generation and verification');
    console.log('- ✅ Protected route authentication');
    console.log('- ✅ Profile management');
    console.log('- ✅ Token refresh mechanism');
    console.log('- ✅ Email verification system');
    console.log('- ✅ Logout functionality');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests
testAuthEndpoints();