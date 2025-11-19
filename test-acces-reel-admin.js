const axios = require('axios');

const PROD_URL = 'https://nacer-dev.me/api';

async function testAccesRéelAdmin() {
  console.log('🔍 TEST ACCÈS RÉEL AUX FONCTIONS ADMIN');
  console.log('=====================================\n');

  try {
    // Créer un nouveau utilisateur pour le test
    const email = `testuser${Date.now()}@test.com`;
    
    const registerRes = await axios.post(`${PROD_URL}/auth/register`, {
      name: 'Test User Normal',
      email: email,
      password: 'password123'
    });

    console.log('✅ Utilisateur créé:', registerRes.data.user.role);
    const token = registerRes.data.token;

    // Tester toutes les fonctions admin une par une
    console.log('\n🧪 TEST DES VRAIES FONCTIONS ADMIN:');
    
    const testsAdmin = [
      {
        name: 'Dashboard Admin',
        method: 'GET',
        url: `${PROD_URL}/admin/dashboard-summary`
      },
      {
        name: 'Liste Utilisateurs',
        method: 'GET', 
        url: `${PROD_URL}/admin/users`
      },
      {
        name: 'Création Admin',
        method: 'POST',
        url: `${PROD_URL}/admin/create-admin`,
        data: {
          name: 'New Admin',
          email: 'newadmin@test.com',
          password: 'admin123'
        }
      }
    ];

    for (const test of testsAdmin) {
      try {
        let response;
        if (test.method === 'GET') {
          response = await axios.get(test.url, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          });
        } else {
          response = await axios.post(test.url, test.data, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          });
        }
        
        console.log(`❌ ${test.name}: ACCESSIBLE (PROBLÈME DE SÉCURITÉ !)`);
        console.log(`   Données reçues:`, typeof response.data === 'object' ? Object.keys(response.data) : 'Success');
        
      } catch (error) {
        if (error.response?.status === 403) {
          console.log(`✅ ${test.name}: BLOQUÉ (sécurité OK)`);
          console.log(`   Erreur: ${error.response.data.msg || 'Access denied'}`);
        } else if (error.response?.status === 401) {
          console.log(`✅ ${test.name}: AUTHENTIFICATION REQUISE`);
        } else {
          console.log(`⚠️ ${test.name}: Erreur inattendue (${error.response?.status})`);
          console.log(`   Message: ${error.response?.data?.msg || error.message}`);
        }
      }
    }

    console.log('\n🔍 VÉRIFICATION PROFIL UTILISATEUR:');
    try {
      const profileRes = await axios.get(`${PROD_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('👤 Profil utilisateur:');
      console.log('   - Nom:', profileRes.data.user?.name || profileRes.data.name);
      console.log('   - Email:', profileRes.data.user?.email || profileRes.data.email);
      console.log('   - Rôle:', profileRes.data.user?.role || profileRes.data.role);
      
    } catch (profileError) {
      console.log('❌ Erreur récupération profil:', profileError.response?.data || profileError.message);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.response?.data || error.message);
  }

  console.log('\n📋 CONCLUSION:');
  console.log('==============');
  console.log('Si toutes les fonctions admin sont BLOQUÉES ci-dessus,');
  console.log('votre sécurité fonctionne correctement !');
  console.log('Le problème est probablement dans l\'interface utilisateur.');
}

testAccesRéelAdmin();