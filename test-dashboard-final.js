const https = require('https');
const http = require('http');

console.log('🔍 Test final - Dashboard Admin sans données fictives');
console.log('====================================================');

// Configuration
const FRONTEND_URL = 'http://localhost:4200';
const BACKEND_URL = 'http://localhost:3000';

// Test 1: Vérifier que le frontend est accessible
function testFrontendAccess() {
  return new Promise((resolve) => {
    console.log('\n📱 Test 1: Accès au frontend Angular...');
    
    const req = http.get(FRONTEND_URL, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Frontend accessible sur http://localhost:4200');
        resolve(true);
      } else {
        console.log(`❌ Frontend inaccessible - Status: ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log('❌ Erreur de connexion frontend:', err.message);
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log('❌ Timeout - Frontend non accessible');
      resolve(false);
    });
  });
}

// Test 2: Vérifier que le backend API est accessible
function testBackendAccess() {
  return new Promise((resolve) => {
    console.log('\n🔧 Test 2: Accès au backend API...');
    
    const req = http.get(`${BACKEND_URL}/api/health`, (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Backend API accessible sur http://localhost:3000');
        resolve(true);
      } else {
        console.log(`❌ Backend API inaccessible - Status: ${res.statusCode}`);
        resolve(false);
      }
    }).on('error', (err) => {
      console.log('❌ Erreur de connexion backend:', err.message);
      console.log('   Le backend doit être démarré avec: npm run start:dev');
      resolve(false);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      console.log('❌ Timeout - Backend non accessible');
      resolve(false);
    });
  });
}

// Test 3: Instructions pour tester le dashboard
function displayDashboardInstructions() {
  console.log('\n📊 Test 3: Instructions pour tester le dashboard admin');
  console.log('─'.repeat(60));
  
  console.log('\n🔑 1. CONNEXION ADMIN:');
  console.log('   • Aller sur: http://localhost:4200/login');
  console.log('   • Email: superadmin@taskflow.com');
  console.log('   • Mot de passe: superadmin123');
  
  console.log('\n📈 2. VÉRIFICATIONS DASHBOARD:');
  console.log('   ✅ Sections sans données fictives (Alice Martin, Bob Dupont, etc.)');
  console.log('   ✅ Messages d\'état vide professionnels');
  console.log('   ✅ Pas de "generateMockData()" dans les erreurs');
  console.log('   ✅ Statistiques réelles ou états vides appropriés');
  
  console.log('\n🎯 3. SECTIONS À VÉRIFIER:');
  console.log('   • Top Performers: Doit montrer "Aucune donnée utilisateur disponible"');
  console.log('   • Meilleures Équipes: Doit montrer "Aucune équipe disponible"');
  console.log('   • Activités Récentes: Doit montrer "Aucune activité récente"');
  console.log('   • Statistiques principales: Doivent charger les vraies données API');
  
  console.log('\n⚠️ 4. PROBLÈMES À ÉVITER:');
  console.log('   ❌ Pas de noms fictifs (Alice Martin, Bob Dupont, Clara Bernard)');
  console.log('   ❌ Pas d\'équipes fictives (Équipe Frontend, Équipe Backend)');
  console.log('   ❌ Pas d\'activités inventées');
  console.log('   ❌ Pas d\'erreurs "generateMockData" dans la console');
}

// Exécution des tests
async function runTests() {
  console.log('Démarrage des tests...\n');
  
  const frontendOk = await testFrontendAccess();
  const backendOk = await testBackendAccess();
  
  displayDashboardInstructions();
  
  console.log('\n🏁 RÉSUMÉ DES TESTS');
  console.log('==================');
  console.log(`Frontend (Angular): ${frontendOk ? '✅ OK' : '❌ KO'}`);
  console.log(`Backend (API): ${backendOk ? '✅ OK' : '❌ KO - Démarrer avec npm run start:dev'}`);
  
  if (frontendOk) {
    console.log('\n🎉 SUCCESS: Vous pouvez maintenant tester le dashboard admin !');
    console.log('🌐 URL: http://localhost:4200/admin/dashboard');
    console.log('👤 Login: superadmin@taskflow.com / superadmin123');
  } else {
    console.log('\n❌ Démarrer le frontend avec: npm start dans le dossier frontend/');
  }
}

runTests();