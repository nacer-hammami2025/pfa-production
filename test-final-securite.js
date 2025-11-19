/**
 * Test de sécurité complet - Créer utilisateur puis tester l'escalade de privilège
 */

const axios = require('axios');

async function testSecuriteComplete() {
  console.log('🛡️  TEST DE SÉCURITÉ COMPLET');
  console.log('============================\n');

  const timestamp = Date.now();
  const testUser = {
    name: 'Security Test User',
    email: `security-test-${timestamp}@example.com`,
    password: 'TestPass123!'
  };

  try {
    // 1. Créer un utilisateur normal
    console.log('1️⃣ Création d\'un utilisateur de test...');
    console.log(`   Email: ${testUser.email}`);
    
    const registerResponse = await axios.post('https://nacer-dev.me/api/auth/register', testUser, {
      timeout: 10000
    });

    if (registerResponse.status === 201) {
      console.log('   ✅ Utilisateur créé avec succès');
      console.log(`   Rôle assigné: ${registerResponse.data.user.role}`);
    } else {
      console.log('   ❌ Échec de création');
      return;
    }

    // 2. Test 1: Login normal (doit fonctionner)
    console.log('\n2️⃣ Test de login normal...');
    
    try {
      const normalLoginResponse = await axios.post('https://nacer-dev.me/api/auth/login', {
        email: testUser.email,
        password: testUser.password
      }, { timeout: 10000 });

      if (normalLoginResponse.status === 200) {
        console.log('   ✅ Login normal réussi');
        console.log(`   Rôle de l'utilisateur: ${normalLoginResponse.data.user.role}`);
        console.log(`   Token obtenu: ${normalLoginResponse.data.token ? 'OUI' : 'NON'}`);
      }
    } catch (error) {
      console.log('   ❌ Login normal échoué:', error.response?.data?.message || error.message);
    }

    // 3. Test 2: Tentative d'escalade de privilège (DOIT échouer)
    console.log('\n3️⃣ Test d\'escalade de privilège (CRITIQUE)...');
    console.log('   Tentative: utilisateur normal → admin');
    
    try {
      const adminLoginResponse = await axios.post('https://nacer-dev.me/api/auth/login', {
        email: testUser.email,
        password: testUser.password,
        requestedRole: 'admin'  // TENTATIVE D'ESCALADE
      }, { 
        timeout: 10000,
        validateStatus: (status) => status < 500
      });

      // Analyser la réponse
      console.log(`   Status reçu: ${adminLoginResponse.status}`);

      if (adminLoginResponse.status === 403) {
        console.log('   ✅ SÉCURITÉ FONCTIONNELLE !');
        console.log('   🛡️ Escalade de privilège BLOQUÉE');
        console.log('   Message:', adminLoginResponse.data.errors?.[0]?.msg);
        
        return 'SECURE';

      } else if (adminLoginResponse.status === 200) {
        console.log('   ❌ FAILLE DE SÉCURITÉ CRITIQUE !');
        console.log('   🚨 L\'utilisateur a obtenu un accès admin !');
        console.log(`   Token admin obtenu: ${adminLoginResponse.data.token ? 'OUI' : 'NON'}`);
        console.log(`   Rôle dans la réponse: ${adminLoginResponse.data.user?.role}`);
        
        return 'VULNERABLE';

      } else {
        console.log(`   ⚠️ Status inattendu: ${adminLoginResponse.status}`);
        console.log('   Réponse:', adminLoginResponse.data);
        
        return 'UNKNOWN';
      }

    } catch (error) {
      if (error.response?.status === 403) {
        console.log('   ✅ SÉCURITÉ FONCTIONNELLE !');
        console.log('   🛡️ Erreur 403 - Escalade bloquée');
        console.log('   Message:', error.response?.data?.errors?.[0]?.msg);
        
        return 'SECURE';
        
      } else {
        console.log('   ❌ Erreur lors du test:', error.message);
        console.log(`   Status: ${error.response?.status || 'N/A'}`);
        
        return 'ERROR';
      }
    }

  } catch (error) {
    console.log('❌ Erreur générale:', error.message);
    if (error.response?.status === 400) {
      console.log('   Détails:', error.response.data);
    }
    return 'ERROR';
  }
}

// Exécuter le test et afficher le résultat final
testSecuriteComplete()
  .then(resultat => {
    console.log('\n🎯 RÉSULTAT FINAL DE SÉCURITÉ');
    console.log('===============================');

    switch (resultat) {
      case 'SECURE':
        console.log('✅ SYSTÈME SÉCURISÉ');
        console.log('   ✓ Les utilisateurs normaux ne peuvent pas devenir admin');
        console.log('   ✓ Les corrections de sécurité fonctionnent correctement');
        console.log('   ✓ Votre application est maintenant protégée !');
        break;

      case 'VULNERABLE':
        console.log('❌ FAILLE DE SÉCURITÉ ACTIVE');
        console.log('   ✗ Les utilisateurs peuvent encore s\'authentifier comme admin');
        console.log('   ✗ Correction urgente nécessaire');
        console.log('   ✗ Votre application est vulnérable !');
        break;

      case 'ERROR':
        console.log('⚠️ ERREUR DANS LES TESTS');
        console.log('   • Impossible de conclure sur la sécurité');
        console.log('   • Vérifier la connectivité et retenter');
        break;

      default:
        console.log('⚠️ RÉSULTAT INCERTAIN');
        console.log('   • Test incomplet');
        console.log('   • Retenter le test');
    }

    console.log('\n📌 Note: Ce test crée un utilisateur temporaire pour les tests de sécurité');
  })
  .catch(error => {
    console.error('\n💥 ERREUR CRITIQUE DANS LE TEST:', error.message);
  });