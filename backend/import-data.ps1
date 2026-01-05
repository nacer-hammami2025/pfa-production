# Script pour créer des données de test dans MongoDB local
# Ceci créera des données similaires à votre base Atlas

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Import de donnees de test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Vérifier que MongoDB local tourne
Write-Host "Verification de MongoDB local..." -ForegroundColor Yellow
$mongoRunning = docker ps | Select-String "mongodb-test"
if (-not $mongoRunning) {
    Write-Host "Demarrage de MongoDB..." -ForegroundColor Yellow
    docker start mongodb-test
    Start-Sleep -Seconds 3
}

Write-Host "`nPour importer vos vraies donnees:" -ForegroundColor Green
Write-Host "1. Ouvrez MongoDB Compass" -ForegroundColor White
Write-Host "2. Connectez-vous a Atlas:" -ForegroundColor White
Write-Host "   mongodb+srv://mohamednacerhammami:Hammami2025@devdashcluster.wksgu.mongodb.net/DevDashboard" -ForegroundColor Gray
Write-Host "3. Exportez chaque collection (projects, tasks, users, teams)" -ForegroundColor White
Write-Host "4. Connectez-vous a local: mongodb://localhost:27017" -ForegroundColor White
Write-Host "5. Importez les fichiers dans la base 'DevDashboard'" -ForegroundColor White

Write-Host "`nOu utilisez ce script Node.js pour copier automatiquement..." -ForegroundColor Yellow
Write-Host "(Necessiterait que votre PC puisse se connecter a Atlas)" -ForegroundColor Gray
