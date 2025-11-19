/**
 * Script de test de l'intégration Slack
 */

const axios = require('axios');

const API_URL = 'https://nacer-dev.me/api';

async function testSlackIntegration() {
  console.log('🔍 TEST DE L\'INTÉGRATION SLACK\n');

  try {
    // 1. Test de la route de callback backend
    console.log('1️⃣ Test de la route de callback Slack...');
    try {
      const response = await axios.get(`${API_URL}/integrations/slack/callback`, {
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
    console.log('\n📋 INSTRUCTIONS DE CONFIGURATION SLACK:');
    console.log('========================================');
    console.log('1. Aller sur https://api.slack.com/apps');
    console.log('2. Créer une nouvelle app "TaskFlow Pro"');
    console.log('3. Dans "OAuth & Permissions":');
    console.log('   - Redirect URL: https://nacer-dev.me/api/integrations/slack/callback');
    console.log('   - Scopes: chat:write, channels:read, users:read');
    console.log('4. Noter Client ID et Client Secret');
    console.log('5. Installer l\'app dans votre workspace');
    console.log('6. Ajouter SLACK_CLIENT_ID et SLACK_CLIENT_SECRET dans Render');
    console.log('7. Redéployer l\'application');
    console.log('8. Tester la connexion Slack');

    console.log('\n🔗 URL DE CONNEXION SLACK:');
    console.log('https://nacer-dev.me/integrations');

    console.log('\n⚠️  NOTE: Sans Client ID valide, Slack affichera "Invalid client_id parameter"');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testSlackIntegration();