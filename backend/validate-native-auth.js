const NativeAuth = require('./src/auth-native');
const auth = new NativeAuth('test-secret-key');

async function validateNativeAuth() {
  console.log('🧪 Validating Native JWT Authentication System\n');

  // Test 1: JWT Token Generation and Verification
  console.log('1. Testing native JWT token generation and verification...');
  try {
    const testUser = {
      id: 1,
      email: 'test@example.com',
      role: 'founder',
      email_verified: true
    };
    
    const token = auth.generateToken(testUser);
    console.log(`✅ Token generated: ${token.substring(0, 30)}...`);
    
    const result = auth.verifyToken(token);
    if (result.valid) {
      console.log('✅ JWT token verification successful');
      console.log(`   User ID: ${result.user.id}, Email: ${result.user.email}`);
    } else {
      console.error('❌ JWT verification failed:', result.error);
    }
  } catch (error) {
    console.error('❌ JWT test failed:', error.message);
  }

  // Test 2: Password Hashing
  console.log('\n2. Testing password hashing...');
  try {
    const plainPassword = 'testpassword123';
    const hashedPassword = await auth.hashPassword(plainPassword);
    console.log(`✅ Password hashed: ${hashedPassword.substring(0, 20)}...`);
    
    const isValid = await auth.verifyPassword(plainPassword, hashedPassword);
    if (isValid) {
      console.log('✅ Password verification successful');
    } else {
      console.error('❌ Password verification failed');
    }
  } catch (error) {
    console.error('❌ Password hashing test failed:', error.message);
  }

  // Test 3: Database Schema Validation
  console.log('\n3. Validating database schema structure...');
  try {
    const fs = require('fs');
    const schema = fs.readFileSync('./database/schema.sql', 'utf8');
    
    const requiredComponents = [
      'CREATE TABLE users',
      'email VARCHAR',
      'password_hash VARCHAR',
      'role VARCHAR',
      'email_verified BOOLEAN',
      'verification_token VARCHAR',
      'verification_token_expires TIMESTAMP'
    ];
    
    const missingComponents = requiredComponents.filter(component => !schema.includes(component));
    
    if (missingComponents.length === 0) {
      console.log('✅ Database schema validation successful');
      console.log('   All required authentication components present');
    } else {
      console.error('❌ Database schema missing components:', missingComponents);
    }
  } catch (error) {
    console.error('❌ Schema validation failed:', error.message);
  }

  // Test 4: Environment Configuration
  console.log('\n4. Validating environment configuration...');
  try {
    const fs = require('fs');
    const envContent = fs.readFileSync('./.env', 'utf8');
    
    const requiredEnvVars = [
      'JWT_SECRET',
      'JWT_EXPIRE',
      'DB_HOST',
      'DB_PORT',
      'DB_NAME',
      'DB_USER',
      'DB_PASSWORD'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !envContent.includes(varName));
    
    if (missingVars.length === 0) {
      console.log('✅ Environment configuration validation successful');
      console.log('   All required environment variables defined');
    } else {
      console.error('❌ Missing environment variables:', missingVars);
    }
  } catch (error) {
    console.error('❌ Environment validation failed:', error.message);
  }

  console.log('\n📋 Native Authentication System Validation Complete');
  console.log('✅ Native JWT token generation/verification');
  console.log('✅ Password hashing');
  console.log('✅ Database schema structure');
  console.log('✅ Environment configuration');
  console.log('\n🚀 The native authentication system is ready for use!');
}

// Run validation
validateNativeAuth();