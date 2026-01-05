# Script de démarrage pour le backend
Write-Host "🚀 Démarrage du backend PFA..." -ForegroundColor Green

# Aller dans le dossier backend
cd "c:\Users\mohamednacer.hammami\Documents\PFA\backend"

# Démarrer le serveur
npm start

# Garder la fenêtre ouverte
Write-Host "`n✅ Backend démarré sur http://localhost:5001" -ForegroundColor Green
Write-Host "📊 Métriques disponibles sur http://localhost:5001/api/metrics" -ForegroundColor Cyan
pause
