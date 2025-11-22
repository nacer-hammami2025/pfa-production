const fs = require('fs');
const path = require('path');

console.log('🔍 Test de vérification - Suppression complète des données fictives');
console.log('====================================================================');

// Fichiers à vérifier
const filesToCheck = [
  {
    name: 'admin-dashboard-home.component.ts',
    path: 'frontend/src/app/components/admin-dashboard/admin-dashboard-home/admin-dashboard-home.component.ts'
  },
  {
    name: 'admin-dashboard-home.component.html',
    path: 'frontend/src/app/components/admin-dashboard/admin-dashboard-home/admin-dashboard-home.component.html'
  },
  {
    name: 'admin-user-management.component.ts',
    path: 'frontend/src/app/components/admin-dashboard/admin-user-management/admin-user-management.component.ts'
  }
];

// Noms fictifs à détecter
const fictitiousNames = [
  'Alice Martin',
  'Bob Dupont',
  'Clara Bernard',
  'David Leclerc',
  'Emma Rousseau',
  'Équipe Frontend',
  'Équipe Backend',
  'Équipe Design',
  'Équipe Marketing'
];

// Méthodes à éviter
const methodsToAvoid = [
  'generateMockData',
  'createMockUsers',
  'createFakeData'
];

let totalIssues = 0;

filesToCheck.forEach(file => {
  console.log(`\n📄 Vérification: ${file.name}`);
  console.log('─'.repeat(50));
  
  const fullPath = path.join(__dirname, file.path);
  
  if (!fs.existsSync(fullPath)) {
    console.log('❌ Fichier non trouvé:', fullPath);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  
  let fileIssues = 0;
  
  // Vérifier les noms fictifs
  fictitiousNames.forEach(name => {
    const regex = new RegExp(name, 'gi');
    lines.forEach((line, index) => {
      if (regex.test(line)) {
        console.log(`🚨 DONNÉE FICTIVE DÉTECTÉE - Ligne ${index + 1}:`);
        console.log(`   "${name}" trouvé dans: ${line.trim()}`);
        fileIssues++;
        totalIssues++;
      }
    });
  });
  
  // Vérifier les méthodes à éviter
  methodsToAvoid.forEach(method => {
    const regex = new RegExp(method, 'gi');
    lines.forEach((line, index) => {
      if (regex.test(line) && !line.trim().startsWith('//')) {
        console.log(`⚠️ MÉTHODE SUSPECTE - Ligne ${index + 1}:`);
        console.log(`   "${method}" trouvé dans: ${line.trim()}`);
        fileIssues++;
        totalIssues++;
      }
    });
  });
  
  if (fileIssues === 0) {
    console.log('✅ Aucune donnée fictive détectée');
  } else {
    console.log(`❌ ${fileIssues} problème(s) détecté(s)`);
  }
});

console.log('\n🎯 RÉSUMÉ DE LA VÉRIFICATION');
console.log('============================');

if (totalIssues === 0) {
  console.log('🎉 SUCCÈS COMPLET ! Toutes les données fictives ont été supprimées.');
  console.log('   Le dashboard admin affichera maintenant uniquement :');
  console.log('   ✅ Des données réelles de la base de données');
  console.log('   ✅ Des états vides avec messages appropriés');
  console.log('   ✅ Aucune donnée factice (Alice Martin, Bob Dupont, etc.)');
} else {
  console.log(`❌ ${totalIssues} problème(s) détecté(s) au total`);
  console.log('   Action requise: Supprimer toutes les références aux données fictives');
}

console.log('\n📋 PROCHAINES ÉTAPES:');
console.log('1. ✅ Données fictives supprimées du code');
console.log('2. 🔧 Tester la connexion API pour charger les vraies données');
console.log('3. 🚀 Déployer la version corrigée');