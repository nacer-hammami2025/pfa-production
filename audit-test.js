const axios = require('axios');

const BASE_URL = 'https://nacer-dev.me/api';

class PFAApiTester {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
        this.authToken = null;
        this.testUserId = null;
    }

    async log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    async testEndpoint(method, endpoint, data = null, requireAuth = false, description = '') {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            if (requireAuth && this.authToken) {
                headers['Authorization'] = `Bearer ${this.authToken}`;
            }

            const config = {
                method: method.toLowerCase(),
                url: `${BASE_URL}${endpoint}`,
                headers
            };

            if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
                config.data = data;
            }

            const response = await axios(config);
            
            this.results.passed++;
            this.results.tests.push({
                endpoint: `${method.toUpperCase()} ${endpoint}`,
                status: 'PASS',
                statusCode: response.status,
                description,
                response: response.data
            });

            await this.log(`PASS: ${method.toUpperCase()} ${endpoint} - ${response.status} - ${description}`, 'success');
            return { success: true, data: response.data, status: response.status };

        } catch (error) {
            this.results.failed++;
            const statusCode = error.response?.status || 'NO_RESPONSE';
            const errorMessage = error.response?.data?.message || error.message;
            
            this.results.tests.push({
                endpoint: `${method.toUpperCase()} ${endpoint}`,
                status: 'FAIL',
                statusCode,
                description,
                error: errorMessage,
                fullError: error.response?.data
            });

            await this.log(`FAIL: ${method.toUpperCase()} ${endpoint} - ${statusCode} - ${errorMessage} - ${description}`, 'error');
            return { success: false, error: errorMessage, status: statusCode };
        }
    }

    async runAudit() {
        console.log('🔍 Démarrage de l\'audit de l\'application TaskFlow Pro');
        console.log('=' .repeat(70));

        // 1. Test de santé général
        await this.log('Test de santé de l\'application...', 'info');
        await this.testEndpoint('GET', '/health', null, false, 'Health check');

        // 2. Test des endpoints d'authentification
        await this.log('Test des endpoints d\'authentification...', 'info');
        
        // Test de création d'un utilisateur de test
        const testUser = {
            name: 'Test User Audit',
            email: `test.audit.${Date.now()}@example.com`,
            password: 'TestPassword123!'
        };

        const registerResult = await this.testEndpoint('POST', '/auth/register', testUser, false, 'Inscription utilisateur');
        
        if (registerResult.success) {
            // Test de connexion
            const loginResult = await this.testEndpoint('POST', '/auth/login', {
                email: testUser.email,
                password: testUser.password
            }, false, 'Connexion utilisateur');

            if (loginResult.success && loginResult.data.token) {
                this.authToken = loginResult.data.token;
                this.testUserId = loginResult.data.user?._id || loginResult.data.user?.id;
                await this.log(`Token d'authentification obtenu: ${this.authToken.substring(0, 20)}...`);
            }
        }

        // Test du profil utilisateur
        await this.testEndpoint('GET', '/auth/profile', null, true, 'Récupération du profil utilisateur');

        // 3. Test des endpoints utilisateurs
        await this.log('Test des endpoints utilisateurs...', 'info');
        await this.testEndpoint('GET', '/users', null, true, 'Liste des utilisateurs');
        if (this.testUserId) {
            await this.testEndpoint('GET', `/users/${this.testUserId}`, null, true, 'Détails d\'un utilisateur');
        }

        // 4. Test des endpoints projets
        await this.log('Test des endpoints projets...', 'info');
        await this.testEndpoint('GET', '/projects', null, true, 'Liste des projets');
        
        // Test de création d'un projet
        const testProject = {
            name: 'Projet Test Audit',
            description: 'Projet créé pour l\'audit',
            status: 'active'
        };
        const projectResult = await this.testEndpoint('POST', '/projects', testProject, true, 'Création d\'un projet');
        let projectId = null;
        if (projectResult.success) {
            projectId = projectResult.data._id || projectResult.data.id;
        }

        // 5. Test des endpoints tâches
        await this.log('Test des endpoints tâches...', 'info');
        await this.testEndpoint('GET', '/tasks', null, true, 'Liste des tâches');
        
        // Test de création d'une tâche
        const testTask = {
            title: 'Tâche Test Audit',
            description: 'Tâche créée pour l\'audit',
            priority: 'medium',
            status: 'todo'
        };
        if (projectId) {
            testTask.project = projectId;
        }
        
        const taskResult = await this.testEndpoint('POST', '/tasks', testTask, true, 'Création d\'une tâche');
        let taskId = null;
        if (taskResult.success) {
            taskId = taskResult.data._id || taskResult.data.id;
        }

        // Test de mise à jour d'une tâche
        if (taskId) {
            await this.testEndpoint('PUT', `/tasks/${taskId}`, {
                title: 'Tâche Test Audit - Modifiée',
                status: 'in_progress'
            }, true, 'Modification d\'une tâche');
        }

        // 6. Test des endpoints admin (si disponibles)
        await this.log('Test des endpoints admin...', 'info');
        await this.testEndpoint('GET', '/admin/users', null, true, 'Admin - Liste des utilisateurs');
        await this.testEndpoint('GET', '/admin/stats', null, true, 'Admin - Statistiques');

        // 7. Test des endpoints de fichiers
        await this.log('Test des endpoints de fichiers...', 'info');
        await this.testEndpoint('GET', '/files', null, true, 'Liste des fichiers');

        // 8. Test des métriques
        await this.log('Test des endpoints de monitoring...', 'info');
        await this.testEndpoint('GET', '/metrics', null, false, 'Métriques Prometheus');

        // 9. Nettoyage - Suppression des données de test
        await this.log('Nettoyage des données de test...', 'info');
        if (taskId) {
            await this.testEndpoint('DELETE', `/tasks/${taskId}`, null, true, 'Suppression tâche de test');
        }
        if (projectId) {
            await this.testEndpoint('DELETE', `/projects/${projectId}`, null, true, 'Suppression projet de test');
        }

        // Résultats finaux
        this.generateReport();
    }

    generateReport() {
        console.log('\n' + '='.repeat(70));
        console.log('📊 RAPPORT D\'AUDIT COMPLET - TaskFlow Pro');
        console.log('='.repeat(70));
        
        console.log(`\n📈 RÉSUMÉ DES TESTS:`);
        console.log(`   ✅ Tests réussis: ${this.results.passed}`);
        console.log(`   ❌ Tests échoués: ${this.results.failed}`);
        console.log(`   📊 Total: ${this.results.passed + this.results.failed}`);
        console.log(`   📊 Taux de réussite: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);

        console.log(`\n🔍 DÉTAIL DES TESTS:`);
        
        // Grouper par statut
        const passedTests = this.results.tests.filter(t => t.status === 'PASS');
        const failedTests = this.results.tests.filter(t => t.status === 'FAIL');

        if (passedTests.length > 0) {
            console.log(`\n✅ FONCTIONNALITÉS OPÉRATIONNELLES (${passedTests.length}):`);
            passedTests.forEach(test => {
                console.log(`   ✓ ${test.endpoint} - ${test.statusCode} - ${test.description}`);
            });
        }

        if (failedTests.length > 0) {
            console.log(`\n❌ PROBLÈMES IDENTIFIÉS (${failedTests.length}):`);
            failedTests.forEach(test => {
                console.log(`   ✗ ${test.endpoint} - ${test.statusCode} - ${test.error}`);
                console.log(`     Description: ${test.description}`);
                if (test.fullError && typeof test.fullError === 'object') {
                    console.log(`     Détail: ${JSON.stringify(test.fullError, null, 2)}`);
                }
                console.log('');
            });
        }

        console.log('\n🎯 ANALYSE PRIORITAIRE:');
        
        // Analyse par criticité
        const criticalIssues = failedTests.filter(t => 
            t.endpoint.includes('/auth/') || 
            t.endpoint.includes('/health') ||
            t.statusCode === 'NO_RESPONSE'
        );

        const functionalIssues = failedTests.filter(t => 
            t.endpoint.includes('/tasks') || 
            t.endpoint.includes('/projects') ||
            t.endpoint.includes('/users')
        );

        const adminIssues = failedTests.filter(t => 
            t.endpoint.includes('/admin/')
        );

        if (criticalIssues.length > 0) {
            console.log(`\n🚨 CRITIQUE - À corriger immédiatement (${criticalIssues.length}):`);
            criticalIssues.forEach(issue => {
                console.log(`   - ${issue.endpoint}: ${issue.error}`);
            });
        }

        if (functionalIssues.length > 0) {
            console.log(`\n⚠️ FONCTIONNEL - Impact utilisateur élevé (${functionalIssues.length}):`);
            functionalIssues.forEach(issue => {
                console.log(`   - ${issue.endpoint}: ${issue.error}`);
            });
        }

        if (adminIssues.length > 0) {
            console.log(`\n🔧 ADMINISTRATION - Impact modéré (${adminIssues.length}):`);
            adminIssues.forEach(issue => {
                console.log(`   - ${issue.endpoint}: ${issue.error}`);
            });
        }

        console.log('\n📋 RECOMMANDATIONS:');
        if (criticalIssues.length > 0) {
            console.log('   1. PRIORITÉ 1: Corriger les problèmes d\'authentification et de connectivité');
        }
        if (functionalIssues.length > 0) {
            console.log('   2. PRIORITÉ 2: Réparer les fonctionnalités CRUD principales');
        }
        if (adminIssues.length > 0) {
            console.log('   3. PRIORITÉ 3: Résoudre les problèmes d\'administration');
        }
        if (failedTests.length === 0) {
            console.log('   🎉 Aucun problème critique détecté - Application fonctionnelle!');
        }

        console.log('\n' + '='.repeat(70));
    }
}

// Exécution de l'audit
async function main() {
    const tester = new PFAApiTester();
    await tester.runAudit();
}

// Gestion des erreurs globales
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

main().catch(console.error);