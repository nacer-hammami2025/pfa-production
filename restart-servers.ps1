# Script pour arrêter et redémarrer proprement les serveurs frontend et backend

Write-Output "--- Arrêt des processus existants sur les ports 4200 et 5001 ---"

# Arrêter le processus sur le port 5001 (Backend)
$backendConn = Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue
if ($backendConn) {
    $backendPid = $backendConn.OwningProcess
    Write-Output "Processus trouvé sur le port 5001 (PID: $backendPid). Tentative d'arrêt..."
    Stop-Process -Id $backendPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Output "Processus sur le port 5001 arrêté."
} else {
    Write-Output "Aucun processus trouvé sur le port 5001."
}

# Arrêter le processus sur le port 4200 (Frontend)
$frontendConn = Get-NetTCPConnection -LocalPort 4200 -ErrorAction SilentlyContinue
if ($frontendConn) {
    $frontendPid = $frontendConn.OwningProcess
    Write-Output "Processus trouvé sur le port 4200 (PID: $frontendPid). Tentative d'arrêt..."
    Stop-Process -Id $frontendPid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
    Write-Output "Processus sur le port 4200 arrêté."
} else {
    Write-Output "Aucun processus trouvé sur le port 4200."
}

# Tuer tous les processus Node.js restants par sécurité
Write-Output "--- Arrêt de tous les processus Node.js restants ---"
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Output "Processus Node.js restants arrêtés."

Start-Sleep -Seconds 2

# Démarrer le serveur backend
Write-Output "--- Démarrage du serveur Backend (port 5001) ---"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\mohamednacer.hammami\Documents\PFA\backend'; npm start"

Start-Sleep -Seconds 5 # Attendre que le backend soit prêt

# Démarrer le serveur frontend
Write-Output "--- Démarrage du serveur Frontend (port 4200) ---"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\mohamednacer.hammami\Documents\PFA\frontend'; npm start"

Write-Output "--- Les serveurs ont été redémarrés dans de nouvelles fenêtres PowerShell. ---"
