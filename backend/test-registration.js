const { exec } = require('child_process');
const http = require('http');

// Test the user registration endpoint
function testRegistration() {
  console.log('🧪 Testing User Registration Endpoint...\n');

  const postData = JSON.stringify({
    email: 'test@startupradar.com',
    password: 'testpassword123',
    role: 'founder',
    name: 'Test User'
  });

  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log(`📊 Response Status: ${res.statusCode}`);
      console.log(`📋 Response Headers: ${JSON.stringify(res.headers, null, 2)}`);
      
      try {
        const response = JSON.parse(data);
        console.log('✅ Registration Response:', JSON.stringify(response, null, 2));
        
        if (res.statusCode === 201) {
          console.log('\n🎉 SUCCESS: User registration endpoint is working!');
          console.log('📝 Response includes:', {
            hasMessage: !!response.message,
            hasUserData: !!response.user,
            hasToken: !!response.token,
            userFields: response.user ? Object.keys(response.user) : []
          });
        } else {
          console.log('❌ Registration failed with status:', res.statusCode);
          console.log('Error details:', response);
        }
      } catch (error) {
        console.log('❌ Failed to parse response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Request error:', error.message);
    console.log('💡 Make sure the server is running on port 3001');
  });

  req.write(postData);
  req.end();
}

// Check if server is running
function checkServer() {
  console.log('🔍 Checking if server is running...');
  
  const healthCheck = http.get('http://localhost:3001/api/health', (res) => {
    if (res.statusCode === 200) {
      console.log('✅ Server is running and healthy');
      testRegistration();
    } else {
      console.log(`❌ Server returned status: ${res.statusCode}`);
      startServerAndTest();
    }
  }).on('error', (error) => {
    console.log('❌ Server not running:', error.message);
    startServerAndTest();
  });
}

// Start server and run test
function startServerAndTest() {
  console.log('🚀 Starting server...');
  
  const serverProcess = exec('cd backend && npm start', (error, stdout, stderr) => {
    if (error) {
      console.log('❌ Failed to start server:', error);
      return;
    }
    console.log('Server output:', stdout);
    if (stderr) console.log('Server errors:', stderr);
  });

  // Wait a moment for server to start, then test
  setTimeout(() => {
    testRegistration();
  }, 3000);
}

// Run the test
checkServer();