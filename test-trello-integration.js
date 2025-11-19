/**
 * Script de test de l'intégration Trello
 */

const axios = require('axios');

const API_URL = 'https://nacer-dev.me/api';

async function testTrelloIntegration() {
  console.log('🔍 TEST DE L\'INTÉGRATION TRELLO\n');

  try {
    // 1. Test de la route de callback backend
    console.log('1️⃣ Test de la route de callback Trello...');
    try {
      const response = await axios.get(`${API_URL}/integrations/trello/callback`, {
        maxRedirects: 0,
        validateStatus: function (status) {
          return status >= 200 && status < 400;
        }
      });
      console.log(`   ✅ Route accessible (${response.status})`);
    } catch (error) {
      if (error.response?.status === 302) {
        console.log(`   ✅ Route accessible avec redirection (${error.response.status})`);
      } else {
        console.log(`   ❌ Route non accessible: ${error.message}`);
      }
    }

    // 2. Vérification des variables d'environnement
    console.log('\n2️⃣ Vérification de la configuration...');

    // Test de l'API health pour vérifier que le backend fonctionne
    try {
      await axios.get(`${API_URL}/health`);
      console.log('   ✅ Backend accessible');
    } catch (error) {
      console.log(`   ❌ Backend non accessible: ${error.message}`);
      return;
    }

    // 3. Instructions pour l'utilisateur
    console.log('\n📋 INSTRUCTIONS DE CONFIGURATION TRELLO:');
    console.log('==========================================');
    console.log('1. Aller sur https://trello.com/power-ups/admin/');
    console.log('2. Créer une nouvelle Power-Up nommée "TaskFlow Pro"');
    console.log('3. Noter l\'API Key générée');
    console.log('4. Configurer :');
    console.log('   - Return URL: https://nacer-dev.me/api/integrations/trello/callback');
    console.log('   - Allowed Origins: https://nacer-dev.me');
    console.log('   - Permissions: read, write, account');
    console.log('5. Ajouter TRELLO_API_KEY dans les variables Render');
    console.log('6. Redéployer l\'application');
    console.log('7. Tester la connexion Trello');

    console.log('\n🔗 URL DE CONNEXION TRELLO:');
    console.log('https://nacer-dev.me/integrations');

    console.log('\n⚠️  NOTE: Sans API key valide, Trello affichera "App not found"');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testTrelloIntegration();