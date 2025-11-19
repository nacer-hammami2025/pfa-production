/**
 * Test de découverte du backend - essaie différentes URLs possibles
 */

const axios = require('axios');

const POSSIBLE_BACKENDS = [
  'https://pfa-backend-production.onrender.com',
  'https://pfa-production.onrender.com', 
  'https://nacer-backend.onrender.com',
  'https://pfa-backend.onrender.com',
  'https://nacer-dev.me/api',  // Si le backend est derrière le même domaine
  'https://api.nacer-dev.me'
];

async function testBackendUrl(url) {
  console.log(`🔍 Test de ${url}...`);
  try {
    // Test de la racine
    let response = await axios.get(url, { 
      timeout: 5000,
      validateStatus: (status) => status < 500 // Accepter 404, 401, etc.
    });
    console.log(`   Racine (${url}): ${response.status} ${response.statusText}`);
    
    // Test des routes d'API communes
    const routes = ['/api', '/api/auth', '/api/health', '/health'];
    for (const route of routes) {
      try {
        const testUrl = url + route;
        const apiResponse = await axios.get(testUrl, { 
          timeout: 3000,
          validateStatus: (status) => status < 500
        });
        console.log(`   ✅ ${route}: ${apiResponse.status} ${apiResponse.statusText}`);
      } catch (e) {
        if (e.code !== 'ECONNABORTED') {
          console.log(`   ❌ ${route}: ${e.response?.status || e.code}`);
        }
      }
    }
    
    return true;
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      console.log(`   ❌ Domaine introuvable`);
    } else if (error.code === 'ECONNABORTED') {
      console.log(`   ⏱️ Timeout`);
    } else {
      console.log(`   ❌ ${error.response?.status || error.code}: ${error.message}`);
    }
    return false;
  }
}

async function discoverBackend() {
  console.log('🔍 DÉCOUVERTE DU BACKEND PFA');
  console.log('============================\n');
  
  for (const url of POSSIBLE_BACKENDS) {
    await testBackendUrl(url);
    console.log(''); // Ligne vide entre les tests
  }
  
  console.log('\n💡 SOLUTIONS POSSIBLES:');
  console.log('1. Le backend n\'est pas encore déployé sur Render');
  console.log('2. L\'URL du backend est différente');
  console.log('3. Le backend est sur un autre service (Railway, Vercel, etc.)');
  console.log('4. Le backend nécessite une configuration CORS');
  console.log('5. Le domaine nacer-dev.me pointe vers un proxy qui redirige vers le backend');
}

discoverBackend().catch(console.error);