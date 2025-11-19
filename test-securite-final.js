/**
 * Test immédiat de la sécurité - Vérifier que les utilisateurs ne peuvent pas se connecter comme admin
 */

const axios = require('axios');

async function testSecurityImmediat() {
  console.log('🔒 TEST SÉCURITÉ IMMÉDIAT');
  console.log('=========================\n');

  // Utiliser l'utilisateur hacker créé précédemment
  const testData = {
    email: 'hacker1763519770387@evil.com',
    password: 'hackerpass',
    requestedRole: 'admin' // Tentative d'escalade de privilège
  };

  console.log('🎯 Test: Utilisateur normal tente de se connecter comme admin');
  console.log(`   Email: ${testData.email}`);
  console.log(`   Rôle demandé: admin (mais utilisateur est "user" en base)`);
  console.log('');

  try {
    console.log('⏳ Tentative de connexion...');
    
    const response = await axios.post('https://nacer-dev.me/api/auth/login', testData, {
      timeout: 15000,
      validateStatus: (status) => status < 500 // Accepter tous les codes < 500
    });

    // Analyser la réponse
    console.log(`📊 Status Code: ${response.status}`);
    
    if (response.status === 403) {
      console.log('✅ SÉCURITÉ OK - Accès refusé !');
      console.log('   Message:', response.data.errors?.[0]?.msg);
      console.log('   🛡️ L\'escalade de privilège est bloquée');
      
      return 'SECURE';
      
    } else if (response.status === 200) {
      console.log('❌ FAILLE CRITIQUE - LOGIN RÉUSSI !');
      console.log('   🚨 L\'utilisateur a obtenu un accès admin');
      console.log('   Token reçu:', response.data.token ? 'OUI' : 'NON');
      console.log('   Rôle dans token:', response.data.user?.role);
      
      return 'VULNERABLE';
      
    } else {
      console.log(`⚠️  Status inattendu: ${response.status}`);
      console.log('   Réponse:', response.data);
      
      return 'UNKNOWN';
    }

  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ SÉCURITÉ OK - Erreur 403');
      console.log('   🛡️ Accès admin refusé comme attendu');
      return 'SECURE';
      
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Erreur de connexion au serveur');
      console.log('   Le serveur n\'est pas accessible');
      return 'CONNECTION_ERROR';
      
    } else {
      console.log('❌ Erreur inattendue:', error.message);
      console.log('   Status:', error.response?.status || 'N/A');
      return 'ERROR';
    }
  }
}

// Exécuter le test
testSecurityImmediat()
  .then(result => {
    console.log('\n🎯 RÉSULTAT FINAL:');
    
    switch(result) {
      case 'SECURE':
        console.log('✅ SYSTÈME SÉCURISÉ');
        console.log('   Les utilisateurs ne peuvent pas s\'authentifier comme admin');
        break;
        
      case 'VULNERABLE':
        console.log('❌ FAILLE DE SÉCURITÉ CRITIQUE');
        console.log('   Les utilisateurs peuvent encore s\'authentifier comme admin !');
        break;
        
      case 'CONNECTION_ERROR':
        console.log('⚠️  Impossible de tester - serveur inaccessible');
        break;
        
      default:
        console.log('⚠️  Test inconclusif');
    }
  })
  .catch(console.error);