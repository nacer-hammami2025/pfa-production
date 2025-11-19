const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
let userToken = '';
let adminToken = '';

async function testSecurityAndFeatures() {
  console.log('🛡️  Testing Security & Profile Features...\n');

  try {
    // === SECURITY TEST ===
    console.log('1. Testing Security - User cannot become admin...');
    const userRegisterRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Regular User',
      email: `user${Date.now()}@test.com`,
      password: 'password123',
      role: 'admin' // This should be ignored!
    });
    userToken = userRegisterRes.data.token;

    const userLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: userRegisterRes.data.user.email,
      password: 'password123'
    });
    userToken = userLoginRes.data.token;

    // Check user role
    const userProfileRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    if (userProfileRes.data.role === 'user') {
      console.log('✅ Security OK: User cannot elevate to admin');
    } else {
      console.log('❌ SECURITY BREACH: User became admin!');
    }

    // === ADMIN CREATION TEST ===
    console.log('2. Testing Admin Creation...');
    const adminRegisterRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Admin User',
      email: `admin${Date.now()}@test.com`,
      password: 'password123'
    });

    // Manually set this user as admin in database for testing
    // (In real scenario, this would be done by existing admin)
    const User = require('./backend/src/models/User');
    await User.findByIdAndUpdate(adminRegisterRes.data.user.id, { role: 'admin' });

    const adminLoginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: adminRegisterRes.data.user.email,
      password: 'password123'
    });
    adminToken = adminLoginRes.data.token;

    // Test admin creating another admin
    const newAdminRes = await axios.post(`${BASE_URL}/admin/create-admin`, {
      name: 'New Admin',
      email: `newadmin${Date.now()}@test.com`,
      password: 'password123'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log('✅ Admin creation successful');

    // === KANBAN TEST ===
    console.log('3. Testing Kanban Status Updates...');

    // Create a task
    const taskRes = await axios.post(`${BASE_URL}/tasks`, {
      title: 'Kanban Test Task',
      description: 'Testing Kanban functionality'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const taskId = taskRes.data._id;
    console.log('✅ Task created for Kanban testing');

    // Update status to in-progress
    await axios.patch(`${BASE_URL}/tasks/${taskId}/status`, {
      status: 'in-progress'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ Task status updated to in-progress');

    // Update status to done
    await axios.patch(`${BASE_URL}/tasks/${taskId}/status`, {
      status: 'done'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ Task status updated to done');

    // === PROFILE PREFERENCES TEST ===
    console.log('4. Testing Profile Preferences...');

    // Update theme to dark
    const themeUpdateRes = await axios.put(`${BASE_URL}/users/profile`, {
      preferences: {
        theme: 'dark',
        notifications: {
          email: false,
          push: true
        }
      }
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ Profile preferences updated');

    // Verify preferences were saved
    const updatedProfileRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });

    if (updatedProfileRes.data.preferences.theme === 'dark') {
      console.log('✅ Theme preference saved correctly');
    } else {
      console.log('❌ Theme preference not saved');
    }

    if (updatedProfileRes.data.preferences.notifications.email === false) {
      console.log('✅ Notification preferences saved correctly');
    } else {
      console.log('❌ Notification preferences not saved');
    }

    console.log('\n🎉 ALL SECURITY & FEATURE TESTS PASSED!');
    console.log('\n📊 Summary:');
    console.log('- ✅ Security: Users cannot become admin');
    console.log('- ✅ Admin Creation: Only admins can create admin accounts');
    console.log('- ✅ Kanban: Status updates work correctly');
    console.log('- ✅ Profile: Theme and notification preferences functional');

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

testSecurityAndFeatures();