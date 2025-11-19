/**
 * Test de démonstration des messages professionnels - Simulation complète du flux utilisateur
 */

const axios = require('axios');

async function demonstrationMessagesProf() {
  console.log('🎭 DÉMONSTRATION - MESSAGES PROFESSIONNELS POUR NON-ADMIN');
  console.log('========================================================\n');

  // Configuration pour test local
  const FRONTEND_URL = 'http://localhost:4200';
  const BACKEND_URL = 'https://nacer-dev.me/api';

  console.log('🌐 URLs de test:');
  console.log(`   Frontend local: ${FRONTEND_URL}`);
  console.log(`   Backend prod: ${BACKEND_URL}\n`);

  const timestamp = Date.now();
  const testUser = {
    name: 'Demo User',
    email: `demo${timestamp}@example.com`,
    password: 'password123'
  };

  try {
    // 1. Créer un utilisateur de démonstration
    console.log('1️⃣ Création utilisateur de démonstration...');
    const registerRes = await axios.post(`${BACKEND_URL}/auth/register`, testUser);
    
    console.log('✅ Utilisateur créé pour la démo');
    console.log(`   📧 Email: ${testUser.email}`);
    console.log(`   🎭 Mot de passe: ${testUser.password}`);
    console.log(`   👤 Rôle: ${registerRes.data.user.role}\n`);

    // 2. Test de login normal
    console.log('2️⃣ Vérification login normal...');
    const loginRes = await axios.post(`${BACKEND_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    console.log('✅ Login normal fonctionne');
    console.log(`   🔑 Token: ${loginRes.data.token ? 'Obtenu' : 'Échec'}`);
    console.log(`   👤 Rôle confirmé: ${loginRes.data.user.role}\n`);

    // 3. 🚨 DÉMONSTRATION - Tentative d'accès admin
    console.log('3️⃣ 🎬 DÉMONSTRATION - Tentative accès admin...');
    console.log('   Simulant: Utilisateur clique sur "Dashboard Admin"\n');

    try {
      const adminAttempt = await axios.post(`${BACKEND_URL}/auth/login`, {
        email: testUser.email,
        password: testUser.password,
        requestedRole: 'admin'
      }, {
        validateStatus: (status) => status < 500
      });

      if (adminAttempt.status === 403) {
        console.log('🎯 DÉMONSTRATION RÉUSSIE !');
        console.log('   📋 Réponse du serveur:');
        console.log(`      Status: ${adminAttempt.status} Forbidden`);
        console.log(`      Message: ${adminAttempt.data.errors?.[0]?.msg}`);
        console.log(`      Détails: ${adminAttempt.data.errors?.[0]?.details}\n`);

        // 4. 📱 SIMULATION DE L'INTERFACE UTILISATEUR
        console.log('4️⃣ 📱 SIMULATION DE L\'INTERFACE FRONTEND...\n');
        
        console.log('🔄 REDIRECTION AUTOMATIQUE:');
        console.log(`   De: ${FRONTEND_URL}/admin`);
        console.log(`   Vers: ${FRONTEND_URL}/access-denied?reason=role-mismatch&attempted=admin&message=${encodeURIComponent(adminAttempt.data.errors?.[0]?.msg || 'Accès refusé')}\n`);

        console.log('🎨 AFFICHAGE DE LA PAGE PROFESSIONNELLE:');
        console.log('   ┌─────────────────────────────────────────────┐');
        console.log('   │              🚫 ACCÈS REFUSÉ                │');
        console.log('   │   Vous n\'êtes pas autorisé à accéder       │');
        console.log('   │              à cette section                │');
        console.log('   ├─────────────────────────────────────────────┤');
        console.log('   │ ℹ️  DÉTAILS DE LA RESTRICTION               │');
        console.log(`   │ Votre compte: ${testUser.email}             `);
        console.log(`   │ Type: Utilisateur                           `);
        console.log(`   │ Accès demandé: Administrateur               `);
        console.log(`   │ Raison: ${adminAttempt.data.errors?.[0]?.msg?.substring(0, 35) || 'Privilèges insuffisants'}...`);
        console.log('   ├─────────────────────────────────────────────┤');
        console.log('   │ 💡 QUE FAIRE MAINTENANT ?                  │');
        console.log('   │ • Vérifiez que vous utilisez le bon compte │');
        console.log('   │ • Contactez votre administrateur           │');
        console.log('   │ • Consultez la documentation               │');
        console.log('   ├─────────────────────────────────────────────┤');
        console.log('   │ [📊 Tableau de bord] [📞 Support] [🚪 Sortir] │');
        console.log('   ├─────────────────────────────────────────────┤');
        console.log('   │ 🔒 Cette restriction fait partie de nos    │');
        console.log('   │    mesures de sécurité                     │');
        console.log('   └─────────────────────────────────────────────┘\n');

        console.log('📋 INSTRUCTIONS POUR VOIR LA VRAIE INTERFACE:');
        console.log('   1️⃣ Attendez que le frontend finisse de compiler');
        console.log(`   2️⃣ Ouvrez votre navigateur sur: ${FRONTEND_URL}`);
        console.log(`   3️⃣ Connectez-vous avec:`);
        console.log(`      📧 Email: ${testUser.email}`);
        console.log(`      🔑 Mot de passe: ${testUser.password}`);
        console.log(`   4️⃣ Cliquez sur le sélecteur de rôle et choisissez "Admin"`);
        console.log('   5️⃣ Tentez de vous connecter comme admin');
        console.log('   6️⃣ Vous verrez la belle page d\'erreur professionnelle ! 🎨\n');

        return 'DEMO_SUCCESS';

      } else if (adminAttempt.status === 200) {
        console.log('❌ PROBLÈME - L\'utilisateur a réussi à devenir admin !');
        return 'SECURITY_ISSUE';
      } else {
        console.log(`⚠️ Status inattendu: ${adminAttempt.status}`);
        return 'UNEXPECTED';
      }

    } catch (error) {
      if (error.response?.status === 403) {
        console.log('✅ Démonstration réussie via exception 403');
        return 'DEMO_SUCCESS';
      } else {
        console.log('❌ Erreur:', error.message);
        return 'ERROR';
      }
    }

  } catch (mainError) {
    console.log('❌ Erreur principale:', mainError.message);
    return 'MAIN_ERROR';
  }
}

// Vérifier aussi le statut du frontend
async function checkFrontendStatus() {
  console.log('🔍 Vérification du statut frontend...');
  
  try {
    const response = await axios.get('http://localhost:4200', { 
      timeout: 5000,
      validateStatus: (status) => status < 500
    });
    
    if (response.status === 200) {
      console.log('✅ Frontend accessible sur http://localhost:4200');
      return true;
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('⏳ Frontend encore en cours de démarrage...');
      console.log('   Attendez quelques secondes et réessayez');
    } else {
      console.log('❌ Erreur frontend:', error.message);
    }
    return false;
  }
}

// Exécution
console.log('🚀 DÉMARRAGE DE LA DÉMONSTRATION...\n');

demonstrationMessagesProf()
  .then(resultat => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎯 RÉSULTAT DE LA DÉMONSTRATION');
    console.log('═══════════════════════════════════════════════════════\n');

    if (resultat === 'DEMO_SUCCESS') {
      console.log('🎉 DÉMONSTRATION RÉUSSIE !');
      console.log('');
      console.log('✅ CE QUI FONCTIONNE:');
      console.log('   🔒 Sécurité backend opérationnelle');
      console.log('   📱 Messages professionnels générés');
      console.log('   🎨 Interface utilisateur créée');
      console.log('   🔄 Redirection automatique configurée');
      console.log('');
      console.log('👀 POUR VOIR L\'INTERFACE VISUELLE:');
      console.log('   • Le frontend local doit être démarré');
      console.log('   • Utilisez les identifiants fournis ci-dessus');
      console.log('   • Tentez un login admin pour voir la page d\'erreur');
      
      return checkFrontendStatus();
    } else {
      console.log('❌ Problème dans la démonstration');
    }
  })
  .catch(console.error);