const axios = require('axios');

const PROD_URL = 'https://nacer-dev.me/api';

async function testAdminApresCreation() {
  console.log('🧪 TEST ADMIN APRÈS CRÉATION EN PRODUCTION');
  console.log('==========================================\n');

  // Test 1: SuperAdmin (si créé via OPTION 1)
  console.log('🔍 TEST 1: superadmin@taskflow.com');
  await testAdminAccess('SuperAdmin', 'superadmin@taskflow.com', 'admin123');

  // Test 2: admin@taskflow.com élevé (si modifié via OPTION 2)  
  console.log('\n🔍 TEST 2: admin@taskflow.com (après élévation)');
  await testAdminAccess('AdminElevé', 'admin@taskflow.com', 'admin123');
}

async function testAdminAccess(label, email, password) {
  try {
    // Connexion
    const loginRes = await axios.post(`${PROD_URL}/auth/login`, {
      email: email,
      password: password
    }, { timeout: 10000 });

    console.log(`✅ [${label}] Connexion réussie !`);
    console.log(`👤 [${label}] Rôle: ${loginRes.data.user.role}`);
    
    if (loginRes.data.user.role === 'admin') {
      // Test accès dashboard admin
      const token = loginRes.data.token;
      try {
        const dashRes = await axios.get(`${PROD_URL}/admin/dashboard-summary`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
        
        console.log(`✅ [${label}] Dashboard admin accessible !`);
        console.log(`📊 [${label}] Stats:`, {
          users: dashRes.data.totals?.users,
          admins: dashRes.data.totals?.admins,
          tasks: dashRes.data.totals?.tasks
        });

        // Test gestion utilisateurs
        try {
          const usersRes = await axios.get(`${PROD_URL}/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          });
          console.log(`✅ [${label}] Gestion utilisateurs accessible !`);
          console.log(`👥 [${label}] Nombre d'utilisateurs: ${usersRes.data.length}`);
          
        } catch (usersError) {
          console.log(`❌ [${label}] Gestion utilisateurs bloquée:`, usersError.response?.data?.msg);
        }

      } catch (dashError) {
        console.log(`❌ [${label}] Dashboard bloqué:`, dashError.response?.data?.msg);
      }
      
    } else {
      console.log(`❌ [${label}] N'a pas le rôle admin (rôle: ${loginRes.data.user.role})`);
    }

  } catch (error) {
    if (error.response?.status === 401) {
      console.log(`❌ [${label}] Connexion refusée - Compte inexistant ou mot de passe incorrect`);
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log(`❌ [${label}] Serveur inaccessible`);
    } else {
      console.log(`❌ [${label}] Erreur:`, error.response?.data || error.message);
    }
  }
}

testAdminApresCreation();