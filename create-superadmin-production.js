const axios = require('axios');

const PROD_URL = 'https://nacer-dev.me/api';

async function creerSuperAdminProduction() {
  console.log('👑 CRÉATION SUPERADMIN EN PRODUCTION');
  console.log('===================================\n');

  try {
    // D'abord, essayer de se connecter avec admin@taskflow.com pour obtenir un token
    console.log('🔐 Connexion avec admin@taskflow.com pour obtenir un token...');
    
    const loginRes = await axios.post(`${PROD_URL}/auth/login`, {
      email: 'admin@taskflow.com',
      password: 'admin123'
    });

    const token = loginRes.data.token;
    console.log('✅ Token obtenu');

    // Essayer de créer un superadmin via l'API admin (si disponible)
    console.log('\n👑 Tentative de création SuperAdmin via API...');
    
    try {
      const createAdminRes = await axios.post(`${PROD_URL}/admin/create-admin`, {
        name: 'Super Admin',
        email: 'superadmin@taskflow.com',
        password: 'admin123'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ SuperAdmin créé avec succès !');
      console.log('📧 Email: superadmin@taskflow.com');
      console.log('🔑 Password: admin123');
      
    } catch (createError) {
      console.log('❌ Impossible de créer SuperAdmin via API');
      console.log('   Raison:', createError.response?.data?.msg || createError.message);
      
      if (createError.response?.status === 403) {
        console.log('\n⚠️  Le compte admin@taskflow.com n\'a pas les privilèges admin');
        console.log('   Il faut créer le SuperAdmin directement en base de données');
      }
    }

    // Tester si le superadmin existe maintenant
    console.log('\n🧪 Test du SuperAdmin...');
    try {
      const testRes = await axios.post(`${PROD_URL}/auth/login`, {
        email: 'superadmin@taskflow.com',
        password: 'admin123'
      });
      
      console.log('✅ SuperAdmin fonctionnel !');
      console.log('👤 Rôle:', testRes.data.user.role);
      
    } catch (testError) {
      console.log('❌ SuperAdmin non fonctionnel');
    }

  } catch (error) {
    console.log('❌ Erreur générale:', error.response?.data || error.message);
  }

  console.log('\n📋 INSTRUCTIONS MANUELLES :');
  console.log('Si la création automatique a échoué, connectez-vous à votre base MongoDB de production et exécutez :');
  console.log(`
db.users.insertOne({
  name: 'Super Admin',
  email: 'superadmin@taskflow.com',
  password: '$2a$10$hash_mot_de_passe_admin123', // Hash bcrypt de 'admin123'
  role: 'admin',
  preferences: {
    theme: 'light',
    notifications: { email: true, push: true, reminders: true, taskDue: true, teamActivity: true, achievements: true },
    timezone: 'UTC',
    language: 'en'
  },
  stats: { tasksCompleted: 0, totalTasks: 0, streakDays: 0, level: 1, experience: 0 },
  lastLogin: new Date(),
  createdAt: new Date(),
  mfaEnabled: false
});`);
}

creerSuperAdminProduction();