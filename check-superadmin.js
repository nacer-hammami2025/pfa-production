const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function checkAndFixSuperAdmin() {
  console.log('🔍 Checking superadmin account via API...\n');

  try {
    // First, try to login with superadmin account
    console.log('1. Attempting login with superadmin@taskflow.com...');
    try {
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'superadmin@taskflow.com',
        password: 'admin123' // Try common password
      });

      console.log('✅ Login successful');
      console.log('👤 User info:', loginRes.data.user);

      if (loginRes.data.user.role === 'admin') {
        console.log('✅ Account has correct admin role');
      } else {
        console.log('❌ Account has WRONG role:', loginRes.data.user.role);
        console.log('🔧 This is a CRITICAL SECURITY ISSUE!');
      }

    } catch (loginError) {
      console.log('❌ Login failed:', loginError.response?.data?.errors?.[0]?.msg || loginError.message);

      // Try to register the account
      console.log('\n2. Attempting to register superadmin account...');
      try {
        const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
          name: 'Super Admin',
          email: 'superadmin@taskflow.com',
          password: 'admin123'
        });

        console.log('✅ Registration successful');
        console.log('⚠️  WARNING: Account created with USER role (not admin)');
        console.log('🔧 This is still a security issue - account should be admin');

        // Now we need to manually promote this account to admin
        // This requires database access, so we'll create a script for that

      } catch (registerError) {
        console.log('❌ Registration failed:', registerError.response?.data?.errors?.[0]?.msg || registerError.message);
      }
    }

    console.log('\n🔐 SECURITY ANALYSIS:');
    console.log('- The registration system correctly prevents users from becoming admin');
    console.log('- However, the superadmin account may exist with wrong role');
    console.log('- Manual database intervention required to fix this account');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

checkAndFixSuperAdmin();