# Script de test complet pour les métriques PFA
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test des Métriques PFA Backend" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$backendUrl = "http://localhost:5001"
$maxWait = 30

# 1. Attendre que le backend soit prêt
Write-Host "⏳ Attente du démarrage du backend..." -ForegroundColor Yellow
$waited = 0
$ready = $false

while (-not $ready -and $waited -lt $maxWait) {
    try {
        $health = Invoke-RestMethod -Uri "$backendUrl/api/health" -Method Get -ErrorAction SilentlyContinue
        if ($health.status -eq "OK") {
            $ready = $true
            Write-Host "✅ Backend prêt!" -ForegroundColor Green
        }
    } catch {
        Start-Sleep -Seconds 2
        $waited += 2
        Write-Host "." -NoNewline
    }
}

if (-not $ready) {
    Write-Host "`n❌ Backend ne répond pas après ${maxWait}s" -ForegroundColor Red
    Write-Host "Vérifiez la fenêtre PowerShell du backend" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📊 Génération d'activité pour les métriques...`n" -ForegroundColor Cyan

# 2. Générer du trafic sur différents endpoints
$endpoints = @(
    @{url="/api/health"; name="Health Check"},
    @{url="/api/metrics"; name="Metrics"}
)

Write-Host "🔄 Envoi de 20 requêtes..." -ForegroundColor Yellow
for ($i = 1; $i -le 20; $i++) {
    foreach ($ep in $endpoints) {
        try {
            Invoke-RestMethod -Uri "$backendUrl$($ep.url)" -Method Get -ErrorAction SilentlyContinue | Out-Null
            Write-Host "✅ [$i/20] $($ep.name)" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  [$i/20] $($ep.name) - Erreur" -ForegroundColor Yellow
        }
    }
    Start-Sleep -Milliseconds 300
}

# 3. Vérifier les métriques disponibles
Write-Host "`n📈 Vérification des métriques Prometheus...`n" -ForegroundColor Cyan

try {
    $metrics = Invoke-RestMethod -Uri "$backendUrl/api/metrics" -Method Get
    
    $metricsList = @(
        "http_requests_total",
        "http_request_duration_seconds",
        "pfa_tasks_total",
        "pfa_projects_total",
        "pfa_teams_total",
        "pfa_notifications_total",
        "pfa_user_activity_total",
        "mongodb_connections_current",
        "nodejs_heap_size_used_bytes"
    )
    
    foreach ($metric in $metricsList) {
        if ($metrics -match $metric) {
            Write-Host "✅ $metric" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $metric (pas encore de données)" -ForegroundColor Yellow
        }
    }
    
} catch {
    Write-Host "❌ Impossible de récupérer les métriques" -ForegroundColor Red
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Test Terminé!" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "🌐 Ouvrez Grafana: http://localhost:3001" -ForegroundColor Green
Write-Host "🔍 Prometheus Targets: http://localhost:9090/targets" -ForegroundColor Yellow
Write-Host "📊 Prometheus Graph: http://localhost:9090/graph" -ForegroundColor Cyan

Write-Host "`nAppuyez sur une touche pour continuer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
