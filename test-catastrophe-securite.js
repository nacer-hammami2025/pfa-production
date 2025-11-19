const axios = require('axios');

const PROD_URL = 'https://nacer-dev.me/api';

async function testVulnerabiliteCritique() {
  console.log('🚨 TEST DE VULNÉRABILITÉ CRITIQUE - ESCALADE DE PRIVILÈGES');
  console.log('===========================================================\n');

  try {
    // TENTATIVE 1: Créer un utilisateur en demandant le rôle admin
    console.log('🔍 TEST 1: Tentative création utilisateur avec rôle admin');
    const email = `hacker${Date.now()}@evil.com`;
    
    try {
      const registerRes = await axios.post(`${PROD_URL}/auth/register`, {
        name: 'Hacker Admin',
        email: email,
        password: 'password123',
        role: 'admin'  // 🚨 TENTATIVE D'ESCALADE DE PRIVILÈGES
      }, { timeout: 10000 });

      console.log('❌ VULNÉRABILITÉ CRITIQUE CONFIRMÉE !');
      console.log('Un utilisateur peut s\'inscrire comme admin !');
      console.log('Utilisateur créé:', registerRes.data.user);
      
      if (registerRes.data.user.role === 'admin') {
        console.log('🚨 CATASTROPHE: L\'utilisateur a été créé avec le rôle ADMIN !');
        
        // Tester l'accès aux fonctions admin
        const token = registerRes.data.token;
        try {
          const adminRes = await axios.get(`${PROD_URL}/admin/dashboard-summary`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000
          });
          
          console.log('💀 SÉCURITÉ TOTALEMENT COMPROMISE !');
          console.log('L\'utilisateur malveillant peut accéder au dashboard admin !');
          console.log('Données sensibles accessibles:', Object.keys(adminRes.data));
          
        } catch (adminError) {
          console.log('⚠️ Dashboard bloqué (heureusement):', adminError.response?.data?.msg);
        }
        
      } else {
        console.log('✅ Rôle forcé à:', registerRes.data.user.role);
      }

    } catch (registerError) {
      if (registerError.response?.data?.msg?.includes('role') || registerError.response?.status === 400) {
        console.log('✅ Escalade de privilèges bloquée (sécurité OK)');
        console.log('   Erreur:', registerError.response.data.msg || registerError.response.data.errors?.[0]?.msg);
      } else {
        console.log('❌ Erreur inattendue:', registerError.response?.data || registerError.message);
      }
    }

    // TENTATIVE 2: Créer un utilisateur normal puis tenter de modifier son rôle
    console.log('\n🔍 TEST 2: Création utilisateur normal + tentative modification rôle');
    const normalEmail = `normal${Date.now()}@test.com`;
    
    try {
      const normalRes = await axios.post(`${PROD_URL}/auth/register`, {
        name: 'Normal User',
        email: normalEmail,
        password: 'password123'
      }, { timeout: 10000 });

      console.log('✅ Utilisateur normal créé:', normalRes.data.user.role);
      
      const token = normalRes.data.token;
      
      // Tenter de modifier le profil pour devenir admin
      try {
        const updateRes = await axios.put(`${PROD_URL}/users/profile`, {
          role: 'admin'  // 🚨 TENTATIVE DE MODIFICATION DE RÔLE
        }, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000
        });
        
        console.log('❌ MODIFICATION DE RÔLE POSSIBLE !');
        console.log('Nouveau rôle:', updateRes.data.user?.role);
        
      } catch (updateError) {
        console.log('✅ Modification de rôle bloquée (sécurité OK)');
        console.log('   Erreur:', updateError.response?.data?.msg);
      }

    } catch (normalError) {
      console.log('❌ Impossible de créer utilisateur normal:', normalError.response?.data || normalError.message);
    }

    // TENTATIVE 3: Vérifier les routes admin sans authentification
    console.log('\n🔍 TEST 3: Accès routes admin sans authentification');
    
    try {
      const noAuthRes = await axios.get(`${PROD_URL}/admin/dashboard-summary`, {
        timeout: 10000
      });
      
      console.log('💀 CATASTROPHE: Routes admin accessibles sans authentification !');
      console.log('Données exposées:', Object.keys(noAuthRes.data));
      
    } catch (noAuthError) {
      if (noAuthError.response?.status === 401) {
        console.log('✅ Routes admin protégées (authentification requise)');
      } else {
        console.log('⚠️ Erreur inattendue:', noAuthError.response?.data || noAuthError.message);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }

  console.log('\n🚨 RÉSUMÉ DE L\'AUDIT DE SÉCURITÉ');
  console.log('==================================');
  console.log('Si des vulnérabilités ont été détectées ci-dessus,');
  console.log('votre application est COMPROMISE et nécessite une correction IMMÉDIATE !');
}

testVulnerabiliteCritique();