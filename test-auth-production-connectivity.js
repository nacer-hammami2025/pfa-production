/**
 * Test de l'AuthService en production
 * Vérifie la connectivité et le bon fonctionnement de l'authentification
 */

const axios = require('axios');

const FRONTEND_URL = 'https://nacer-dev.me';
const BACKEND_URL = 'https://pfa-backend-production.onrender.com';

console.log('🔍 Test de connectivité AuthService Production');
console.log('=====================================\n');

async function testBackendConnectivity() {
  console.log('1️⃣ Test de connectivité Backend...');
  try {
    // Test avec différentes routes possibles
    let response;
    try {
      response = await axios.get(`${BACKEND_URL}/health`, { timeout: 10000 });
    } catch (e1) {
      try {
        response = await axios.get(`${BACKEND_URL}/api/health`, { timeout: 10000 });
      } catch (e2) {
        response = await axios.get(`${BACKEND_URL}/`, { timeout: 10000 });
      }
    }
    console.log('✅ Backend accessible:', response.status);
    return true;
  } catch (error) {
    console.log('❌ Backend inaccessible:', error.message);
    console.log('   Code:', error.code);
    console.log('   Status:', error.response?.status);
    return false;
  }
}

async function testAuthMeEndpoint() {
  console.log('\n2️⃣ Test de l\'endpoint /auth/me...');
  try {
    const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
      timeout: 10000,
      headers: {
        'Authorization': 'Bearer invalid_token_for_test'
      }
    });
    console.log('⚠️ Réponse inattendue (devrait être 401):', response.status);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Endpoint /auth/me fonctionne (401 attendu sans token valide)');
      return true;
    } else {
      console.log('❌ Erreur endpoint /auth/me:', error.message);
      console.log('   Status:', error.response?.status);
      return false;
    }
  }
}

async function testFrontendConnectivity() {
  console.log('\n3️⃣ Test de connectivité Frontend...');
  try {
    const response = await axios.get(FRONTEND_URL, {
      timeout: 10000
    });
    console.log('✅ Frontend accessible:', response.status);
    return true;
  } catch (error) {
    console.log('❌ Frontend inaccessible:', error.message);
    return false;
  }
}

async function runTests() {
  const results = {
    backend: await testBackendConnectivity(),
    authEndpoint: await testAuthMeEndpoint(), 
    frontend: await testFrontendConnectivity()
  };
  
  console.log('\n📊 RÉSULTATS DU TEST:');
  console.log('===================');
  console.log(`Backend:      ${results.backend ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Auth /me:     ${results.authEndpoint ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`Frontend:     ${results.frontend ? '✅ OK' : '❌ ÉCHEC'}`);
  
  const allGood = Object.values(results).every(r => r);
  console.log(`\nÉtat global: ${allGood ? '✅ TOUS LES SERVICES FONCTIONNENT' : '⚠️ PROBLÈMES DÉTECTÉS'}`);
  
  if (!results.backend) {
    console.log('\n💡 SOLUTION BACKEND:');
    console.log('- Vérifier que le service Render backend est démarré');
    console.log('- Vérifier les variables d\'environnement');
    console.log('- Consulter les logs Render du backend');
  }
  
  if (!results.frontend) {
    console.log('\n💡 SOLUTION FRONTEND:');
    console.log('- Vérifier que le déploiement frontend est terminé');
    console.log('- Vérifier la configuration DNS');
  }
}

runTests().catch(console.error);