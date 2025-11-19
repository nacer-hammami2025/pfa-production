const axios = require('axios');

async function testFrontendVersion() {
  console.log('🔍 TEST VERSION FRONTEND\n');
  
  try {
    // Récupérer la page HTML principale
    const response = await axios.get('https://nacer-dev.me', {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html'
      }
    });

    // Chercher les fichiers JS buildés (contiennent des hashes)
    const jsFiles = response.data.match(/main\.[a-f0-9]+\.js/g) || [];
    const runtimeFiles = response.data.match(/runtime\.[a-f0-9]+\.js/g) || [];
    
    console.log('📦 Fichiers JS détectés:');
    console.log('  Main:', jsFiles[0] || 'Non trouvé');
    console.log('  Runtime:', runtimeFiles[0] || 'Non trouvé');
    
    // Vérifier si access-denied est mentionné dans le code
    if (response.data.toLowerCase().includes('access-denied') || 
        response.data.toLowerCase().includes('accessdenied')) {
      console.log('\n✅ Le frontend contient "access-denied" !');
    } else {
      console.log('\n⚠️ Le frontend NE contient PAS "access-denied"');
      console.log('   → Le frontend n\'a pas été rebuilé avec le nouveau code');
    }

    // Vérifier le header Last-Modified
    console.log('\n📅 Dernière modification:', response.headers['last-modified'] || 'Non disponible');
    console.log('🖥️ Server:', response.headers['server'] || 'Non disponible');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testFrontendVersion();
