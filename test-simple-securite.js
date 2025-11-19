/**
 * Test simple et direct de sécurité - Escalade de privilège
 */

const axios = require('axios');

async function testEscalade() {
  console.log('🔐 TEST ESCALADE DE PRIVILÈGE');
  console.log('=============================\n');

  const timestamp = Date.now();
  const testUser = {
    name: 'Test Security User',
    email: `sectest${timestamp}@test.com`,
    password: 'pass123456'
  };

  try {
    // 1. Créer utilisateur normal
    console.log('1️⃣ Création utilisateur de test...');
    const regRes = await axios.post('https://nacer-dev.me/api/auth/register', testUser);
    
    console.log('✅ Utilisateur créé');
    console.log(`   Rôle: ${regRes.data.user.role}`);

    // 2. Login normal (contrôle)
    console.log('\n2️⃣ Test login normal...');
    const loginRes = await axios.post('https://nacer-dev.me/api/auth/login', {
      email: testUser.email,
      password: testUser.password
    });
    
    console.log('✅ Login normal OK');
    console.log(`   Rôle: ${loginRes.data.user.role}`);

    // 3. 🚨 TENTATIVE HACK ADMIN
    console.log('\n3️⃣ 🚨 TENTATIVE HACK ADMIN...');
    console.log('   Utilisateur normal demande rôle admin...');
    
    const hackRes = await axios.post('https://nacer-dev.me/api/auth/login', {
      email: testUser.email,
      password: testUser.password,
      requestedRole: 'admin'  // 💥 HACK ATTEMPT
    }, {
      validateStatus: (status) => status < 500
    });

    console.log(`   Status: ${hackRes.status}`);

    if (hackRes.status === 403) {
      console.log('✅ HACK BLOQUÉ - Sécurité OK');
      console.log('🛡️ Système protégé !');
      return 'SECURE';
    } else if (hackRes.status === 200) {
      console.log('❌ HACK RÉUSSI - FAILLE CRITIQUE !');
      console.log(`   Rôle obtenu: ${hackRes.data.user?.role}`);
      console.log('🚨 SYSTÈME COMPROMIS !');
      return 'COMPROMISED';
    } else {
      console.log(`⚠️ Status inattendu: ${hackRes.status}`);
      return 'UNKNOWN';
    }

  } catch (error) {
    if (error.response?.status === 403) {
      console.log('✅ HACK BLOQUÉ par 403');
      console.log('🛡️ Sécurité fonctionnelle');
      return 'SECURE';
    } else {
      console.log('❌ Erreur:', error.message);
      return 'ERROR';
    }
  }
}

testEscalade()
  .then(result => {
    console.log('\n🎯 RÉSULTAT');
    console.log('============');
    
    switch(result) {
      case 'SECURE':
        console.log('🟢 SYSTÈME SÉCURISÉ ✅');
        console.log('   Escalade de privilège impossible');
        break;
      case 'COMPROMISED':
        console.log('🔴 SYSTÈME COMPROMIS ❌');  
        console.log('   Escalade de privilège possible !');
        break;
      default:
        console.log('🟡 Test inconclusif');
    }
  });