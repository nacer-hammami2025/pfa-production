# Script de démarrage TaskFlow Pro
param(
    [switch]$SkipInstall,
    [switch]$SkipBuild
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "=== TaskFlow Pro - Démarrage automatique ===" -ForegroundColor Green

function Invoke-NpmCommand {
    param(
        [string]$WorkingDirectory,
        [string[]]$Arguments,
        [string]$Message
    )

    Write-Host $Message -ForegroundColor Cyan
    Push-Location $WorkingDirectory
    try {
        $npmPath = Join-Path $env:APPDATA 'npm\npm.cmd'
        if (-not (Test-Path $npmPath)) {
            $npmPath = 'npm'
        }
        & $npmPath @Arguments
        if ($LASTEXITCODE -ne 0) {
            throw "La commande npm $($Arguments -join ' ') a échoué (code $LASTEXITCODE)."
        }
    }
    finally {
        Pop-Location
    }
}

function Install-DependenciesIfNeeded {
    param(
        [string]$Name,
        [string]$WorkingDirectory
    )

    if ($SkipInstall) {
        Write-Host "⏭️  Installation des dépendances $Name ignorée (--SkipInstall)." -ForegroundColor DarkGray
        return
    }

    $modulesPath = Join-Path $WorkingDirectory 'node_modules'
    if (Test-Path $modulesPath) {
        Write-Host "✅ Dépendances $Name déjà installées." -ForegroundColor DarkGray
    }
    else {
        Invoke-NpmCommand -WorkingDirectory $WorkingDirectory -Arguments @('install') -Message "⬇️  Installation des dépendances $Name..."
    }
}

function Stop-WorkspaceProcesses {
    param([string]$WorkspacePath)

    Write-Host "🛑 Arrêt des processus Node liés au workspace..." -ForegroundColor Yellow
    $escapedPath = $WorkspacePath.ToLower()
    $nodeProcesses = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and $_.CommandLine.ToLower().Contains($escapedPath.ToLower()) }

    foreach ($proc in $nodeProcesses) {
        try {
            Stop-Process -Id $proc.ProcessId -Force -ErrorAction Stop
            Write-Host "  • Processus arrêté (PID: $($proc.ProcessId))" -ForegroundColor DarkGray
        }
        catch {
            Write-Host "  • Impossible d'arrêter le processus PID $($proc.ProcessId) : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

function Start-BackgroundProcess {
    param(
        [string]$Name,
        [string]$FilePath,
        [string[]]$Arguments,
        [string]$WorkingDirectory
    )

    Write-Host "🚀 Démarrage de $Name..." -ForegroundColor Yellow
    try {
        $process = Start-Process -FilePath $FilePath -ArgumentList $Arguments -WorkingDirectory $WorkingDirectory -NoNewWindow -PassThru
        Write-Host "$Name démarré (PID: $($process.Id))" -ForegroundColor Green
        return $process
    }
    catch {
        Write-Host "❌ Échec du démarrage de $Name : $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

$workspacePath = "C:\Users\mohamednacer.hammami\Documents\PFA"
$backendPath = Join-Path $workspacePath 'backend'
$frontendPath = Join-Path $workspacePath 'frontend'

$backendProcess = $null
$frontendProcess = $null

Stop-WorkspaceProcesses -WorkspacePath $workspacePath

Install-DependenciesIfNeeded -Name 'backend' -WorkingDirectory $backendPath
Install-DependenciesIfNeeded -Name 'frontend' -WorkingDirectory $frontendPath

if (-not $SkipBuild) {
    Invoke-NpmCommand -WorkingDirectory $frontendPath -Arguments @('run', 'build') -Message "🏗️  Compilation du frontend (production)..."
}
else {
    Write-Host "⏭️  Compilation du frontend ignorée (--SkipBuild)." -ForegroundColor DarkGray
}

$backendProcess = Start-BackgroundProcess -Name 'backend (npm run dev)' -FilePath 'npm.cmd' -Arguments @('run', 'dev') -WorkingDirectory $backendPath

Start-Sleep -Seconds 5

$ngExecutable = Join-Path $frontendPath 'node_modules\.bin\ng.ps1'
if (-not (Test-Path $ngExecutable)) {
    throw "Impossible de trouver $ngExecutable. Assurez-vous que les dépendances frontend sont installées."
}

$frontendProcess = Start-BackgroundProcess -Name 'frontend (ng serve)' -FilePath 'powershell.exe' -Arguments @('-Command', "& '$ngExecutable' serve --host 0.0.0.0 --port 4200") -WorkingDirectory $frontendPath

Start-Sleep -Seconds 10

Write-Host "=== Test des connexions ===" -ForegroundColor Cyan

try {
    $backendResponse = Invoke-WebRequest -Uri 'http://localhost:5001/' -Method GET -TimeoutSec 5
    Write-Host "✅ Backend accessible : $($backendResponse.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Backend inaccessible : $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $frontendResponse = Invoke-WebRequest -Uri 'http://localhost:4200' -Method GET -TimeoutSec 5
    Write-Host "✅ Frontend accessible : $($frontendResponse.StatusCode)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Frontend inaccessible : $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "=== Serveurs démarrés ===" -ForegroundColor Green
Write-Host "Backend : http://localhost:5001" -ForegroundColor White
Write-Host "Frontend : http://localhost:4200" -ForegroundColor White
Write-Host "Appuyez sur Ctrl+C pour arrêter les serveurs" -ForegroundColor Yellow

try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "Arrêt des serveurs..." -ForegroundColor Yellow
    if ($backendProcess) { Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue }
    if ($frontendProcess) { Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue }
}