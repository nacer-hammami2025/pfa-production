# Script pour démarrer le backend et le frontend
Write-Host "🚀 Démarrage de l'application TaskFlow..." -ForegroundColor Cyan

# Arrêter tous les processus Node en cours
Write-Host "`n🛑 Arrêt des processus en cours..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 3

# Démarrer le backend
Write-Host "`n⚙️  Démarrage du backend (port 5001)..." -ForegroundColor Green
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendPath'; npm start" -WindowStyle Normal

# Attendre que le backend démarre
Write-Host "⏳ Attente du démarrage du backend..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Démarrer le frontend
Write-Host "`n🎨 Démarrage du frontend (port 4200)..." -ForegroundColor Green
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$frontendPath'; npm start" -WindowStyle Normal

Write-Host "`n✅ Application démarrée!" -ForegroundColor Cyan
Write-Host "📱 Frontend: http://localhost:4200" -ForegroundColor White
Write-Host "⚙️  Backend: http://localhost:5001" -ForegroundColor White
Write-Host "`n⏳ Attendre ~15 secondes que tout démarre complètement..." -ForegroundColor Yellow
Write-Host "ℹ️  Les serveurs s'exécutent dans des fenêtres séparées" -ForegroundColor Gray
Write-Host "`n🌐 Ouvrez votre navigateur sur http://localhost:4200 dans quelques secondes..." -ForegroundColor Cyan
