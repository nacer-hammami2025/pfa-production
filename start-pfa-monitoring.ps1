# Script de démarrage rapide pour PFA Monitoring
# Usage: .\start-pfa-monitoring.ps1

Write-Host "🚀 Démarrage du Monitoring PFA..." -ForegroundColor Green

# Démarrer Docker Desktop si nécessaire
try {
    docker ps > $null
    Write-Host "✅ Docker Desktop déjà actif" -ForegroundColor Green
} catch {
    Write-Host "🔄 Démarrage de Docker Desktop..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    # Attendre que Docker soit prêt
    $timeout = 60
    $elapsed = 0
    while ($elapsed -lt $timeout) {
        try {
            docker ps > $null
            break
        } catch {
            Start-Sleep 5
            $elapsed += 5
            Write-Host "⏳ Attente Docker... ($elapsed/$timeout secondes)" -ForegroundColor Yellow
        }
    }
}

# Vérifier les conteneurs
Write-Host "🔍 Vérification des conteneurs..." -ForegroundColor Cyan
$containers = docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
Write-Host $containers

# Ouvrir les dashboards
Write-Host "🌐 Ouverture des dashboards..." -ForegroundColor Magenta
Start-Process "http://localhost:3000"
Start-Process "http://localhost:9090"

Write-Host "`n🎯 Stack PFA Monitoring démarrée avec succès !" -ForegroundColor Green
Write-Host "📊 Grafana: http://localhost:3000 (admin/admin)" -ForegroundColor White
Write-Host "📈 Prometheus: http://localhost:9090" -ForegroundColor White
Write-Host "🚀 Production: https://nacer-dev.me" -ForegroundColor White