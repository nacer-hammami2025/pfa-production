const axios = require('axios');

async function testBackendResponse() {
  console.log('🔍 TEST DIRECT DU BACKEND nacer-dev.me\n');
  console.log('Backend URL:', 'https://nacer-dev.me/api/auth/login');
  
  try {
    // Test avec rawia@gmail.com essayant de se connecter comme admin
    const response = await axios.post(
      'https://nacer-dev.me/api/auth/login',
      {
        email: 'test-pro-1763521811193@example.com',
        password: 'TestPass123!',
        requestedRole: 'admin'  // ← User essaie de se connecter comme admin
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        validateStatus: () => true // Accepter tous les status codes
      }
    );

    console.log('\n📊 RÉPONSE DU BACKEND:');
    console.log('Status Code:', response.status);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    console.log('\nBody:', JSON.stringify(response.data, null, 2));

    if (response.status === 403) {
      console.log('\n✅ BACKEND FONCTIONNE CORRECTEMENT!');
      console.log('Message professionnel:', response.data.errors?.[0]?.msg);
      console.log('Détails:', response.data.errors?.[0]?.details);
    } else {
      console.log('\n⚠️ Status inattendu:', response.status);
    }

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testBackendResponse();
