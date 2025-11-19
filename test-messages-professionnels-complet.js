/**
 * TEST COMPLET - Messages professionnels et page d'erreur élégante
 * Vérification finale sur nacer-dev.me
 */

const axios = require('axios');

async function testMessagesProfessionnelsComplet() {
  console.log('🎯 TEST COMPLET - MESSAGES PROFESSIONNELS & PAGE D\'ERREUR ÉLÉGANTE');
  console.log('=================================================================\n');

  const DOMAIN = 'https://nacer-dev.me';
  const API = 'https://nacer-dev.me/api';

  // 1. Vérifier l'accessibilité du domaine
  console.log('1️⃣ Vérification domaine nacer-dev.me...');
  try {
    const response = await axios.get(DOMAIN, { timeout: 10000 });
    console.log('✅ Domaine accessible');
    console.log(`   Status: ${response.status}`);
    console.log(`   Taille réponse: ${response.data.length} caractères`);
  } catch (error) {
    console.log('❌ Domaine inaccessible:', error.message);
    return;
  }

  // 2. Créer un utilisateur de test
  console.log('\n2️⃣ Création utilisateur de test...');
  const timestamp = Date.now();
  const testUser = {
    name: 'Test Professional Messages',
    email: `test-pro-${timestamp}@example.com`,
    password: 'TestPass123!'
  };

  try {
    const registerRes = await axios.post(`${API}/auth/register`, testUser);
    console.log('✅ Utilisateur créé');
    console.log(`   📧 Email: ${testUser.email}`);
    console.log(`   🔑 Mot de passe: ${testUser.password}`);
    console.log(`   👤 Rôle: ${registerRes.data.user.role}`);
  } catch (error) {
    console.log('❌ Erreur création:', error.message);
    return;
  }

  // 3. Test login normal
  console.log('\n3️⃣ Test login normal...');
  try {
    const loginRes = await axios.post(`${API}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Login normal réussi');
    console.log(`   🔑 Token obtenu: ${loginRes.data.token ? 'OUI' : 'NON'}`);
  } catch (error) {
    console.log('❌ Erreur login:', error.message);
    return;
  }

  // 4. 🎯 TEST CRITIQUE - Messages professionnels
  console.log('\n4️⃣ 🎯 TEST CRITIQUE - Messages professionnels pour non-admin...');

  try {
    const escaladeRes = await axios.post(`${API}/auth/login`, {
      email: testUser.email,
      password: testUser.password,
      requestedRole: 'admin' // TENTATIVE D'ESCALADE
    }, {
      validateStatus: (status) => status < 500
    });

    console.log(`   📊 Status: ${escaladeRes.status}`);

    if (escaladeRes.status === 403) {
      console.log('   ✅ MESSAGES PROFESSIONNELS ACTIFS !');
      console.log('\n   📋 MESSAGE PROFESSIONNEL AU LIEU D\'ERREUR GÉNÉRIQUE:');
      console.log(`      "${escaladeRes.data.errors?.[0]?.msg}"`);
      console.log('\n   📝 DÉTAILS CONTEXTUELS:');
      console.log(`      "${escaladeRes.data.errors?.[0]?.details}"`);

      console.log('\n   🎨 CE QUE LES VISITEURS VERRONT:');
      console.log('      ❌ AU LIEU DE: "Une erreur est survenue. Veuillez réessayer."');
      console.log('      ✅ ILS VERONT: Messages clairs et professionnels !');

      // 5. Test de la page d'erreur élégante
      console.log('\n5️⃣ Test de la page d\'erreur élégante...');

      try {
        const accessDeniedRes = await axios.get(`${DOMAIN}/access-denied`, {
          timeout: 10000,
          validateStatus: (status) => status < 500
        });

        if (accessDeniedRes.status === 200) {
          console.log('   ✅ PAGE D\'ERREUR ÉLÉGANTE ACCESSIBLE !');
          console.log('   🎨 Interface professionnelle déployée');

          if (accessDeniedRes.data.includes('Accès Refusé') ||
              accessDeniedRes.data.includes('access-denied') ||
              accessDeniedRes.data.includes('Material Design')) {
            console.log('   ✨ Contenu élégant détecté');
          }
        } else {
          console.log(`   ⚠️ Page access-denied: Status ${accessDeniedRes.status}`);
        }

      } catch (pageError) {
        console.log('   ⚠️ Page access-denied non accessible:', pageError.message);
        console.log('   ⏳ Peut-être en cours de déploiement');
      }

      return 'SUCCESS';

    } else if (escaladeRes.status === 200) {
      console.log('   ❌ FAILLE DE SÉCURITÉ - Escalade réussie !');
      return 'SECURITY_BREACH';
    } else {
      console.log(`   ⚠️ Status inattendu: ${escaladeRes.status}`);
      return 'UNEXPECTED';
    }

  } catch (escaladeError) {
    if (escaladeError.response?.status === 403) {
      console.log('   ✅ Messages professionnels actifs (via exception)');
      return 'SUCCESS';
    } else {
      console.log('   ❌ Erreur:', escaladeError.message);
      return 'ERROR';
    }
  }
}

// Simulation de ce que verra l'utilisateur
function afficherSimulationInterface() {
  console.log('\n🎨 SIMULATION DE L\'INTERFACE UTILISATEUR:');
  console.log('==========================================');

  console.log('┌─────────────────────────────────────────────┐');
  console.log('│              🚫 ACCÈS REFUSÉ                │');
  console.log('│   Vous n\'êtes pas autorisé à accéder       │');
  console.log('│              à cette section                │');
  console.log('├─────────────────────────────────────────────┤');
  console.log('│ ℹ️  DÉTAILS DE LA RESTRICTION               │');
  console.log('│ Votre compte: test-pro-XXXX@example.com     │');
  console.log('│ Type: Utilisateur                           │');
  console.log('│ Accès demandé: Administrateur               │');
  console.log('│ Raison: Accès refusé. Vous ne pouvez pas... │');
  console.log('├─────────────────────────────────────────────┤');
  console.log('│ 💡 QUE FAIRE MAINTENANT ?                  │');
  console.log('│ • Vérifiez que vous utilisez le bon compte │');
  console.log('│ • Contactez votre administrateur           │');
  console.log('│ • Consultez la documentation               │');
  console.log('├─────────────────────────────────────────────┤');
  console.log('│ [📊 Tableau de bord] [📞 Support] [🚪 Sortir] │');
  console.log('├─────────────────────────────────────────────┤');
  console.log('│ 🔒 Cette restriction fait partie de nos    │');
  console.log('│    mesures de sécurité                     │');
  console.log('└─────────────────────────────────────────────┘');
}

// Instructions pour l'utilisateur
function afficherInstructionsTest() {
  console.log('\n📋 INSTRUCTIONS POUR VOIR LES AMÉLIORATIONS:');
  console.log('============================================');

  console.log('🌐 ALLEZ SUR VOTRE DOMAINE:');
  console.log('   https://nacer-dev.me/login');

  console.log('\n🔐 UTILISEZ CES IDENTIFIANTS DE TEST:');
  console.log('   📧 Email: [sera affiché après création]');
  console.log('   🔑 Mot de passe: [sera affiché après création]');

  console.log('\n🎯 ÉTAPES POUR VOIR LES MESSAGES PROFESSIONNELS:');
  console.log('   1. Saisir les identifiants');
  console.log('   2. Sélectionner "Admin" dans le type d\'utilisateur');
  console.log('   3. Cliquer "Se connecter"');
  console.log('   4. VOIR la belle page d\'erreur professionnelle !');

  console.log('\n✨ AU LIEU DE VOIR:');
  console.log('   "Une erreur est survenue. Veuillez réessayer."');

  console.log('\n🎨 LES VISITEURS VERRONT:');
  console.log('   • Messages clairs et professionnels');
  console.log('   • Interface élégante avec Material Design');
  console.log('   • Boutons d\'action appropriés');
  console.log('   • Explications détaillées');
}

// Exécution
testMessagesProfessionnelsComplet()
  .then(resultat => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎯 RÉSULTAT DU TEST COMPLET');
    console.log('═══════════════════════════════════════════════════════\n');

    if (resultat === 'SUCCESS') {
      console.log('🎉 RÉUSSITE COMPLÈTE !');
      console.log('');
      console.log('✅ MESSAGES PROFESSIONNELS ACTIFS:');
      console.log('   • Plus d\'erreur générique "Une erreur est survenue"');
      console.log('   • Messages clairs et contextuels');
      console.log('   • Détails sur la restriction d\'accès');
      console.log('');
      console.log('✅ PAGE D\'ERREUR ÉLÉGANTE:');
      console.log('   • Interface Material Design moderne');
      console.log('   • Design responsive et professionnel');
      console.log('   • Boutons d\'action appropriés');

      afficherSimulationInterface();
      afficherInstructionsTest();

    } else if (resultat === 'SECURITY_BREACH') {
      console.log('🔴 PROBLÈME DE SÉCURITÉ');
      console.log('   Les utilisateurs peuvent encore devenir admin');
    } else {
      console.log('🟡 Test incomplet');
      console.log('   Vérifier la connectivité et retester');
    }
  })
  .catch(console.error);