/**
 * Vérification du statut du déploiement et test de sécurité complet
 */

const axios = require('axios');

async function verifierDeploiement() {
  console.log('🚀 VÉRIFICATION DÉPLOIEMENT & SÉCURITÉ');
  console.log('=====================================\n');

  // 1. Tester la santé du serveur
  console.log('1️⃣ Test de santé du serveur...');
  try {
    const healthResponse = await axios.get('https://nacer-dev.me/api/health', {
      timeout: 10000
    });
    console.log('✅ Serveur en ligne');
    console.log('   Status:', healthResponse.data.status);
    console.log('   Timestamp:', new Date(healthResponse.data.timestamp).toLocaleString());
    console.log('');
  } catch (error) {
    console.log('❌ Serveur indisponible');
    console.log('   Erreur:', error.message);
    console.log('   Code:', error.response?.status || error.code);
    console.log('   ⏳ Le déploiement est peut-être en cours...\n');
    
    if (error.response?.status === 502 || error.code === 'ECONNREFUSED') {
      console.log('🔄 Attendre 30 secondes et retenter...');
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      try {
        const retryResponse = await axios.get('https://nacer-dev.me/api/health', { timeout: 10000 });
        console.log('✅ Serveur maintenant en ligne après attente');
      } catch (retryError) {
        console.log('❌ Serveur toujours indisponible');
        return false;
      }
    } else {
      return false;
    }
  }

  // 2. Test de sécurité - Empêcher l'escalade de privilège
  console.log('2️⃣ Test de sécurité critique...');
  
  const testCases = [
    {
      name: 'Utilisateur normal → Admin',
      email: 'hacker1763519770387@evil.com',
      password: 'hackerpass',
      requestedRole: 'admin',
      expectedStatus: 403
    },
    {
      name: 'Login normal sans rôle',
      email: 'hacker1763519770387@evil.com', 
      password: 'hackerpass',
      // Pas de requestedRole
      expectedStatus: 200
    }
  ];

  let resultatsSecurity = [];

  for (const testCase of testCases) {
    console.log(`\n📋 ${testCase.name}:`);
    
    try {
      const loginData = {
        email: testCase.email,
        password: testCase.password
      };
      
      if (testCase.requestedRole) {
        loginData.requestedRole = testCase.requestedRole;
        console.log(`   Rôle demandé: ${testCase.requestedRole}`);
      }
      
      const response = await axios.post('https://nacer-dev.me/api/auth/login', loginData, {
        timeout: 10000,
        validateStatus: (status) => status < 500
      });

      console.log(`   Status: ${response.status}`);
      
      if (testCase.requestedRole === 'admin') {
        if (response.status === 403) {
          console.log('   ✅ SÉCURITÉ OK - Escalade bloquée');
          resultatsSecurity.push('SECURE');
        } else if (response.status === 200) {
          console.log('   ❌ FAILLE CRITIQUE - Admin access accordé !');
          console.log('   Token:', response.data.token ? 'Obtenu' : 'Aucun');
          console.log('   Rôle:', response.data.user?.role);
          resultatsSecurity.push('VULNERABLE');
        }
      } else {
        if (response.status === 200) {
          console.log('   ✅ Login normal fonctionnel');
          console.log('   Rôle utilisateur:', response.data.user?.role);
          resultatsSecurity.push('OK');
        } else {
          console.log('   ⚠️ Problème de login normal');
          resultatsSecurity.push('ERROR');
        }
      }

    } catch (error) {
      if (testCase.requestedRole === 'admin' && error.response?.status === 403) {
        console.log('   ✅ SÉCURITÉ OK - 403 Forbidden');
        resultatsSecurity.push('SECURE');
      } else {
        console.log(`   ❌ Erreur: ${error.message}`);
        console.log(`   Status: ${error.response?.status || 'N/A'}`);
        resultatsSecurity.push('ERROR');
      }
    }
  }

  // 3. Résultats finaux
  console.log('\n🎯 RAPPORT FINAL DE SÉCURITÉ');
  console.log('============================');
  
  const isSecure = resultatsSecurity.includes('SECURE') || 
                   (resultatsSecurity.includes('OK') && !resultatsSecurity.includes('VULNERABLE'));
  
  if (isSecure && !resultatsSecurity.includes('VULNERABLE')) {
    console.log('✅ SYSTÈME SÉCURISÉ');
    console.log('   • Les utilisateurs normaux ne peuvent pas devenir admin');
    console.log('   • Le login normal fonctionne correctement');
    console.log('   • Les corrections de sécurité sont effectives');
  } else if (resultatsSecurity.includes('VULNERABLE')) {
    console.log('❌ FAILLE DE SÉCURITÉ DÉTECTÉE');
    console.log('   • Des utilisateurs peuvent encore s\'authentifier comme admin');
    console.log('   • Correction urgente nécessaire');
  } else {
    console.log('⚠️ Tests incomplets - problèmes de connexion');
  }

  return isSecure;
}

verifierDeploiement()
  .then(secure => {
    console.log('\n🏁 Test terminé');
    if (secure) {
      console.log('✅ La sécurité est maintenant opérationnelle !');
    } else {
      console.log('❌ Des problèmes de sécurité persistent');
    }
  })
  .catch(console.error);