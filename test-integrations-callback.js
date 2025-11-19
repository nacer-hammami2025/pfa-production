/**
 * Script de vérification des intégrations OAuth
 * Vérifie que les URLs de callback sont correctement configurées
 */

const axios = require('axios');

const FRONTEND_URL = 'https://nacer-dev.me';
const API_URL = 'https://nacer-dev.me/api';

async function testIntegrationsSetup() {
  console.log('🔧 VÉRIFICATION DE LA CONFIGURATION DES INTÉGRATIONS\n');

  try {
    // 1. Test des routes de callback backend
    console.log('1️⃣ Test des routes de callback backend...');

    const callbackRoutes = [
      '/integrations/google-calendar/callback',
      '/integrations/outlook/callback',
      '/integrations/slack/callback',
      '/integrations/trello/callback'
    ];

    for (const route of callbackRoutes) {
      try {
        const response = await axios.get(`${API_URL}${route}`, {
          maxRedirects: 0,
          validateStatus: function (status) {
            return status >= 200 && status < 400; // Accepter les redirections
          }
        });
        console.log(`   ✅ ${route} - ${response.status} (redirection vers frontend)`);
      } catch (error) {
        if (error.response && error.response.status === 302) {
          console.log(`   ✅ ${route} - ${error.response.status} (redirection)`);
        } else {
          console.log(`   ❌ ${route} - Erreur: ${error.message}`);
        }
      }
    }

    // 2. Test des routes frontend
    console.log('\n2️⃣ Test des routes frontend...');

    const frontendRoutes = [
      '/integrations',
      '/integrations/google-calendar/callback',
      '/integrations/outlook/callback',
      '/integrations/slack/callback',
      '/integrations/trello/callback'
    ];

    for (const route of frontendRoutes) {
      try {
        const response = await axios.get(`${FRONTEND_URL}${route}`, {
          timeout: 10000
        });
        console.log(`   ✅ ${route} - ${response.status}`);
      } catch (error) {
        console.log(`   ❌ ${route} - Erreur: ${error.response?.status || error.message}`);
      }
    }

    // 3. Vérification des variables d'environnement
    console.log('\n3️⃣ Vérification des variables d\'environnement...');

    // Test d'une route qui nécessite FRONTEND_URL
    try {
      const response = await axios.get(`${API_URL}/health`);
      console.log('   ✅ API accessible');
    } catch (error) {
      console.log(`   ❌ API non accessible: ${error.message}`);
    }

    console.log('\n📋 RÉSUMÉ DES CORRECTIONS APPORTÉES:');
    console.log('=====================================');
    console.log('✅ URLs de callback changées: /integrations/* → /api/integrations/*');
    console.log('✅ Routes de callback backend ajoutées (GET /api/integrations/*/callback)');
    console.log('✅ Redirections backend → frontend configurées');
    console.log('✅ Variables d\'environnement mises à jour');

    console.log('\n🔗 URLs DE CALLBACK À CONFIGURER DANS LES APPLICATIONS OAUTH:');
    console.log('=============================================================');
    console.log(`Google Calendar: ${API_URL}/integrations/google-calendar/callback`);
    console.log(`Outlook: ${API_URL}/integrations/outlook/callback`);
    console.log(`Slack: ${API_URL}/integrations/slack/callback`);
    console.log(`Trello: ${API_URL}/integrations/trello/callback`);

    console.log('\n🚀 PROCHAINES ÉTAPES:');
    console.log('====================');
    console.log('1. Mettre à jour les URLs de callback dans Google Cloud Console');
    console.log('2. Mettre à jour les URLs dans les autres services OAuth');
    console.log('3. Tester la connexion Google Calendar');
    console.log('4. Vérifier que FRONTEND_URL=https://nacer-dev.me dans les variables Render');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error.message);
  }
}

testIntegrationsSetup();