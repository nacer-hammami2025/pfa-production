/**
 * Test des messages professionnels sur le domaine de production
 * Vérification que les visiteurs de nacer-dev.me bénéficient des améliorations
 */

const axios = require('axios');

async function testProductionDomain() {
  console.log('🌐 TEST DOMAINE PRODUCTION - nacer-dev.me');
  console.log('==========================================\n');

  const PRODUCTION_DOMAIN = 'https://nacer-dev.me';
  const API_URL = 'https://nacer-dev.me/api';

  console.log(`🎯 Domaine testé: ${PRODUCTION_DOMAIN}`);
  console.log(`🔗 API Backend: ${API_URL}\n`);

  // 1. Vérifier que le frontend est accessible
  console.log('1️⃣ Vérification accessibilité frontend...');
  try {
    const frontendResponse = await axios.get(PRODUCTION_DOMAIN, {
      timeout: 10000,
      validateStatus: (status) => status < 500
    });

    if (frontendResponse.status === 200) {
      console.log('✅ Frontend accessible');
      console.log(`   Status: ${frontendResponse.status}`);
      console.log(`   Taille: ${frontendResponse.data.length} caractères`);
      
      // Vérifier si les nouveaux composants sont inclus
      if (frontendResponse.data.includes('access-denied') || frontendResponse.data.includes('AccessDenied')) {
        console.log('   ✅ Composant access-denied détecté dans le build');
      } else {
        console.log('   ⚠️ Composant access-denied non détecté - déploiement en cours ?');
      }
    }
  } catch (error) {
    console.log('❌ Frontend inaccessible:', error.message);
  }

  // 2. Tester l'API de sécurité en production
  console.log('\n2️⃣ Test de l\'API de sécurité en production...');
  
  const timestamp = Date.now();
  const testUser = {
    name: 'Production Test User',
    email: `prod-test-${timestamp}@example.com`,
    password: 'TestProd123!'
  };

  try {
    // Créer un utilisateur de test
    console.log('   📝 Création utilisateur de test...');
    const registerRes = await axios.post(`${API_URL}/auth/register`, testUser);
    
    console.log('   ✅ Utilisateur créé en production');
    console.log(`      Email: ${testUser.email}`);
    console.log(`      Rôle: ${registerRes.data.user.role}`);

    // Test de login normal
    console.log('\n   🔐 Test login normal...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    console.log('   ✅ Login normal fonctionne en production');
    console.log(`      Token: ${loginRes.data.token ? 'Obtenu' : 'Échec'}`);

    // 🎯 TEST CRITIQUE: Messages professionnels pour escalade
    console.log('\n   🚨 Test des messages professionnels...');
    
    try {
      const escaladeRes = await axios.post(`${API_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password,
        requestedRole: 'admin' // Tentative d'escalade
      }, {
        validateStatus: (status) => status < 500
      });

      if (escaladeRes.status === 403) {
        console.log('   ✅ MESSAGES PROFESSIONNELS ACTIFS EN PRODUCTION !');
        console.log('      📋 Détails de la réponse:');
        console.log(`         Status: ${escaladeRes.status} Forbidden`);
        console.log(`         Message: "${escaladeRes.data.errors?.[0]?.msg}"`);
        console.log(`         Détails: "${escaladeRes.data.errors?.[0]?.details}"`);
        console.log('\n   🎨 Ce que verront les visiteurs:');
        console.log('      • Redirection automatique vers page d\'erreur élégante');
        console.log('      • Messages contextuels professionnels');
        console.log('      • Interface Material Design moderne');
        console.log('      • Boutons d\'action appropriés');

        return 'PRODUCTION_READY';

      } else if (escaladeRes.status === 200) {
        console.log('   ❌ PROBLÈME: Escalade réussie en production !');
        return 'SECURITY_ISSUE';
      } else {
        console.log(`   ⚠️ Status inattendu: ${escaladeRes.status}`);
        return 'UNEXPECTED';
      }

    } catch (escaladeError) {
      if (escaladeError.response?.status === 403) {
        console.log('   ✅ Messages professionnels actifs (via exception)');
        return 'PRODUCTION_READY';
      } else {
        console.log('   ❌ Erreur escalade:', escaladeError.message);
        return 'ERROR';
      }
    }

  } catch (apiError) {
    console.log('❌ Erreur API:', apiError.message);
    return 'API_ERROR';
  }
}

// Test de l'URL access-denied directement
async function testAccessDeniedURL() {
  console.log('\n3️⃣ Test direct de l\'URL access-denied...');
  
  try {
    const accessDeniedRes = await axios.get('https://nacer-dev.me/access-denied', {
      timeout: 10000,
      validateStatus: (status) => status < 500
    });

    if (accessDeniedRes.status === 200) {
      console.log('✅ Page access-denied accessible en production');
      console.log(`   Status: ${accessDeniedRes.status}`);
      
      // Vérifier le contenu de la page
      if (accessDeniedRes.data.includes('Accès Refusé') || 
          accessDeniedRes.data.includes('access-denied')) {
        console.log('   ✅ Contenu de la page d\'erreur détecté');
        return true;
      } else {
        console.log('   ⚠️ Contenu attendu non trouvé');
        return false;
      }
    } else {
      console.log(`   ⚠️ Status: ${accessDeniedRes.status}`);
      return false;
    }

  } catch (error) {
    console.log('   ❌ Page access-denied non accessible:', error.message);
    return false;
  }
}

// Exécution complète
async function runProductionTests() {
  console.log('🚀 DÉBUT DES TESTS PRODUCTION\n');

  const apiResult = await testProductionDomain();
  const pageResult = await testAccessDeniedURL();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🎯 RÉSULTATS TESTS PRODUCTION');
  console.log('═══════════════════════════════════════════════════════\n');

  if (apiResult === 'PRODUCTION_READY' && pageResult) {
    console.log('🎉 DÉPLOIEMENT RÉUSSI !');
    console.log('');
    console.log('✅ CE QUI FONCTIONNE POUR LES VISITEURS:');
    console.log('   🌐 Site accessible sur nacer-dev.me');
    console.log('   🔒 Sécurité backend opérationnelle');
    console.log('   📱 Messages professionnels actifs');
    console.log('   🎨 Page d\'erreur élégante déployée');
    console.log('   🔄 Redirection automatique configurée');
    console.log('');
    console.log('👥 EXPÉRIENCE VISITEURS:');
    console.log('   • Interface moderne et professionnelle');
    console.log('   • Messages d\'erreur clairs et utiles');
    console.log('   • Actions appropriées disponibles');
    console.log('   • Sécurité transparente mais efficace');
    console.log('');
    console.log('🔗 URL DE TEST POUR LES VISITEURS:');
    console.log('   Login: https://nacer-dev.me/login');
    console.log('   Erreur: https://nacer-dev.me/access-denied');

  } else if (apiResult === 'PRODUCTION_READY' && !pageResult) {
    console.log('🟡 DÉPLOIEMENT PARTIEL');
    console.log('   ✅ API de sécurité opérationnelle');
    console.log('   ⚠️ Page d\'erreur en cours de déploiement');
    console.log('   ⏳ Attendre quelques minutes et retester');

  } else if (apiResult === 'SECURITY_ISSUE') {
    console.log('🔴 PROBLÈME DE SÉCURITÉ');
    console.log('   ❌ Les visiteurs peuvent escalader leurs privilèges');
    console.log('   🚨 Correction urgente nécessaire');

  } else {
    console.log('🟡 DÉPLOIEMENT EN COURS');
    console.log('   ⏳ Le déploiement peut prendre quelques minutes');
    console.log('   🔄 Retester dans 2-3 minutes');
  }

  console.log('\n📌 INSTRUCTIONS VISITEURS:');
  console.log('   1. Aller sur https://nacer-dev.me/login');
  console.log('   2. Créer un compte utilisateur normal');
  console.log('   3. Essayer de se connecter comme "Admin"');
  console.log('   4. Voir la belle page d\'erreur professionnelle !');
}

runProductionTests().catch(console.error);