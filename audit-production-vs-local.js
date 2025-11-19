const axios = require('axios');

const PROD_URL = 'https://nacer-dev.me/api';
const LOCAL_URL = 'http://localhost:5000/api';

async function auditSecuriteProduction() {
  console.log('🚨 AUDIT SÉCURITÉ CRITIQUE - PRODUCTION vs LOCAL');
  console.log('=======================================================\n');

  // Test en production
  console.log('🌐 TEST PRODUCTION (https://nacer-dev.me)');
  await testAuth('PRODUCTION', PROD_URL, 'admin@taskflow.com', 'admin123');

  console.log('\n🏠 TEST LOCAL (localhost:5000)');
  await testAuth('LOCAL', LOCAL_URL, 'admin@taskflow.com', 'admin123');

  console.log('\n📊 COMPARAISON DES ENVIRONNEMENTS');
  console.log('=======================================================');
}

async function testAuth(env, baseUrl, email, password) {
  try {
    console.log(`\n🔍 [${env}] Test connexion: ${email}`);
    
    const loginRes = await axios.post(`${baseUrl}/auth/login`, {
      email: email,
      password: password
    }, { timeout: 10000 });

    console.log(`✅ [${env}] Connexion réussie !`);
    console.log(`👤 [${env}] Utilisateur:`, loginRes.data.user);
    console.log(`🎫 [${env}] Rôle: ${loginRes.data.user.role}`);
    
    if (loginRes.data.user.role === 'admin') {
      console.log(`❌ [${env}] VULNÉRABILITÉ: Accès admin accordé !`);
      
      // Tester l'accès admin
      const token = loginRes.data.token;
      try {
        const adminRes = await axios.get(`${baseUrl}/admin/dashboard-summary`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
        console.log(`❌ [${env}] CRITIQUE: Accès dashboard admin réussi !`);
        console.log(`📊 [${env}] Données admin accessibles: ${Object.keys(adminRes.data).join(', ')}`);
      } catch (adminError) {
        console.log(`⚠️ [${env}] Accès dashboard bloqué:`, adminError.response?.data?.msg || adminError.message);
      }
    } else {
      console.log(`✅ [${env}] Sécurité OK: Rôle utilisateur normal`);
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log(`❌ [${env}] Serveur inaccessible: ${baseUrl}`);
    } else if (error.response?.status === 401) {
      console.log(`✅ [${env}] Connexion refusée (normal)`);
    } else {
      console.log(`❌ [${env}] Erreur:`, error.response?.data || error.message);
    }
  }
}

auditSecuriteProduction();