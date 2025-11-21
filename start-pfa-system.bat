@echo off
echo 🔥 INSTALLATION ET DÉMARRAGE RAPIDE DU SYSTÈME PFA 🔥
echo.

echo 📥 Téléchargement et installation de MongoDB...
echo.

REM Créer le dossier MongoDB
if not exist "C:\mongodb" mkdir C:\mongodb
if not exist "C:\mongodb\data" mkdir C:\mongodb\data
if not exist "C:\mongodb\log" mkdir C:\mongodb\log

echo 📂 Dossiers MongoDB créés

REM Télécharger MongoDB Community (version portable)
echo 🌐 Téléchargement de MongoDB...
powershell -Command "& {Invoke-WebRequest -Uri 'https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-5.0.9.zip' -OutFile 'C:\mongodb\mongodb.zip'}"

echo 📦 Décompression...
powershell -Command "& {Expand-Archive -Path 'C:\mongodb\mongodb.zip' -DestinationPath 'C:\mongodb' -Force}"

echo 🔧 Configuration MongoDB...
echo mongod --dbpath C:\mongodb\data --logpath C:\mongodb\log\mongodb.log --install --serviceName MongoDB > C:\mongodb\install-service.bat

echo ✅ MongoDB prêt à l'utilisation !
echo.
echo 🚀 Démarrage des services PFA...

REM Démarrer MongoDB
start /B C:\mongodb\mongodb-win32-x86_64-5.0.9\bin\mongod.exe --dbpath C:\mongodb\data

timeout /t 3 /nobreak >nul

echo 💾 MongoDB démarré !

REM Démarrer le backend PFA
cd /d "%~dp0backend\src"
start /B node index.js

echo 🖥️  Backend PFA démarré !

REM Démarrer le frontend PFA
cd /d "%~dp0frontend"
start /B npm start

echo 🌐 Frontend PFA démarré !
echo.
echo 🎉 SYSTÈME PFA OPÉRATIONNEL !
echo.
echo 📍 URLs importantes :
echo    - Frontend : http://localhost:4200
echo    - Backend  : http://localhost:5001
echo    - MongoDB  : mongodb://localhost:27017
echo.
echo 🔄 Le système de demandes d'équipe est maintenant fonctionnel !
echo.
pause