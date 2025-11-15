# 🌐 Configuration Réseau TaskFlow

## 🚀 Démarrage avec détection automatique d'IP

### Option 1: Script automatique (Recommandé)

Exécutez simplement le script PowerShell qui détecte automatiquement votre IP locale :

```powershell
.\start-network.ps1
```

Ce script va :
- ✅ Détecter automatiquement votre IP locale
- ✅ Configurer le backend avec CORS approprié
- ✅ Démarrer le backend sur `0.0.0.0:5001`
- ✅ Démarrer le frontend sur `0.0.0.0:4200`
- ✅ Afficher les URLs d'accès (local et réseau)
- ✅ Ouvrir automatiquement le navigateur

### Option 2: Démarrage manuel

#### Backend (Terminal 1)
```powershell
cd backend
npm start
```

#### Frontend (Terminal 2)
```powershell
cd frontend
npm start
```

## 📱 Accès depuis différents appareils

### Depuis votre PC
```
http://localhost:4200
```

### Depuis d'autres appareils sur le même réseau
```
http://[VOTRE_IP_LOCALE]:4200
```

Exemple : `http://192.168.1.100:4200`

## 🔍 Comment trouver votre IP locale ?

### Windows (PowerShell)
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -notlike "*Loopback*"} | Select-Object IPAddress, InterfaceAlias
```

### Windows (CMD)
```cmd
ipconfig | findstr IPv4
```

## 🛡️ Configuration du pare-feu Windows

Pour permettre l'accès depuis le réseau, ajoutez des règles de pare-feu :

```powershell
# Autoriser le port 4200 (Frontend)
New-NetFirewallRule -DisplayName "TaskFlow Frontend" -Direction Inbound -LocalPort 4200 -Protocol TCP -Action Allow

# Autoriser le port 5001 (Backend)
New-NetFirewallRule -DisplayName "TaskFlow Backend" -Direction Inbound -LocalPort 5001 -Protocol TCP -Action Allow
```

## 🔧 Configuration technique

### Frontend (Angular)
- Écoute sur `0.0.0.0:4200` (toutes les interfaces réseau)
- Option `--disable-host-check` pour accepter les connexions réseau
- Proxy configuré pour rediriger `/api` vers le backend

### Backend (Node.js/Express)
- Écoute sur `0.0.0.0:5001` (toutes les interfaces réseau)
- CORS configuré dynamiquement avec détection d'IP
- Accepte les requêtes depuis:
  - `localhost:4200`
  - `127.0.0.1:4200`
  - `[IP_LOCALE]:4200`

## 📝 Détection automatique d'IP

Le backend utilise le module natif `os` de Node.js pour détecter l'IP locale :

```javascript
const { networkInterfaces } = require('os');
// Détection automatique de l'interface réseau active
```

Le script PowerShell utilise :
```powershell
Get-NetIPAddress -AddressFamily IPv4
# Filtre les interfaces Loopback et APIPA
```

## 🔄 Changement d'IP automatique

✅ **Le système détecte automatiquement les changements d'IP au démarrage**

Si votre IP change (nouveau réseau WiFi, reconnexion, etc.) :
1. Arrêtez les serveurs
2. Relancez `.\start-network.ps1`
3. Le système détectera la nouvelle IP automatiquement

## 🌐 Accès depuis un téléphone/tablette

1. Assurez-vous que votre appareil est sur le **même réseau WiFi**
2. Lancez l'application avec `.\start-network.ps1`
3. Notez l'IP affichée (ex: `192.168.1.100`)
4. Sur votre téléphone, ouvrez : `http://192.168.1.100:4200`

## ⚠️ Dépannage

### "Cannot GET /" sur le réseau
➡️ Vérifiez que le pare-feu autorise les ports 4200 et 5001

### "Connection refused"
➡️ Vérifiez que le backend est démarré et écoute sur `0.0.0.0`

### "CORS error" depuis le réseau
➡️ Relancez le backend pour qu'il détecte la nouvelle IP

### Le site ne charge pas depuis le téléphone
➡️ Vérifiez que vous êtes sur le même réseau WiFi
➡️ Vérifiez que votre PC n'est pas en mode "Public Network"

## 🎯 Ports utilisés

| Service  | Port | Description |
|----------|------|-------------|
| Frontend | 4200 | Application Angular |
| Backend  | 5001 | API REST Express |
| MongoDB  | 27017 | Base de données (localhost uniquement) |

## 🔐 Sécurité

⚠️ Cette configuration est pour un **réseau local privé** uniquement.

Pour une utilisation en production, considérez :
- HTTPS avec certificats SSL
- Authentification renforcée
- Rate limiting
- Firewall applicatif
- VPN pour l'accès distant
