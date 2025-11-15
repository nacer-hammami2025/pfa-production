# Production Deployment - Quick Reference

## 📋 Résumé des Fichiers Créés

### Configuration Production
- ✅ `backend/.env.production` - Variables d'environnement backend
- ✅ `frontend/src/environments/environment.prod.ts` - Configuration frontend
- ✅ `nginx.conf` - Configuration Nginx avec SSL et reverse proxy
- ✅ `ecosystem.config.js` - Configuration PM2 pour process management
- ✅ `deploy.sh` - Script de déploiement automatisé

### Documentation
- ✅ `DEPLOYMENT_GUIDE.md` - Guide complet de déploiement (LIRE EN PREMIER)
- ✅ `SSL_SETUP.md` - Configuration SSL avec Let's Encrypt
- ✅ `MONGODB_MIGRATION.md` - Migration de la base de données
- ✅ `DOCKER_DEPLOYMENT.md` - Alternative Docker (optionnel)
- ✅ `POST_DEPLOYMENT_CHECKLIST.md` - Vérification et monitoring

---

## 🚀 Déploiement Rapide (5 Étapes)

### 1. Préparer le Serveur
```bash
ssh root@votre-serveur

# Installer les dépendances
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx
sudo npm install -g pm2

# Créer l'utilisateur deploy
sudo adduser deploy
sudo usermod -aG sudo deploy
```

### 2. Configurer DNS
Dans votre panneau DNS :
- A record : `nacer-dev.me` → `IP_SERVEUR`
- A record : `www.nacer-dev.me` → `IP_SERVEUR`

Vérifier : `nslookup nacer-dev.me`

### 3. Déployer le Code
```bash
# Cloner le projet
sudo mkdir -p /var/www/pfa
sudo chown deploy:deploy /var/www/pfa
cd /var/www/pfa
git clone https://github.com/votre-username/pfa.git .

# Configurer les variables d'environnement
cd backend
nano .env.production
# Remplir : MONGO_URI, JWT_SECRET, SMTP_USER, SMTP_PASS

# Build frontend
cd ../frontend
npm ci
npm run build -- --configuration=production

# Installer backend
cd ../backend
npm ci --production
```

### 4. Configurer SSL + Nginx
```bash
# Obtenir certificat SSL
sudo systemctl stop nginx
sudo certbot certonly --standalone -d nacer-dev.me -d www.nacer-dev.me

# Configurer Nginx
sudo cp /var/www/pfa/nginx.conf /etc/nginx/sites-available/nacer-dev.me
sudo ln -s /etc/nginx/sites-available/nacer-dev.me /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl start nginx
```

### 5. Démarrer l'Application
```bash
cd /var/www/pfa

# Démarrer avec PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup

# Vérifier
pm2 status
curl https://nacer-dev.me
```

---

## 🔧 Variables à Configurer

### backend/.env.production
```env
MONGO_URI=mongodb+srv://...          # MongoDB Atlas URI
JWT_SECRET=...                       # Générer avec: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
SESSION_SECRET=...                   # Autre secret 64 caractères
SMTP_USER=votre-email@gmail.com      # Email pour SMTP
SMTP_PASS=...                        # App password Gmail
FRONTEND_URL=https://nacer-dev.me
```

### frontend/src/environments/environment.prod.ts
```typescript
apiUrl: 'https://nacer-dev.me/api',  # URL de l'API
// Autres configs déjà remplies
```

---

## 📦 Structure des Fichiers

```
/var/www/pfa/
├── backend/
│   ├── .env.production          ← Secrets (ne pas commit)
│   ├── src/index.js
│   └── package.json
├── frontend/
│   ├── dist/                    ← Build Angular (généré)
│   └── src/environments/
│       └── environment.prod.ts
├── nginx.conf                   ← Config Nginx
├── ecosystem.config.js          ← Config PM2
├── deploy.sh                    ← Script déploiement
└── uploads/                     ← Fichiers uploadés
```

---

## 🔑 Commandes Essentielles

### PM2
```bash
pm2 status                      # Statut
pm2 logs pfa-backend           # Logs
pm2 restart pfa-backend        # Redémarrer
pm2 monit                      # Monitoring
```

### Nginx
```bash
sudo nginx -t                  # Tester config
sudo systemctl reload nginx    # Recharger
sudo tail -f /var/log/nginx/pfa_error.log
```

### SSL
```bash
sudo certbot renew            # Renouveler
sudo certbot certificates     # Lister certificats
```

### Git
```bash
git pull origin main          # Mettre à jour code
./deploy.sh production        # Déployer automatiquement
```

---

## ✅ Vérifications Post-Déploiement

1. **Frontend** : https://nacer-dev.me → Page de login s'affiche
2. **Backend** : https://nacer-dev.me/api/health → "OK"
3. **SSL** : Cadenas vert dans le navigateur
4. **Login** : Créer un compte et se connecter
5. **Upload** : Télécharger une photo de profil

---

## 🐛 Troubleshooting Rapide

| Problème | Solution |
|----------|----------|
| 502 Bad Gateway | `pm2 restart pfa-backend` |
| SSL invalide | `sudo certbot renew --force-renewal` |
| Backend ne démarre pas | `pm2 logs pfa-backend` → vérifier MONGO_URI |
| Upload ne marche pas | `chmod -R 775 /var/www/pfa/uploads` |
| CORS error | Vérifier ALLOWED_ORIGINS dans .env.production |

---

## 📚 Documentation Complète

Pour plus de détails, consultez :

1. **DEPLOYMENT_GUIDE.md** - Guide complet étape par étape
2. **SSL_SETUP.md** - Configuration SSL détaillée
3. **MONGODB_MIGRATION.md** - Migration de données
4. **POST_DEPLOYMENT_CHECKLIST.md** - Vérification et monitoring

---

## 🆘 Support

En cas de problème :
1. Vérifier les logs : `pm2 logs pfa-backend`
2. Vérifier Nginx : `sudo tail -f /var/log/nginx/pfa_error.log`
3. Vérifier la base de données : Tester connexion MongoDB Atlas
4. Consulter la documentation complète

---

**🎉 Bon déploiement !**
