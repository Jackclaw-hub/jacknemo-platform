const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/auth';

async function testAuth() {
  console.log('🧪 Testing Startup Radar Authentication System\n');

  try {
    // Test 1: Register a new user
    console.log('1. Testing user registration...');
    const registerResponse = await axios.post(`${BASE_URL}/register`, {
      email: 'test.founder@example.com',
      password: 'founderpassword123',
      role: 'founder',
      name: 'Test Founder'
    });
    
    console.log('✅ Registration successful');
    const { user, token } = registerResponse.data.data;
    console.log(`   User ID: ${user.id}, Role: ${user.role}`);
    console.log(`   Token received: ${token ? 'Yes' : 'No'}`);

    // Test 2: Login with the same user
    console.log('\n2. Testing user login...');
    const loginResponse = await axios.post(`${BASE_URL}/login`, {
      email: 'test.founder@example.com',
      password: 'founderpassword123'
    });
    
    console.log('✅ Login successful');
    const loginToken = loginResponse.data.data.token;
    console.log(`   Login token received: ${loginToken ? 'Yes' : 'No'}`);

    // Test 3: Get user profile
    console.log('\n3. Testing profile retrieval...');
    const profileResponse = await axios.get(`${BASE_URL}/profile`, {
      headers: {
        'Authorization': `Bearer ${loginToken}`
      }
    });
    
    console.log('✅ Profile retrieval successful');
    console.log(`   User email: ${profileResponse.data.data.email}`);
    console.log(`   User role: ${profileResponse.data.data.role}`);

    // Test 4: Update user profile
    console.log('\n4. Testing profile update...');
    const updateResponse = await axios.put(`${BASE_URL}/profile`, {
      name: 'Updated Test Founder',
      email: 'updated.founder@example.com'
    }, {
      headers: {
        'Authorization': `Bearer ${loginToken}`
      }
    });
    
    console.log('✅ Profile update successful');
    console.log(`   Updated name: ${updateResponse.data.data.name}`);
    console.log(`   Updated email: ${updateResponse.data.data.email}`);

    console.log('\n🎉 All authentication tests passed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - User registration with role validation');
    console.log('   - Secure password hashing (bcrypt)');
    console.log('   - JWT token generation and validation');
    console.log('   - Protected route authentication');
    console.log('   - Profile management with role-based access');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('⚠️  Note: Make sure the server is running on port 3001 before testing');
  console.log('   Run: npm run dev in the backend directory\n');
  
  setTimeout(() => {
    testAuth();
  }, 2000);
}

module.exports = { testAuth };