// Test de connexion pour tous les utilisateurs
const axios = require('axios');

const API_URL = 'https://pfa-production-backend.onrender.com/api/auth/login';

const testUsers = [
  { email: 'rawia@gmail.com', password: '123456' },
  { email: 'admin@example.com', password: '123456' },
  { email: 'nacer@gmail.com', password: '123456' },
  // Ajoutez vos autres comptes ici
];

async function testLoginWithRole(email, password, requestedRole) {
  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🧪 TEST: ${email} → ${requestedRole}`);
    console.log(`${'='.repeat(70)}`);
    
    const response = await axios.post(API_URL, {
      email,
      password,
      requestedRole
    });
    
    console.log('✅ Connexion réussie!');
    console.log('Rôle réel:', response.data.user?.role);
    console.log('Token:', response.data.token ? 'Oui' : 'Non');
    return response.data;
    
  } catch (error) {
    if (error.response) {
      console.log(`❌ Erreur ${error.response.status}:`);
      console.log('Message:', error.response.data.errors?.[0]?.msg || error.response.data.message);
      console.log('Détails:', error.response.data.errors?.[0]?.details);
    } else {
      console.log('❌ Erreur réseau:', error.message);
    }
  }
}

async function runAllTests() {
  console.log('\n🚀 TEST DE SÉCURITÉ - Validation des rôles\n');
  
  for (const user of testUsers) {
    // Test 1: Se connecter en tant qu'utilisateur normal
    console.log('\n📌 Scénario 1: Connexion normale (user)');
    await testLoginWithRole(user.email, user.password, 'user');
    
    // Test 2: Tenter de se connecter en tant qu'admin
    console.log('\n📌 Scénario 2: Tentative admin (doit être bloquée si rôle réel = user)');
    await testLoginWithRole(user.email, user.password, 'admin');
    
    console.log('\n' + '─'.repeat(70));
  }
  
  console.log('\n✅ Tests terminés!\n');
}

runAllTests();
