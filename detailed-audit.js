const axios = require('axios');

const BASE_URL = 'https://nacer-dev.me/api';

class DetailedApiTester {
    constructor() {
        this.authToken = null;
        this.testUserId = null;
    }

    async testAuth() {
        console.log('\n=== TEST D\'AUTHENTIFICATION DÉTAILLÉ ===');
        
        // 1. Test d'inscription
        const testUser = {
            name: 'Test Détaillé',
            email: `test.detailed.${Date.now()}@example.com`,
            password: 'TestPassword123!'
        };

        try {
            const registerRes = await axios.post(`${BASE_URL}/auth/register`, testUser);
            console.log('✅ Inscription réussie:', registerRes.status);
        } catch (error) {
            console.log('❌ Échec inscription:', error.response?.status, error.response?.data);
            return false;
        }

        // 2. Test de connexion
        try {
            const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
                email: testUser.email,
                password: testUser.password
            });
            console.log('✅ Connexion réussie:', loginRes.status);
            this.authToken = loginRes.data.token;
            this.testUserId = loginRes.data.user?._id || loginRes.data.user?.id;
            console.log('   Token obtenu:', this.authToken ? 'Oui' : 'Non');
            console.log('   User ID:', this.testUserId);
            return true;
        } catch (error) {
            console.log('❌ Échec connexion:', error.response?.status, error.response?.data);
            return false;
        }
    }

    async testUserRoutes() {
        console.log('\n=== TEST DES ROUTES UTILISATEURS ===');
        
        if (!this.authToken) {
            console.log('❌ Impossible de tester - pas de token d\'authentification');
            return;
        }

        const headers = {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
        };

        // Test des vraies routes disponibles
        const routes = [
            { method: 'GET', path: '/users/mfa/status', desc: 'Statut MFA' },
            { method: 'PUT', path: '/users/profile', desc: 'Mise à jour profil' },
            { method: 'POST', path: '/users/profile/photo', desc: 'Upload photo profil' }
        ];

        for (const route of routes) {
            try {
                let response;
                if (route.method === 'GET') {
                    response = await axios.get(`${BASE_URL}${route.path}`, { headers });
                } else if (route.method === 'PUT' && route.path === '/users/profile') {
                    response = await axios.put(`${BASE_URL}${route.path}`, {
                        name: 'Nom modifié'
                    }, { headers });
                } else {
                    console.log(`⏭️  Saut ${route.method} ${route.path} (nécessite données spéciales)`);
                    continue;
                }
                console.log(`✅ ${route.method} ${route.path} - ${response.status} - ${route.desc}`);
            } catch (error) {
                console.log(`❌ ${route.method} ${route.path} - ${error.response?.status} - ${error.response?.data?.message || error.message}`);
            }
        }
    }

    async testAvailableEndpoints() {
        console.log('\n=== DÉCOUVERTE DES ENDPOINTS DISPONIBLES ===');
        
        // Routes supposées disponibles basées sur l'architecture
        const potentialRoutes = [
            // Auth routes
            { path: '/auth/register', method: 'POST', desc: 'Inscription' },
            { path: '/auth/login', method: 'POST', desc: 'Connexion' },
            { path: '/auth/forgot-password', method: 'POST', desc: 'Mot de passe oublié' },
            { path: '/auth/reset-password', method: 'POST', desc: 'Reset mot de passe' },
            
            // Admin routes (nécessitent privilèges admin)
            { path: '/admin/users', method: 'GET', desc: 'Liste admin utilisateurs', requiresAdmin: true },
            { path: '/admin/stats', method: 'GET', desc: 'Statistiques admin', requiresAdmin: true },
            
            // Projects routes
            { path: '/projects', method: 'GET', desc: 'Liste projets', requiresAuth: true },
            { path: '/projects', method: 'POST', desc: 'Créer projet', requiresAuth: true },
            
            // Tasks routes
            { path: '/tasks', method: 'GET', desc: 'Liste tâches', requiresAuth: true },
            { path: '/tasks', method: 'POST', desc: 'Créer tâche', requiresAuth: true },
            
            // Files routes
            { path: '/files', method: 'GET', desc: 'Liste fichiers', requiresAuth: true },
            
            // Teams routes (potentielle)
            { path: '/teams', method: 'GET', desc: 'Liste équipes', requiresAuth: true },
            
            // Notifications routes (potentielle)
            { path: '/notifications', method: 'GET', desc: 'Notifications', requiresAuth: true },
            
            // Time tracking routes (potentielle)
            { path: '/time-tracking', method: 'GET', desc: 'Suivi temps', requiresAuth: true },
            
            // Health et metrics
            { path: '/health', method: 'GET', desc: 'Santé application' },
            { path: '/metrics', method: 'GET', desc: 'Métriques Prometheus' }
        ];

        console.log('\n📋 Routes testées avec authentification:');
        for (const route of potentialRoutes.filter(r => r.requiresAuth && !r.requiresAdmin)) {
            await this.quickTest(route);
        }

        console.log('\n🔒 Routes admin (attendu 403):');
        for (const route of potentialRoutes.filter(r => r.requiresAdmin)) {
            await this.quickTest(route);
        }

        console.log('\n🌐 Routes publiques:');
        for (const route of potentialRoutes.filter(r => !r.requiresAuth && !r.requiresAdmin)) {
            await this.quickTest(route, false);
        }
    }

    async quickTest(route, useAuth = true) {
        try {
            const headers = useAuth && this.authToken ? {
                'Authorization': `Bearer ${this.authToken}`,
                'Content-Type': 'application/json'
            } : { 'Content-Type': 'application/json' };

            let response;
            if (route.method === 'GET') {
                response = await axios.get(`${BASE_URL}${route.path}`, { headers });
            } else if (route.method === 'POST') {
                // Données minimales pour POST
                const data = route.path.includes('/auth/') ? {} : { name: 'Test' };
                response = await axios.post(`${BASE_URL}${route.path}`, data, { headers });
            }

            console.log(`   ✅ ${route.method} ${route.path} - ${response.status} - ${route.desc}`);
        } catch (error) {
            const status = error.response?.status || 'NO_RESPONSE';
            const message = error.response?.data?.message || error.response?.data?.msg || error.message;
            
            if (status === 403 && route.requiresAdmin) {
                console.log(`   🔒 ${route.method} ${route.path} - ${status} - ${route.desc} (Attendu: accès refusé)`);
            } else if (status === 404) {
                console.log(`   ❌ ${route.method} ${route.path} - ${status} - ${route.desc} (Route non trouvée)`);
            } else if (status === 400 || status === 422) {
                console.log(`   ⚠️  ${route.method} ${route.path} - ${status} - ${route.desc} (Erreur de validation)`);
            } else {
                console.log(`   ❌ ${route.method} ${route.path} - ${status} - ${message} - ${route.desc}`);
            }
        }
    }

    async testFrontendAccess() {
        console.log('\n=== TEST D\'ACCÈS FRONTEND ===');
        
        try {
            const response = await axios.get('https://nacer-dev.me/', {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            
            console.log(`✅ Site principal accessible - ${response.status}`);
            
            // Vérifier si c'est bien Angular
            const content = response.data;
            if (content.includes('<app-root>') || content.includes('Angular')) {
                console.log('   ✅ Application Angular détectée');
            } else if (content.includes('Cannot GET') || content.includes('Express')) {
                console.log('   ⚠️  Semble être une réponse Express, pas Angular');
            } else {
                console.log('   ❓ Type d\'application non identifié');
            }
            
        } catch (error) {
            console.log(`❌ Site principal inaccessible - ${error.response?.status || error.message}`);
        }
    }

    async run() {
        console.log('🔍 AUDIT DÉTAILLÉ - TaskFlow Pro');
        console.log('='.repeat(50));
        
        await this.testFrontendAccess();
        
        const authSuccess = await this.testAuth();
        
        if (authSuccess) {
            await this.testUserRoutes();
        }
        
        await this.testAvailableEndpoints();
        
        console.log('\n' + '='.repeat(50));
        console.log('🎯 RÉSUMÉ DES PROBLÈMES IDENTIFIÉS');
        console.log('='.repeat(50));
    }
}

async function main() {
    const tester = new DetailedApiTester();
    await tester.run();
}

main().catch(console.error);