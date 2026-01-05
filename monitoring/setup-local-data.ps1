# Script pour générer des données de test dans MongoDB local
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Création de Données de Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Arrêter le backend
Write-Host "1️⃣  Arrêt du backend..." -ForegroundColor Yellow
$port = netstat -ano | findstr ":5001.*LISTENING"
if ($port) {
    $pid = ($port -split '\s+')[-1]
    if ($pid -ne "0") {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Backend arrêté" -ForegroundColor Green
    }
}

# Modifier le .env pour MongoDB local
Write-Host "`n2️⃣  Configuration MongoDB local..." -ForegroundColor Yellow
$envPath = "c:\Users\mohamednacer.hammami\Documents\PFA\backend\.env"
$content = Get-Content $envPath
$content = $content -replace '^MONGODB_URI=mongodb\+srv.*', '# MONGODB_URI=mongodb+srv://mohamednacerhammami:Hammami2025@devdashcluster.wksgu.mongodb.net/DevDashboard?retryWrites=true&w=majority&serverSelectionTimeoutMS=30000&connectTimeoutMS=30000'
$content = $content -replace '^# MONGODB_URI=mongodb://localhost:27017/DevDashboard', 'MONGODB_URI=mongodb://localhost:27017/DevDashboard'
if (-not ($content -match 'MONGODB_URI=mongodb://localhost:27017/DevDashboard')) {
    $content = $content -replace '^# MONGODB_URI=mongodb://localhost.*', 'MONGODB_URI=mongodb://localhost:27017/DevDashboard'
}
$content | Set-Content $envPath
Write-Host "✅ .env mis à jour" -ForegroundColor Green

# Démarrer MongoDB local
Write-Host "`n3️⃣  Démarrage MongoDB local..." -ForegroundColor Yellow
docker start mongodb-test
Start-Sleep -Seconds 3
Write-Host "✅ MongoDB démarré" -ForegroundColor Green

# Créer un script Node.js pour insérer des données
Write-Host "`n4️⃣  Création des données de test..." -ForegroundColor Yellow

$seedScript = @"
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/DevDashboard')
  .then(async () => {
    console.log('✅ Connecté à MongoDB');
    
    // Créer des projets
    const Project = mongoose.model('Project', new mongoose.Schema({
      name: String,
      description: String,
      owner: mongoose.Schema.Types.ObjectId,
      status: String,
      priority: String,
      progress: Number,
      members: [mongoose.Schema.Types.ObjectId],
      tasks: [mongoose.Schema.Types.ObjectId]
    }));
    
    // Créer des tâches
    const Task = mongoose.model('Task', new mongoose.Schema({
      title: String,
      description: String,
      completed: Boolean,
      status: String,
      priority: String,
      category: String,
      owner: mongoose.Schema.Types.ObjectId
    }));
    
    // Créer des équipes
    const Team = mongoose.model('Team', new mongoose.Schema({
      name: String,
      description: String,
      members: [mongoose.Schema.Types.ObjectId],
      isActive: Boolean
    }));
    
    // Supprimer les données existantes
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Team.deleteMany({});
    
    console.log('📊 Insertion de 3 projets...');
    await Project.insertMany([
      { name: 'Monitoring Server', description: 'Configuration Grafana & Prometheus', status: 'completed', priority: 'critical', progress: 100, members: [], tasks: [] },
      { name: 'Cloud Native', description: 'Discover cloud revolution migration', status: 'in-progress', priority: 'high', progress: 65, members: [], tasks: [] },
      { name: 'DevOps Pipeline', description: 'CI/CD avec GitHub Actions', status: 'planning', priority: 'medium', progress: 20, members: [], tasks: [] }
    ]);
    
    console.log('✅ Insertion de 10 tâches...');
    await Task.insertMany([
      { title: 'Configurer Prometheus', description: 'Setup scraping', completed: true, status: 'DONE', priority: 'high', category: 'work' },
      { title: 'Créer dashboards Grafana', description: 'Métriques système', completed: true, status: 'DONE', priority: 'high', category: 'work' },
      { title: 'Oracle Exam', description: 'Préparer certification', completed: false, status: 'IN_PROGRESS', priority: 'urgent', category: 'education' },
      { title: 'Migrer vers Cloud', description: 'AWS migration', completed: false, status: 'TODO', priority: 'high', category: 'work' },
      { title: 'Documenter API', description: 'Swagger docs', completed: false, status: 'TODO', priority: 'medium', category: 'work' },
      { title: 'Code review', description: 'Review PR#234', completed: false, status: 'IN_PROGRESS', priority: 'medium', category: 'work' },
      { title: 'Tests unitaires', description: 'Couverture 80%', completed: false, status: 'TODO', priority: 'low', category: 'work' },
      { title: 'Backup DB', description: 'Script automatique', completed: true, status: 'DONE', priority: 'critical', category: 'work' },
      { title: 'Réunion équipe', description: 'Sprint planning', completed: false, status: 'TODO', priority: 'high', category: 'meeting' },
      { title: 'Formation Docker', description: 'Containers 101', completed: false, status: 'IN_PROGRESS', priority: 'medium', category: 'education' }
    ]);
    
    console.log('👥 Insertion de 2 équipes...');
    await Team.insertMany([
      { name: 'DevOps Team', description: 'Infrastructure & Monitoring', members: [], isActive: true },
      { name: 'Backend Team', description: 'API Development', members: [], isActive: true }
    ]);
    
    console.log('`n✅ Données créées avec succès!');
    console.log('📊 Résumé:');
    console.log('  - 3 projets');
    console.log('  - 10 tâches (3 TODO, 4 IN_PROGRESS, 3 DONE)');
    console.log('  - 2 équipes');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  });
"@

$seedScript | Set-Content "c:\Users\mohamednacer.hammami\Documents\PFA\backend\seed-data.js"

cd "c:\Users\mohamednacer.hammami\Documents\PFA\backend"
node seed-data.js

Write-Host "`n5️⃣  Démarrage du backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\mohamednacer.hammami\Documents\PFA\backend'; Write-Host '🚀 Backend avec données de test' -ForegroundColor Green; npm start"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✅ Configuration Terminée!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "📊 Attendez 10 secondes puis rafraîchissez Grafana" -ForegroundColor Green
Write-Host "🌐 http://localhost:3001" -ForegroundColor Cyan
