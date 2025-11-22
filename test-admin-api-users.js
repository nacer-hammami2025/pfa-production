const axios = require('axios');

async function testAdminAPIUsers() {
  const PROD_URL = 'https://nacer-dev.me/api';
  
  try {
    console.log('🔐 Test de connexion admin...');
    
    // Connexion admin avec le vrai compte superadmin
    const loginRes = await axios.post(`${PROD_URL}/auth/login`, {
      email: 'superadmin@taskflow.com',
      password: 'superadmin123'
    }, { timeout: 10000 });

    console.log('✅ Connexion admin réussie');
    console.log('👤 Rôle:', loginRes.data.user.role);
    
    const token = loginRes.data.token;
    
    // Test API admin/users
    console.log('\n🔄 Test API /admin/users...');
    
    const usersRes = await axios.get(`${PROD_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    
    console.log('✅ API /admin/users fonctionne !');
    console.log('👥 Nombre d\'utilisateurs trouvés:', usersRes.data.length);
    
    console.log('\n📋 LISTE DES UTILISATEURS RÉELS:');
    usersRes.data.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Rôle: ${user.role}`);
      console.log(`   ID: ${user._id}`);
      console.log(`   Créé le: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}`);
      console.log(`   Dernière connexion: ${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('fr-FR') : 'Jamais'}`);
      console.log('');
    });
    
    // Test API dashboard summary
    console.log('\n🔄 Test API /admin/dashboard/summary...');
    
    const dashRes = await axios.get(`${PROD_URL}/admin/dashboard/summary`, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 10000
    });
    
    console.log('✅ API dashboard summary fonctionne !');
    console.log('📊 Statistiques réelles:');
    console.log(`   Utilisateurs: ${dashRes.data.totals?.users || 0}`);
    console.log(`   Admins: ${dashRes.data.totals?.admins || 0}`);
    console.log(`   Utilisateurs actifs: ${dashRes.data.totals?.activeUsers || 0}`);
    console.log(`   Équipes: ${dashRes.data.totals?.teams || 0}`);
    
    if (dashRes.data.recentUsers && dashRes.data.recentUsers.length > 0) {
      console.log('\n👥 Utilisateurs récents:');
      dashRes.data.recentUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.role})`);
      });
    }
    
    console.log('\n✅ DIAGNOSTIC: Les APIs admin fonctionnent correctement !');
    console.log('🎯 Le problème est dans le frontend qui utilise des données fictives au lieu d\'appeler ces APIs.');
    
  } catch (error) {
    console.error('❌ ERREUR lors du test:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testAdminAPIUsers();