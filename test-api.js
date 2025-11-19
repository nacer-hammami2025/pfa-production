const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testAPI() {
  console.log('🚀 Starting comprehensive API testing...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL.replace('/api', '')}`);
    console.log('✅ Health check passed\n');

    // Test 2: User Registration
    console.log('2️⃣ Testing User Registration...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ Registration successful:', registerResponse.data.user.name);
    const token = registerResponse.data.token;
    console.log('✅ Token received\n');

    // Test 3: User Login
    console.log('3️⃣ Testing User Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ Login successful:', loginResponse.data.user.name);
    console.log('✅ Token received\n');

    // Test 4: Get User Profile
    console.log('4️⃣ Testing Get User Profile...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Profile retrieved:', profileResponse.data.name);
    console.log('✅ User ID:', profileResponse.data.id, '\n');

    // Test 5: Create Task
    console.log('5️⃣ Testing Task Creation...');
    const taskResponse = await axios.post(`${BASE_URL}/tasks`, {
      title: 'Test Task',
      description: 'This is a test task',
      priority: 'high',
      category: 'work'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Task created:', taskResponse.data.title);
    const taskId = taskResponse.data._id;
    console.log('✅ Task ID:', taskId, '\n');

    // Test 6: Get Tasks
    console.log('6️⃣ Testing Get Tasks...');
    const tasksResponse = await axios.get(`${BASE_URL}/tasks`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Tasks retrieved:', tasksResponse.data.length, 'tasks');
    console.log('✅ First task title:', tasksResponse.data[0]?.title, '\n');

    // Test 7: Update Task
    console.log('7️⃣ Testing Task Update...');
    const updateResponse = await axios.put(`${BASE_URL}/tasks/${taskId}`, {
      title: 'Updated Test Task',
      completed: true
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Task updated:', updateResponse.data.title);
    console.log('✅ Task completed:', updateResponse.data.completed, '\n');

    // Test 8: Create Project
    console.log('8️⃣ Testing Project Creation...');
    const projectResponse = await axios.post(`${BASE_URL}/projects`, {
      name: 'Test Project',
      description: 'This is a test project',
      priority: 'high'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Project created:', projectResponse.data.name);
    const projectId = projectResponse.data._id;
    console.log('✅ Project ID:', projectId, '\n');

    // Test 9: Get Projects
    console.log('9️⃣ Testing Get Projects...');
    const projectsResponse = await axios.get(`${BASE_URL}/projects`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Projects retrieved:', projectsResponse.data.length, 'projects');
    console.log('✅ First project name:', projectsResponse.data[0]?.name, '\n');

    // Test 10: Task Statistics
    console.log('🔟 Testing Task Statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/tasks/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Task stats retrieved');
    console.log('✅ Total tasks:', statsResponse.data.total);
    console.log('✅ Completed tasks:', statsResponse.data.completed, '\n');

    console.log('🎉 All basic API tests passed!');

  } catch (error) {
    console.error('❌ API Test failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data || error.message);
    if (error.response?.data?.errors) {
      console.error('Validation errors:', error.response.data.errors);
    }
  }
}

testAPI();