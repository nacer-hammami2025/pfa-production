# 🚀 Guide de Déploiement Production - nacer-dev.me

Guide complet pour déployer l'application PFA sur un serveur de production.

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration du Serveur](#configuration-du-serveur)
3. [Configuration DNS](#configuration-dns)
4. [Installation des Dépendances](#installation-des-dépendances)
5. [Configuration MongoDB](#configuration-mongodb)
6. [Déploiement du Code](#déploiement-du-code)
7. [Configuration des Variables d'Environnement](#configuration-des-variables-denvironnement)
8. [Build et Déploiement](#build-et-déploiement)
9. [Configuration SSL](#configuration-ssl)
10. [Configuration PM2](#configuration-pm2)
11. [Monitoring et Maintenance](#monitoring-et-maintenance)
12. [Rollback et Recovery](#rollback-et-recovery)

---

## Prérequis

### Serveur
- **VPS/Serveur dédié** avec au minimum :
  - 2 GB RAM
  - 20 GB stockage
  - Ubuntu 20.04 LTS ou supérieur
  - Accès root/sudo
  - IP publique fixe

### Domaine
- Domaine `nacer-dev.me` configuré
- Accès au panneau DNS

### Outils Locaux
- Git
- Node.js 16+
- SSH client

---

## Configuration du Serveur

### 1. Connexion SSH

```bash
ssh root@votre-ip-serveur
# ou
ssh votre-utilisateur@nacer-dev.me
```

### 2. Mise à Jour du Système

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

### 3. Création d'un Utilisateur de Déploiement

```bash
# Créer l'utilisateur
sudo adduser deploy
sudo usermod -aG sudo deploy

# Configurer SSH pour l'utilisateur
sudo mkdir -p /home/deploy/.ssh
sudo cp ~/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# Se connecter avec le nouvel utilisateur
exit
ssh deploy@nacer-dev.me
```

### 4. Configuration du Firewall

```bash
# Activer UFW
sudo ufw enable

# Autoriser les ports nécessaires
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5001/tcp  # Backend (temporaire pour tests)

# Vérifier
sudo ufw status
```

---

## Configuration DNS

Dans votre panneau de gestion DNS (OVH, Cloudflare, etc.) :

### Enregistrements A
```
Type  | Nom         | Valeur          | TTL
------|-------------|-----------------|-----
A     | @           | IP_DU_SERVEUR   | 3600
A     | www         | IP_DU_SERVEUR   | 3600
A     | api         | IP_DU_SERVEUR   | 3600 (optionnel)
```

### Vérification DNS

```bash
# Vérifier la résolution DNS
nslookup nacer-dev.me
dig nacer-dev.me
ping nacer-dev.me
```

**⚠️ Attendre 1-24h pour la propagation DNS complète.**

---

## Installation des Dépendances

### 1. Node.js et npm

```bash
# Installer Node.js 18 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier l'installation
node --version  # v18.x.x
npm --version   # 9.x.x
```

### 2. PM2 (Process Manager)

```bash
sudo npm install -g pm2
pm2 --version

# Configurer le démarrage automatique
pm2 startup systemd
# Exécuter la commande affichée
```

### 3. Nginx

```bash
sudo apt install -y nginx

# Démarrer et activer Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Vérifier
sudo systemctl status nginx
```

### 4. MongoDB Client (optionnel, pour les backups)

```bash
# Installer mongodump/mongorestore
sudo apt install -y mongodb-org-tools
```

---

## Configuration MongoDB

### Option 1 : MongoDB Atlas (Recommandé)

1. **Créer un compte** : https://www.mongodb.com/cloud/atlas
2. **Créer un cluster** :
   - Tier gratuit (M0) ou payant
   - Région : Europe (Paris ou Francfort)
   - Nom : `pfa-production`
3. **Configurer la sécurité** :
   - Database Access : Créer un utilisateur avec mot de passe
   - Network Access : Ajouter l'IP du serveur ou `0.0.0.0/0` (attention : moins sécurisé)
4. **Obtenir l'URI de connexion** :
   ```
   mongodb+srv://username:password@cluster.mongodb.net/pfa_production?retryWrites=true&w=majority
   ```

### Option 2 : MongoDB Local (Non recommandé pour la production)

```bash
# Installation
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Démarrer MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# URI de connexion local
mongodb://localhost:27017/pfa_production
```

---

## Déploiement du Code

### 1. Cloner le Repository

```bash
# Créer le répertoire de projet
sudo mkdir -p /var/www/pfa
sudo chown -R deploy:deploy /var/www/pfa

# Cloner le code
cd /var/www/pfa
git clone https://github.com/votre-username/pfa.git .

# Ou via SSH si configuré
# git clone git@github.com:votre-username/pfa.git .
```

### 2. Vérifier la Structure

```bash
ls -la /var/www/pfa
# Devrait afficher : backend/ frontend/ docker-compose.yml README.md etc.
```

---

## Configuration des Variables d'Environnement

### 1. Générer le JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Exemple : a1b2c3d4e5f6...
```

### 2. Éditer `.env.production`

```bash
cd /var/www/pfa/backend
nano .env.production
```

**Remplacer les valeurs suivantes :**

```env
# Base de données
MONGO_URI=mongodb+srv://username:PASSWORD@cluster.mongodb.net/pfa_production?retryWrites=true&w=majority

# Sécurité
JWT_SECRET=VOTRE_SECRET_GENERE_64_CARACTERES
SESSION_SECRET=AUTRE_SECRET_64_CARACTERES

# SMTP (exemple avec Gmail)
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-app-password
SMTP_FROM=noreply@nacer-dev.me

# Frontend URL
FRONTEND_URL=https://nacer-dev.me
ALLOWED_ORIGINS=https://nacer-dev.me,https://www.nacer-dev.me
```

**Configuration Gmail App Password :**
1. Activer la validation en 2 étapes
2. Générer un mot de passe d'application : https://myaccount.google.com/apppasswords
3. Utiliser ce mot de passe dans `SMTP_PASS`

### 3. Permissions

```bash
chmod 600 /var/www/pfa/backend/.env.production
```

---

## Build et Déploiement

### 1. Installation des Dépendances Backend

```bash
cd /var/www/pfa/backend
npm ci --production
```

### 2. Build du Frontend

```bash
cd /var/www/pfa/frontend

# Installer les dépendances
npm ci

# Build de production
npm run build -- --configuration=production

# Vérifier le build
ls -lh dist/
```

Le build sera créé dans `frontend/dist/`.

### 3. Configuration des Répertoires

```bash
# Créer les répertoires nécessaires
sudo mkdir -p /var/www/pfa/uploads/profiles
sudo mkdir -p /var/log/pfa
sudo mkdir -p /var/backups/pfa

# Permissions
sudo chown -R deploy:deploy /var/www/pfa
sudo chmod -R 755 /var/www/pfa
sudo chmod -R 775 /var/www/pfa/uploads
```

---

## Configuration SSL

Voir le guide détaillé : [SSL_SETUP.md](./SSL_SETUP.md)

### Résumé Rapide

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx

# Arrêter Nginx
sudo systemctl stop nginx

# Obtenir le certificat
sudo certbot certonly --standalone \
    -d nacer-dev.me \
    -d www.nacer-dev.me \
    --email votre-email@example.com \
    --agree-tos

# Copier la configuration Nginx
sudo cp /var/www/pfa/nginx.conf /etc/nginx/sites-available/nacer-dev.me
sudo ln -s /etc/nginx/sites-available/nacer-dev.me /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Tester et démarrer Nginx
sudo nginx -t
sudo systemctl start nginx
```

---

## Configuration PM2

### 1. Démarrer l'Application

```bash
cd /var/www/pfa

# Démarrer avec PM2
pm2 start ecosystem.config.js --env production

# Vérifier
pm2 status
pm2 logs pfa-backend
```

### 2. Sauvegarder la Configuration

```bash
pm2 save
pm2 startup
# Exécuter la commande affichée si nécessaire
```

### 3. Configuration du Monitoring

```bash
# Installer PM2 Plus (optionnel)
pm2 link VOTRE_PUBLIC_KEY VOTRE_PRIVATE_KEY

# Dashboard web local
pm2 web
```

---

## Vérification du Déploiement

### 1. Vérifier le Backend

```bash
# Health check
curl http://localhost:5001/health
# Devrait retourner : OK

# Test API
curl http://localhost:5001/api/auth/test
```

### 2. Vérifier le Frontend

```bash
# Visiter dans un navigateur
https://nacer-dev.me

# Test SSL
curl -I https://nacer-dev.me
```

### 3. Vérifier les Logs

```bash
# PM2 logs
pm2 logs pfa-backend --lines 100

# Nginx logs
sudo tail -f /var/log/nginx/pfa_access.log
sudo tail -f /var/log/nginx/pfa_error.log
```

---

## Monitoring et Maintenance

### Commandes PM2 Utiles

```bash
# Status
pm2 status

# Logs en temps réel
pm2 logs

# Redémarrer
pm2 restart pfa-backend

# Recharger (zero-downtime)
pm2 reload pfa-backend

# Monitoring
pm2 monit

# Informations détaillées
pm2 info pfa-backend
```

### Logs

```bash
# Application logs
tail -f /var/log/pfa/backend-out.log
tail -f /var/log/pfa/backend-error.log

# Nginx logs
tail -f /var/log/nginx/pfa_access.log
tail -f /var/log/nginx/pfa_error.log

# MongoDB logs (si local)
tail -f /var/log/mongodb/mongod.log
```

### Backup Automatique

```bash
# Créer un script de backup
sudo nano /usr/local/bin/backup-pfa.sh
```

Contenu :
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/pfa"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup MongoDB
mongodump --uri="$MONGO_URI" --archive="$BACKUP_DIR/db_$DATE.gz" --gzip

# Backup uploads
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" /var/www/pfa/uploads

# Nettoyer les anciens backups (garder 7 derniers)
cd $BACKUP_DIR
ls -t db_*.gz | tail -n +8 | xargs -r rm
ls -t uploads_*.tar.gz | tail -n +8 | xargs -r rm
```

```bash
# Rendre exécutable
sudo chmod +x /usr/local/bin/backup-pfa.sh

# Ajouter au crontab (tous les jours à 2h)
sudo crontab -e
```
Ajouter :
```
0 2 * * * /usr/local/bin/backup-pfa.sh
```

---

## Rollback et Recovery

### Rollback de Code

```bash
# Voir les commits
cd /var/www/pfa
git log --oneline -10

# Revenir à un commit
git checkout <commit-hash>

# Redémarrer
pm2 restart pfa-backend
```

### Restauration de Base de Données

```bash
# Lister les backups
ls -lh /var/backups/pfa/db_*.gz

# Restaurer un backup
mongorestore --uri="$MONGO_URI" --archive=/var/backups/pfa/db_20240115_020000.gz --gzip
```

### Restauration Complète

```bash
# Arrêter l'application
pm2 stop pfa-backend

# Restaurer le code
cd /var/www/pfa
git reset --hard <commit-hash>

# Restaurer la base de données
mongorestore --uri="$MONGO_URI" --archive=/var/backups/pfa/db_XXXXXX.gz --gzip

# Redémarrer
pm2 restart pfa-backend
```

---

## Script de Déploiement Automatisé

Utilisez le script `deploy.sh` fourni :

```bash
# Rendre exécutable
chmod +x /var/www/pfa/deploy.sh

# Lancer le déploiement
cd /var/www/pfa
./deploy.sh production
```

Le script effectuera automatiquement :
1. ✅ Backup de la base de données
2. ✅ Arrêt des services
3. ✅ Backup du code
4. ✅ Mise à jour du code (git pull)
5. ✅ Installation des dépendances
6. ✅ Build du frontend
7. ✅ Migrations (si nécessaire)
8. ✅ Configuration des permissions
9. ✅ Redémarrage des services
10. ✅ Vérification de santé

---

## Checklist Finale

- [ ] Serveur configuré avec Ubuntu 20.04+
- [ ] DNS configuré (`nacer-dev.me` → IP serveur)
- [ ] Node.js 18+ installé
- [ ] MongoDB Atlas configuré
- [ ] Code déployé dans `/var/www/pfa`
- [ ] `.env.production` configuré avec secrets
- [ ] Frontend buildé (`npm run build`)
- [ ] SSL configuré (Let's Encrypt)
- [ ] Nginx configuré et fonctionnel
- [ ] PM2 lancé et sauvegardé
- [ ] Application accessible sur https://nacer-dev.me
- [ ] Backend répond sur `/api/*`
- [ ] Uploads fonctionnels
- [ ] Logs configurés
- [ ] Backups automatiques configurés
- [ ] Renouvellement SSL automatique
- [ ] Firewall configuré

---

## Troubleshooting

### Application ne démarre pas

```bash
# Vérifier les logs PM2
pm2 logs pfa-backend --lines 50

# Vérifier les variables d'environnement
pm2 env 0

# Redémarrer avec logs
pm2 delete pfa-backend
pm2 start ecosystem.config.js --env production
```

### Erreur 502 Bad Gateway

```bash
# Vérifier que le backend tourne
pm2 status

# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/pfa_error.log

# Tester la connexion backend
curl http://localhost:5001/health
```

### Certificat SSL invalide

```bash
# Renouveler le certificat
sudo certbot renew --force-renewal

# Recharger Nginx
sudo systemctl reload nginx

# Tester
curl -I https://nacer-dev.me
```

### MongoDB ne se connecte pas

```bash
# Tester la connexion
mongosh "mongodb+srv://username:password@cluster.mongodb.net/pfa_production"

# Vérifier les logs backend
pm2 logs pfa-backend | grep MongoDB

# Vérifier l'IP autorisée dans MongoDB Atlas Network Access
```

---

## Support et Ressources

- **PM2 Documentation** : https://pm2.keymetrics.io/docs/usage/quick-start/
- **Nginx Documentation** : https://nginx.org/en/docs/
- **Let's Encrypt** : https://letsencrypt.org/docs/
- **MongoDB Atlas** : https://www.mongodb.com/docs/atlas/

---

**🎉 Félicitations ! Votre application est maintenant en production sur https://nacer-dev.me**
