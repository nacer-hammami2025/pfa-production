const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function auditCritiqueSecurite() {
  console.log('🚨 AUDIT CRITIQUE DE SÉCURITÉ - VULNÉRABILITÉS ADMIN');
  console.log('=========================================================\n');

  try {
    // TEST 1: Vérifier si un utilisateur normal peut devenir admin
    console.log('🔍 TEST 1: Escalade de privilèges Admin');
    const email = `hacker${Date.now()}@test.com`;
    
    try {
      const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Hacker User',
        email: email,
        password: 'password123',
        role: 'admin'  // TENTATIVE D'ESCALADE DE PRIVILÈGES
      });

      console.log('❌ VULNÉRABILITÉ CRITIQUE DÉTECTÉE !');
      console.log('Un utilisateur peut s\'inscrire comme admin !');
      console.log('Utilisateur créé:', registerRes.data.user);
      
      // Tester l'accès admin
      const token = registerRes.data.token;
      const adminRes = await axios.get(`${BASE_URL}/admin/dashboard-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('❌ ACCÈS ADMIN RÉUSSI - SÉCURITÉ COMPROMISE !');
      
    } catch (error) {
      if (error.response?.status === 400 || error.response?.data?.msg?.includes('role')) {
        console.log('✅ SÉCURITÉ: Escalade de privilèges bloquée');
      } else {
        console.log('⚠️ Erreur lors du test:', error.response?.data || error.message);
      }
    }

    // TEST 2: Vérifier le compte superadmin
    console.log('\n🔍 TEST 2: Vérification compte SuperAdmin');
    try {
      const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'superadmin@taskflow.com',
        password: 'admin123'
      });

      console.log('✅ Connexion SuperAdmin réussie');
      console.log('Rôle:', loginRes.data.user.role);
      
      if (loginRes.data.user.role !== 'admin') {
        console.log('❌ PROBLÈME CRITIQUE: SuperAdmin n\'a pas le rôle admin !');
      }

    } catch (error) {
      console.log('❌ ERREUR: Impossible de se connecter au SuperAdmin');
      console.log('Détails:', error.response?.data || error.message);
    }

    // TEST 3: Fonctionnalité Kanban
    console.log('\n🔍 TEST 3: Fonctionnalité Kanban');
    
    // D'abord se connecter avec un compte valide
    const testEmail = `test${Date.now()}@test.com`;
    const userRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'Test User',
      email: testEmail,
      password: 'password123'
    });
    
    const token = userRes.data.token;
    
    // Créer une tâche
    const taskRes = await axios.post(`${BASE_URL}/tasks`, {
      title: 'Test Kanban Task',
      description: 'Test du système Kanban',
      priority: 'high',
      category: 'work'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const taskId = taskRes.data.task?._id || taskRes.data._id;
    console.log('✅ Tâche créée pour test Kanban');

    // Tester changement de statut Kanban
    try {
      const statusRes = await axios.patch(`${BASE_URL}/tasks/${taskId}/status`, {
        status: 'in-progress'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('✅ Kanban: Changement de statut réussi');
    } catch (error) {
      console.log('❌ KANBAN NON FONCTIONNEL:', error.response?.data || error.message);
    }

    // TEST 4: Préférences profil (thème/notifications)
    console.log('\n🔍 TEST 4: Préférences Profil (Thème & Notifications)');
    
    try {
      const profileRes = await axios.put(`${BASE_URL}/users/profile`, {
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
      
      console.log('✅ Préférences profil mises à jour');

      // Vérifier que les préférences sont sauvegardées
      const getProfileRes = await axios.get(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const preferences = getProfileRes.data.user?.preferences || getProfileRes.data.preferences;
      if (preferences) {
        console.log('✅ Thème:', preferences.theme);
        console.log('✅ Notifications configurées');
      } else {
        console.log('❌ PRÉFÉRENCES NON SAUVEGARDÉES');
      }

    } catch (error) {
      console.log('❌ PRÉFÉRENCES PROFIL NON FONCTIONNELLES:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }

  console.log('\n=========================================================');
  console.log('🚨 AUDIT DE SÉCURITÉ TERMINÉ');
  console.log('=========================================================');
}

auditCritiqueSecurite();