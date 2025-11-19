const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testRapideProfil() {
  console.log('🔍 TEST RAPIDE: Préférences Profil');
  
  try {
    // Créer un utilisateur test
    const email = `profiletest${Date.now()}@test.com`;
    const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Profile Test User',
      email: email,
      password: 'password123'
    });

    const token = registerRes.data.token;
    console.log('✅ Utilisateur créé pour test profil');

    // Vérifier profil initial
    console.log('\n📋 Profil initial:');
    const initialProfileRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Préférences initiales:', initialProfileRes.data.user?.preferences);

    // Mettre à jour les préférences
    console.log('\n🔧 Mise à jour des préférences...');
    const updateRes = await axios.put(`${BASE_URL}/users/profile`, {
      preferences: {
        theme: 'dark',
        notifications: {
          email: true,
          push: false,
          reminders: true,
          taskDue: true,
          teamActivity: false,
          achievements: true
        }
      }
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('✅ Mise à jour réussie');
    console.log('Préférences mises à jour:', updateRes.data.user?.preferences);

    // Vérifier que les préférences sont sauvegardées
    console.log('\n🔍 Vérification finale:');
    const finalProfileRes = await axios.get(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const finalPrefs = finalProfileRes.data.user?.preferences;
    console.log('Préférences finales:', finalPrefs);
    
    if (finalPrefs && finalPrefs.theme === 'dark') {
      console.log('✅ THÈME SOMBRE: Fonctionnel');
    } else {
      console.log('❌ THÈME SOMBRE: Non fonctionnel');
    }

    if (finalPrefs && finalPrefs.notifications && finalPrefs.notifications.email === true) {
      console.log('✅ NOTIFICATIONS: Fonctionnelles');
    } else {
      console.log('❌ NOTIFICATIONS: Non fonctionnelles');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

testRapideProfil();