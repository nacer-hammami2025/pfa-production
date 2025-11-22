const axios = require('axios');

async function testMultipleAccounts() {
  const PROD_URL = 'https://nacer-dev.me/api';
  
  const accounts = [
    { email: 'superadmin@taskflow.com', password: 'superadmin123' },
    { email: 'admin@taskflow.com', password: 'admin123' },
    { email: 'superadmin@taskflow.com', password: 'admin123' },
    { email: 'admin@taskflow.com', password: 'superadmin123' },
    { email: 'superadmin@taskflow.com', password: 'Hammami2025' },
    { email: 'admin@taskflow.com', password: 'Hammami2025' }
  ];
  
  for (const account of accounts) {
    try {
      console.log(`\n🔐 Test connexion: ${account.email} / ${account.password}`);
      
      const loginRes = await axios.post(`${PROD_URL}/auth/login`, {
        email: account.email,
        password: account.password
      }, { timeout: 10000 });

      console.log('✅ CONNEXION RÉUSSIE !');
      console.log('👤 Utilisateur:', loginRes.data.user.name);
      console.log('📧 Email:', loginRes.data.user.email);
      console.log('👑 Rôle:', loginRes.data.user.role);
      console.log('🔑 Token reçu:', loginRes.data.token ? 'OUI' : 'NON');
      
      // Test API admin/users avec ce token
      const token = loginRes.data.token;
      
      console.log('\n🔄 Test API /admin/users...');
      const usersRes = await axios.get(`${PROD_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      
      console.log('✅ API /admin/users FONCTIONNE !');
      console.log('👥 Nombre d\'utilisateurs:', usersRes.data.length);
      
      console.log('\n📋 UTILISATEURS RÉELS TROUVÉS:');
      usersRes.data.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.role}) - Créé: ${user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR') : 'N/A'}`);
      });
      
      break; // Arrêter après le premier succès
      
    } catch (error) {
      console.log(`❌ Échec: ${error.response?.status || error.code} - ${error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || error.message}`);
    }
  }
}

testMultipleAccounts();