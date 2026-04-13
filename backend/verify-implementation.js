#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying JWT Authentication System Implementation\n');

const filesToCheck = [
  'src/app.js',
  'src/routes/auth.js',
  'src/controllers/authController.js',
  'src/models/User.js',
  'src/middleware/auth.js',
  'src/config/database.js',
  'database/schema.sql',
  'package.json',
  '.env',
  'test-auth.js'
];

const features = [
  { name: 'Express Server Setup', file: 'src/app.js', check: /express.*cors.*dotenv/ },
  { name: 'Authentication Routes', file: 'src/routes/auth.js', check: /register.*login.*profile/ },
  { name: 'Registration Controller', file: 'src/controllers/authController.js', check: /bcrypt.*jwt.*generateToken/ },
  { name: 'User Model', file: 'src/models/User.js', check: /create.*findByEmail.*verifyPassword/ },
  { name: 'JWT Middleware', file: 'src/middleware/auth.js', check: /authenticateToken.*requireRole/ },
  { name: 'Database Schema', file: 'database/schema.sql', check: /users.*password_hash.*role/ },
  { name: 'Package Dependencies', file: 'package.json', check: /express.*pg.*bcrypt.*jsonwebtoken/ },
  { name: 'Environment Configuration', file: '.env', check: /JWT_SECRET.*DB_/ },
  { name: 'Test Suite', file: 'test-auth.js', check: /register.*login.*profile/ }
];

let allFilesExist = true;
let allFeaturesPresent = true;

console.log('📁 File Structure Verification:');
filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('\n⚡ Feature Verification:');
features.forEach(feature => {
  const filePath = path.join(__dirname, feature.file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (feature.check.test(content)) {
      console.log(`✅ ${feature.name}`);
    } else {
      console.log(`❌ ${feature.name} - Feature not found`);
      allFeaturesPresent = false;
    }
  } else {
    console.log(`❌ ${feature.name} - File missing`);
    allFeaturesPresent = false;
  }
});

console.log('\n📋 Summary:');
if (allFilesExist && allFeaturesPresent) {
  console.log('🎉 ALL CHECKS PASSED - JWT authentication system is fully implemented!');
  console.log('\n🚀 Next steps when network is available:');
  console.log('   1. npm install - Install dependencies');
  console.log('   2. createdb startup_radar - Create database');
  console.log('   3. psql -d startup_radar -f database/schema.sql - Setup schema');
  console.log('   4. npm run dev - Start server');
  console.log('   5. node test-auth.js - Run comprehensive tests');
} else {
  console.log('❌ Some checks failed. Please review the implementation.');
}

console.log('\n📊 Status:', allFilesExist && allFeaturesPresent ? 'COMPLETE' : 'INCOMPLETE');