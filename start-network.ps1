# Script pour demarrer l'application avec detection automatique de l'IP locale
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Demarrage de TaskFlow" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Fonction pour obtenir l'IP locale principale
function Get-LocalIP {
    $networkAdapters = Get-NetIPAddress -AddressFamily IPv4 | 
        Where-Object { 
            $_.InterfaceAlias -notlike "*Loopback*" -and 
            $_.IPAddress -notlike "169.254.*" -and
            $_.AddressState -eq "Preferred"
        } | 
        Sort-Object -Property InterfaceIndex | 
        Select-Object -First 1
    
    if ($networkAdapters) {
        return $networkAdapters.IPAddress
    }
    return "localhost"
}

# Detecter l'IP locale
$localIP = Get-LocalIP
Write-Host ""
Write-Host "IP locale detectee: $localIP" -ForegroundColor Green
Write-Host ""

# Afficher les informations reseau
Write-Host "Informations reseau:" -ForegroundColor Yellow
Write-Host "   - Backend:  http://${localIP}:5001" -ForegroundColor White
Write-Host "   - Frontend: http://${localIP}:4200" -ForegroundColor White
Write-Host ""

# Arreter les processus Node.js existants
Write-Host "Arret des processus existants..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2
Write-Host "   Processus arretes" -ForegroundColor Green
Write-Host ""

# Demarrer le backend
Write-Host "Demarrage du backend..." -ForegroundColor Cyan
$backendCmd = "cd '$PWD\backend'; Write-Host ''; Write-Host '========================================' -ForegroundColor Green; Write-Host 'Backend demarre sur http://${localIP}:5001' -ForegroundColor Green; Write-Host '========================================' -ForegroundColor Green; Write-Host ''; npm start"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCmd

# Attendre que le backend demarre
Write-Host "   Attente du backend (5 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host "   Backend demarre" -ForegroundColor Green
Write-Host ""

# Demarrer le frontend
Write-Host "Demarrage du frontend..." -ForegroundColor Cyan
$frontendCmd = "cd '$PWD\frontend'; Write-Host ''; Write-Host '========================================' -ForegroundColor Green; Write-Host 'Frontend demarre sur http://${localIP}:4200' -ForegroundColor Green; Write-Host '========================================' -ForegroundColor Green; Write-Host ''; npm start"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $frontendCmd

Write-Host "   Attente du frontend (3 secondes)..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Write-Host "   Frontend demarre" -ForegroundColor Green
Write-Host ""

# Afficher les URLs d'acces
Write-Host "================================" -ForegroundColor Green
Write-Host "Application demarree!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Acces depuis ce PC:" -ForegroundColor Cyan
Write-Host "   http://localhost:4200" -ForegroundColor White
Write-Host ""
Write-Host "Acces depuis le reseau:" -ForegroundColor Cyan
Write-Host "   http://${localIP}:4200" -ForegroundColor White
Write-Host ""
Write-Host "Partagez cette URL avec d'autres appareils sur votre reseau!" -ForegroundColor Yellow
Write-Host ""

# Ouvrir le navigateur
Write-Host "Ouverture du navigateur..." -ForegroundColor Cyan
Start-Sleep -Seconds 2
Start-Process "http://${localIP}:4200"

Write-Host ""
Write-Host "Les serveurs tournent en arriere-plan." -ForegroundColor Green
Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown')
