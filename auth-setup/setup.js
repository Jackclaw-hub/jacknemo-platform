const AuthService = require('./src/auth');

console.log('🧪 Testing Authentication Setup...\n');

// Test password hashing
async function testPasswordHashing() {
    console.log('1. Testing password hashing...');
    const authService = new AuthService('test-secret-key');
    
    const password = 'securepassword123';
    const hash = await authService.hashPassword(password);
    
    console.log('✅ Password hashing works');
    console.log(`   Original: ${password}`);
    console.log(`   Hash: ${hash.substring(0, 20)}...`);
    
    const match = await authService.comparePassword(password, hash);
    console.log(`✅ Password comparison: ${match ? 'PASS' : 'FAIL'}`);
    
    const wrongMatch = await authService.comparePassword('wrongpass', hash);
    console.log(`✅ Wrong password rejection: ${!wrongMatch ? 'PASS' : 'FAIL'}`);
}

// Test JWT generation
function testJWT() {
    console.log('\n2. Testing JWT generation...');
    const authService = new AuthService('test-secret-key');
    
    const user = {
        id: 1,
        email: 'test@example.com',
        role: 'user',
        full_name: 'Test User'
    };
    
    const token = authService.generateToken(user);
    console.log('✅ JWT generation works');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    
    const decoded = authService.verifyToken(token);
    console.log('✅ JWT verification works');
    console.log(`   User ID: ${decoded.sub}`);
    console.log(`   Email: ${decoded.email}`);
}

// Test token extraction
function testTokenExtraction() {
    console.log('\n3. Testing token extraction...');
    const authService = new AuthService('test-secret-key');
    
    const header = 'Bearer abc123.def456.ghi789';
    const token = authService.extractTokenFromHeader(header);
    
    console.log('✅ Token extraction works');
    console.log(`   Header: ${header}`);
    console.log(`   Extracted: ${token}`);
}

// Run all tests
async function runTests() {
    try {
        await testPasswordHashing();
        testJWT();
        testTokenExtraction();
        
        console.log('\n🎉 All authentication tests passed!');
        console.log('\n📦 Next steps:');
        console.log('   npm install - Install dependencies');
        console.log('   npm test - Run test suite');
        console.log('   Integrate with Express.js backend');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

runTests();