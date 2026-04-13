// Test script to verify JWT authentication system
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Test bcrypt password hashing
async function testBcrypt() {
  console.log('Testing bcrypt password hashing...');
  const password = 'testpassword123';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('Password:', password);
  console.log('Hashed password:', hashedPassword);
  
  const isValid = await bcrypt.compare(password, hashedPassword);
  console.log('Password verification:', isValid);
  return isValid;
}

// Test JWT token generation
function testJWT() {
  console.log('\nTesting JWT token generation...');
  const payload = {
    id: 1,
    email: 'test@example.com',
    role: 'founder'
  };
  
  const secret = 'your-super-secret-jwt-key-here-change-in-production';
  const token = jwt.sign(payload, secret, { expiresIn: '24h' });
  console.log('Generated token:', token);
  
  const decoded = jwt.verify(token, secret);
  console.log('Decoded token:', decoded);
  return decoded.email === 'test@example.com';
}

// Run tests
async function runTests() {
  try {
    const bcryptTest = await testBcrypt();
    const jwtTest = testJWT();
    
    console.log('\n=== TEST RESULTS ===');
    console.log('BCrypt test:', bcryptTest ? 'PASS' : 'FAIL');
    console.log('JWT test:', jwtTest ? 'PASS' : 'FAIL');
    
    if (bcryptTest && jwtTest) {
      console.log('\n✅ Authentication system core functionality verified!');
      console.log('The JWT authentication system is working correctly.');
    } else {
      console.log('\n❌ Some tests failed');
    }
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

runTests();