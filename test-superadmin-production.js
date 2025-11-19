const axios = require('axios');

const PROD_URL = 'https://nacer-dev.me/api';

async function testSuperAdminProduction() {
  console.log('🚨 TEST SUPERADMIN EN PRODUCTION');
  console.log('=====================================\n');

  // Tester le superadmin
  try {
    console.log('🔍 Test connexion SuperAdmin: superadmin@taskflow.com');
    
    const loginRes = await axios.post(`${PROD_URL}/auth/login`, {
      email: 'superadmin@taskflow.com',
      password: 'admin123'
    }, { timeout: 10000 });

    console.log('✅ Connexion SuperAdmin réussie !');
    console.log('👤 SuperAdmin:', loginRes.data.user);
    console.log('🎫 Rôle:', loginRes.data.user.role);
    
    if (loginRes.data.user.role === 'admin') {
      console.log('✅ SuperAdmin a le bon rôle !');
      
      // Tester l'accès dashboard admin
      const token = loginRes.data.token;
      try {
        const adminRes = await axios.get(`${PROD_URL}/admin/dashboard-summary`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
        console.log('✅ Accès dashboard admin réussi !');
        console.log('📊 Stats production:', {
          users: adminRes.data.totals.users,
          admins: adminRes.data.totals.admins,
          tasks: adminRes.data.totals.tasks
        });
      } catch (adminError) {
        console.log('❌ Accès dashboard bloqué:', adminError.response?.data?.msg || adminError.message);
      }
    } else {
      console.log('❌ PROBLÈME: SuperAdmin n\'a pas le rôle admin !');
    }

  } catch (error) {
    if (error.response?.status === 401) {
      console.log('❌ SuperAdmin: Connexion refusée - Compte inexistant ou mot de passe incorrect');
    } else {
      console.log('❌ Erreur SuperAdmin:', error.response?.data || error.message);
    }
  }

  // Tester admin@taskflow.com pour confirmer
  try {
    console.log('\n🔍 Confirmation: admin@taskflow.com');
    
    const adminLoginRes = await axios.post(`${PROD_URL}/auth/login`, {
      email: 'admin@taskflow.com',
      password: 'admin123'  // Essayer le même mot de passe
    }, { timeout: 10000 });

    console.log('✅ admin@taskflow.com connexion réussie !');
    console.log('👤 admin@taskflow.com:', adminLoginRes.data.user);
    console.log('🎫 Rôle:', adminLoginRes.data.user.role);
    
    // Tester accès admin avec ce compte
    const token = adminLoginRes.data.token;
    try {
      const dashRes = await axios.get(`${PROD_URL}/admin/dashboard-summary`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });
      console.log('❌ ALERTE: admin@taskflow.com peut accéder au dashboard admin !');
    } catch (err) {
      console.log('✅ Sécurité OK: admin@taskflow.com ne peut pas accéder au dashboard admin');
      console.log('   Erreur:', err.response?.data?.msg || err.message);
    }

  } catch (error) {
    console.log('❌ admin@taskflow.com: Connexion échouée');
    console.log('   Détails:', error.response?.data || error.message);
  }
}

testSuperAdminProduction();