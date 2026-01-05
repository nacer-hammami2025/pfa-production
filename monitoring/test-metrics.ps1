# Script de test pour générer des métriques
Write-Host "🚀 Génération de trafic pour tester le monitoring..." -ForegroundColor Cyan

$endpoints = @(
    "http://localhost:5001/api/health",
    "http://localhost:5001/api/metrics"
)

Write-Host "`n📊 Envoi de 20 requêtes..."

for ($i = 1; $i -le 20; $i++) {
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-RestMethod -Uri $endpoint -Method Get -ErrorAction SilentlyContinue
            Write-Host "✅ [$i/20] $endpoint" -ForegroundColor Green
        } catch {
            Write-Host "❌ [$i/20] $endpoint - Erreur" -ForegroundColor Red
        }
    }
    Start-Sleep -Milliseconds 500
}

Write-Host "`n✅ Test terminé!" -ForegroundColor Green
Write-Host "📈 Rafraîchissez Grafana: http://localhost:3001" -ForegroundColor Cyan
Write-Host "🔍 Vérifiez Prometheus: http://localhost:9090/graph" -ForegroundColor Yellow
