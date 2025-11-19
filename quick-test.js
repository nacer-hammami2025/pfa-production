const { spawn } = require('child_process');
const axios = require('axios');

// Start server
console.log('Starting server...');
const server = spawn('npm', ['start'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  shell: true
});

// Wait for server to start
setTimeout(async () => {
  try {
    console.log('\nTesting API...');

    // Test health check
    const healthResponse = await axios.get('http://localhost:5000');
    console.log('✅ Health check passed');

    // Test registration
    const email = `test${Date.now()}@example.com`;
    const res = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test User',
      email: email,
      password: 'password123'
    });
    console.log('✅ Registration successful');

    // Test login
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: email,
      password: 'password123'
    });
    console.log('✅ Login successful');

    const token = loginRes.data.token;

    // Test get profile
    const profileRes = await axios.get('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile retrieval successful:', profileRes.data.name);

    // Test creating task
    const taskResponse = await axios.post('http://localhost:5000/api/tasks', {
      title: 'Test Task',
      description: 'Testing task creation',
      priority: 'high'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Task creation successful');

    // Test getting tasks
    const tasksResponse = await axios.get('http://localhost:5000/api/tasks', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Get tasks successful:', tasksResponse.data.length, 'tasks');

    console.log('\n🎉 All basic API tests passed!');

  } catch (error) {
    console.error('❌ API Test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  } finally {
    // Kill server
    server.kill();
    process.exit(0);
  }
}, 5000);