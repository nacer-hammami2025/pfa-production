const axios = require('axios');

async function debugAuthMe() {
  try {
    console.log('🔍 DEBUG: Route /auth/me');
    
    const registerRes = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Debug User',
      email: `debug${Date.now()}@test.com`,
      password: 'password123'
    });
    console.log('✅ User registered');
    
    const token = registerRes.data.token;
    const meRes = await axios.get('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📋 Raw response data:');
    console.log(JSON.stringify(meRes.data, null, 2));
    
    console.log('\n🔍 Checking preferences:');
    console.log('Has user property:', !!meRes.data.user);
    console.log('Has preferences:', !!meRes.data.preferences || !!meRes.data.user?.preferences);
    
  } catch(e) {
    console.error('❌ Error:', e.response?.data || e.message);
  }
}

debugAuthMe();