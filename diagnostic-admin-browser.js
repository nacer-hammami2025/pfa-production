// SCRIPT À EXÉCUTER DANS LA CONSOLE DU NAVIGATEUR (F12)
// Va sur https://nacer-dev.me, connecte-toi avec ton compte admin, puis lance ce script

console.log('🔍 DIAGNOSTIC DASHBOARD ADMIN - Exécution depuis le navigateur');

// Récupérer le token depuis localStorage/sessionStorage
const token = localStorage.getItem('token') || sessionStorage.getItem('token');
console.log('🔑 Token trouvé:', token ? 'OUI' : 'NON');

if (!token) {
  console.log('❌ Pas de token trouvé. Connecte-toi d\'abord !');
} else {
  console.log('🔑 Token:', token.substring(0, 50) + '...');
}

// Test API admin/users
async function testAdminAPI() {
  try {
    console.log('\n🔄 Test API /api/admin/users...');
    
    const response = await fetch('/api/admin/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Réponse status:', response.status);
    console.log('📡 Réponse headers:', [...response.headers.entries()]);
    
    if (response.ok) {
      const users = await response.json();
      console.log('✅ API /admin/users FONCTIONNE !');
      console.log('👥 Nombre d\'utilisateurs:', users.length);
      
      console.log('\n📋 UTILISATEURS RÉELS:');
      users.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Rôle: ${user.role}`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Créé: ${user.createdAt}`);
        console.log('');
      });
    } else {
      const error = await response.text();
      console.log('❌ Erreur API:', error);
    }
    
  } catch (error) {
    console.error('❌ Erreur réseau:', error);
  }
}

// Test API dashboard summary
async function testDashboardAPI() {
  try {
    console.log('\n🔄 Test API /api/admin/dashboard/summary...');
    
    const response = await fetch('/api/admin/dashboard/summary', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Dashboard status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API dashboard FONCTIONNE !');
      console.log('📊 Statistiques:');
      console.log('   Utilisateurs:', data.totals?.users);
      console.log('   Admins:', data.totals?.admins);
      console.log('   Équipes:', data.totals?.teams);
      
      if (data.recentUsers) {
        console.log('\n👥 Utilisateurs récents:');
        data.recentUsers.forEach(user => {
          console.log(`   - ${user.email} (${user.role})`);
        });
      }
    } else {
      const error = await response.text();
      console.log('❌ Erreur dashboard:', error);
    }
    
  } catch (error) {
    console.error('❌ Erreur dashboard:', error);
  }
}

// Lancer les tests
if (token) {
  testAdminAPI();
  setTimeout(() => testDashboardAPI(), 1000);
} else {
  console.log('❌ Impossible de tester sans token. Connecte-toi d\'abord !');
}

console.log('\n📝 INSTRUCTIONS:');
console.log('1. Va sur https://nacer-dev.me');
console.log('2. Connecte-toi avec ton compte admin');
console.log('3. Ouvre les DevTools (F12)');
console.log('4. Va dans Console');
console.log('5. Colle et exécute ce script');
console.log('6. Envoie-moi les résultats !');