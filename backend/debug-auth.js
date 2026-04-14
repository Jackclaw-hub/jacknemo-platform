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
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        console.log(`Response status: ${res.statusCode}`);
        console.log(`Response data: ${responseData}`);
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve({ raw: responseData });
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

async function testRegistration() {
  console.log('Testing registration...');
  const testUser = {
    email: 'test@startupradar.com',
    password: 'TestPassword123!',
    role: 'founder',
    name: 'Test User'
  };

  const response = await testEndpoint('POST', '/api/auth/register', testUser);
  console.log('Full response:', response);
  return response;
}

// Run test
testRegistration();