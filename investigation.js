const axios = require('axios');

const BASE_URL = 'https://nacer-dev.me/api';

async function investigateTaskCreationError() {
    console.log('🔍 INVESTIGATION: Erreur 500 lors de la création de tâche');
    
    // 1. Créer un utilisateur de test et obtenir un token
    const testUser = {
        name: 'Investigation User',
        email: `investigation.${Date.now()}@example.com`,
        password: 'TestPassword123!'
    };

    try {
        // Inscription
        await axios.post(`${BASE_URL}/auth/register`, testUser);
        console.log('✅ Utilisateur de test créé');

        // Connexion
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: testUser.email,
            password: testUser.password
        });
        
        const authToken = loginRes.data.token;
        console.log('✅ Token obtenu');

        const headers = {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        };

        // 2. Créer un projet d'abord (peut être requis pour les tâches)
        console.log('\n📋 Création d\'un projet de test...');
        const projectRes = await axios.post(`${BASE_URL}/projects`, {
            name: 'Projet Investigation',
            description: 'Projet pour tester la création de tâches'
        }, { headers });
        
        const projectId = projectRes.data._id || projectRes.data.id;
        console.log('✅ Projet créé:', projectId);

        // 3. Tester différents payloads pour la création de tâche
        const taskPayloads = [
            {
                name: 'Test minimal',
                payload: { title: 'Tâche Test Minimal' }
            },
            {
                name: 'Test avec projet',
                payload: { 
                    title: 'Tâche avec Projet',
                    project: projectId
                }
            },
            {
                name: 'Test complet',
                payload: {
                    title: 'Tâche Complète',
                    description: 'Description de la tâche',
                    priority: 'medium',
                    status: 'todo',
                    project: projectId
                }
            },
            {
                name: 'Test avec assigné',
                payload: {
                    title: 'Tâche Assignée',
                    description: 'Description de la tâche',
                    priority: 'high',
                    status: 'todo',
                    project: projectId,
                    assignedTo: loginRes.data.user._id || loginRes.data.user.id
                }
            }
        ];

        console.log('\n🧪 Test de différents payloads pour la création de tâche:');
        
        for (const test of taskPayloads) {
            try {
                const taskRes = await axios.post(`${BASE_URL}/tasks`, test.payload, { headers });
                console.log(`✅ ${test.name}: Succès (${taskRes.status})`);
                
                // Nettoyer - supprimer la tâche créée
                const taskId = taskRes.data._id || taskRes.data.id;
                if (taskId) {
                    await axios.delete(`${BASE_URL}/tasks/${taskId}`, { headers });
                    console.log(`   🧹 Tâche supprimée: ${taskId}`);
                }
            } catch (error) {
                console.log(`❌ ${test.name}: Échec (${error.response?.status})`);
                console.log(`   Erreur: ${error.response?.data?.message || error.response?.data?.msg || error.message}`);
                if (error.response?.data?.errors) {
                    console.log(`   Détails: ${JSON.stringify(error.response.data.errors, null, 2)}`);
                }
            }
        }

        // 4. Tester les routes manquantes identifiées
        console.log('\n🔍 Test des routes potentiellement manquantes:');
        
        const missingRoutes = [
            { path: '/teams', method: 'GET', desc: 'Liste des équipes' },
            { path: '/notifications', method: 'GET', desc: 'Notifications' },
            { path: '/time-tracking', method: 'GET', desc: 'Suivi du temps' },
            { path: '/files', method: 'GET', desc: 'Gestion des fichiers' },
            { path: '/gamification', method: 'GET', desc: 'Gamification' },
            { path: '/integrations', method: 'GET', desc: 'Intégrations' },
            { path: '/scheduling', method: 'GET', desc: 'Planification' }
        ];

        for (const route of missingRoutes) {
            try {
                const response = await axios.get(`${BASE_URL}${route.path}`, { headers });
                console.log(`✅ ${route.path}: Disponible (${response.status}) - ${route.desc}`);
            } catch (error) {
                const status = error.response?.status || 'NO_RESPONSE';
                if (status === 404) {
                    console.log(`❌ ${route.path}: Route non trouvée - ${route.desc}`);
                } else {
                    console.log(`⚠️  ${route.path}: Erreur ${status} - ${route.desc}`);
                }
            }
        }

        // Nettoyage final
        console.log('\n🧹 Nettoyage...');
        if (projectId) {
            await axios.delete(`${BASE_URL}/projects/${projectId}`, { headers });
            console.log('✅ Projet de test supprimé');
        }

    } catch (error) {
        console.error('❌ Erreur lors de l\'investigation:', error.message);
        if (error.response?.data) {
            console.error('Détails:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

async function checkDatabaseConnection() {
    console.log('\n🗄️  VÉRIFICATION DE LA BASE DE DONNÉES');
    
    try {
        const healthRes = await axios.get(`${BASE_URL}/health`);
        const healthData = healthRes.data;
        
        console.log('📊 État de la base de données:');
        console.log(`   Connecté: ${healthData.database?.connected ? '✅ Oui' : '❌ Non'}`);
        console.log(`   État: ${healthData.database?.readyState}`);
        console.log(`   Nom DB: ${healthData.database?.name || 'Non spécifié'}`);
        console.log(`   MongoDB URI: ${healthData.mongoUri || 'Non configuré'}`);
        console.log(`   MongoDB Legacy: ${healthData.mongoUriLegacy || 'Non configuré'}`);
        console.log(`   Environnement: ${healthData.environment || 'Non spécifié'}`);
        
        if (!healthData.database?.connected) {
            console.log('\n⚠️  PROBLÈME IDENTIFIÉ: Base de données non connectée!');
            console.log('   Cela peut expliquer les erreurs 500 lors de la création de données.');
        }
        
    } catch (error) {
        console.log('❌ Impossible de vérifier l\'état de la base de données');
        console.log(`   Erreur: ${error.message}`);
    }
}

async function main() {
    console.log('🔍 INVESTIGATION APPROFONDIE - TaskFlow Pro');
    console.log('='.repeat(60));
    
    await checkDatabaseConnection();
    await investigateTaskCreationError();
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 CONCLUSIONS DE L\'INVESTIGATION');
    console.log('='.repeat(60));
}

main().catch(console.error);