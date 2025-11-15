# 📊 Post-Deployment Checklist & Monitoring

Guide de vérification après déploiement et configuration du monitoring.

## ✅ Checklist Post-Déploiement

### Infrastructure

- [ ] **Serveur accessible** via SSH
- [ ] **DNS configuré** (nacer-dev.me pointe vers l'IP)
- [ ] **Firewall configuré** (ports 80, 443, 22 ouverts)
- [ ] **Nginx installé et démarré**
- [ ] **Node.js 18+ installé**
- [ ] **PM2 installé globalement**

### SSL/HTTPS

- [ ] **Certificat SSL obtenu** (Let's Encrypt)
- [ ] **HTTPS fonctionnel** sur https://nacer-dev.me
- [ ] **Redirection HTTP → HTTPS** active
- [ ] **Note SSL Labs** : A ou A+
- [ ] **Renouvellement automatique** configuré (certbot timer)

### Base de Données

- [ ] **MongoDB Atlas** configuré
- [ ] **Connexion DB** testée depuis le serveur
- [ ] **IP du serveur** autorisée dans Network Access
- [ ] **Utilisateur DB** créé avec mot de passe fort
- [ ] **Backup automatique** configuré

### Application

- [ ] **Code déployé** dans /var/www/pfa
- [ ] **Backend démarré** via PM2
- [ ] **Frontend buildé** et servi par Nginx
- [ ] **Variables d'environnement** configurées (.env.production)
- [ ] **Permissions fichiers** correctes (chmod 755, uploads 775)
- [ ] **PM2 sauvegardé** (pm2 save)
- [ ] **PM2 startup** configuré

### Tests Fonctionnels

- [ ] **Page d'accueil** accessible : https://nacer-dev.me
- [ ] **Login** fonctionnel
- [ ] **Inscription** fonctionnelle
- [ ] **Dashboard** charge correctement
- [ ] **API backend** répond sur /api/*
- [ ] **Upload de fichiers** fonctionne
- [ ] **Notifications** fonctionnelles
- [ ] **Thème clair/sombre** fonctionne

### Sécurité

- [ ] **JWT_SECRET** généré (64 caractères)
- [ ] **SESSION_SECRET** généré
- [ ] **Mots de passe DB** forts
- [ ] **CORS** configuré correctement
- [ ] **Rate limiting** actif
- [ ] **Headers sécurité** présents (HSTS, X-Frame-Options, etc.)
- [ ] **Cookies sécurisés** (COOKIE_SECURE=true)

### Monitoring

- [ ] **PM2 logs** accessibles
- [ ] **Nginx logs** configurés
- [ ] **Backup automatique** planifié (cron)
- [ ] **Renouvellement SSL** testé (certbot renew --dry-run)
- [ ] **Health checks** configurés

---

## 🔍 Tests Post-Déploiement

### 1. Test de Connectivité

```bash
# Ping du domaine
ping nacer-dev.me

# Test DNS
nslookup nacer-dev.me
dig nacer-dev.me

# Test HTTP
curl -I http://nacer-dev.me
# Devrait rediriger vers HTTPS

# Test HTTPS
curl -I https://nacer-dev.me
# Devrait retourner 200 OK
```

### 2. Test Backend API

```bash
# Health check
curl https://nacer-dev.me/api/health
# Attendu : "OK"

# Test auth (doit retourner 401)
curl https://nacer-dev.me/api/auth/me
# Attendu : {"message": "No token provided"}

# Test login
curl -X POST https://nacer-dev.me/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
# Attendu : {"token": "...", "user": {...}}
```

### 3. Test SSL

```bash
# Vérifier le certificat
openssl s_client -connect nacer-dev.me:443 -servername nacer-dev.me

# Test avec nmap
nmap --script ssl-enum-ciphers -p 443 nacer-dev.me

# Ou utiliser SSL Labs (en ligne)
# https://www.ssllabs.com/ssltest/analyze.html?d=nacer-dev.me
```

### 4. Test Performance

```bash
# Test de charge simple avec curl
time curl -s https://nacer-dev.me > /dev/null

# Test avec Apache Bench (installer avec: sudo apt install apache2-utils)
ab -n 100 -c 10 https://nacer-dev.me/

# Test avec wrk (plus avancé)
wrk -t4 -c100 -d30s https://nacer-dev.me/
```

### 5. Test Fonctionnel Manuel

Ouvrir un navigateur et tester :

1. **Page d'accueil** : https://nacer-dev.me
2. **Inscription** : Créer un nouveau compte
3. **Login** : Se connecter avec le compte créé
4. **Dashboard** : Vérifier que les données chargent
5. **Créer une tâche** : Tester la création
6. **Upload fichier** : Tester l'upload d'une photo de profil
7. **Thème** : Basculer entre clair/sombre
8. **Déconnexion** : Vérifier la redirection

---

## 📈 Configuration du Monitoring

### 1. PM2 Monitoring

#### PM2 Plus (Gratuit pour 1 serveur)

```bash
# S'inscrire sur https://app.pm2.io/
# Obtenir les clés (Public & Secret)

# Lier le serveur
pm2 link YOUR_PUBLIC_KEY YOUR_SECRET_KEY

# Vérifier
pm2 web
# Ouvrir http://localhost:9615
```

#### PM2 Logs

```bash
# Logs en temps réel
pm2 logs

# Logs d'un service spécifique
pm2 logs pfa-backend

# Dernières 100 lignes
pm2 logs pfa-backend --lines 100

# Logs d'erreur uniquement
pm2 logs pfa-backend --err

# Nettoyer les logs
pm2 flush
```

#### PM2 Monit

```bash
# Dashboard interactif
pm2 monit

# Status rapide
pm2 status

# Informations détaillées
pm2 info pfa-backend
```

### 2. Nginx Monitoring

#### Logs Nginx

```bash
# Logs d'accès en temps réel
tail -f /var/log/nginx/pfa_access.log

# Logs d'erreur
tail -f /var/log/nginx/pfa_error.log

# Analyser les codes HTTP
awk '{print $9}' /var/log/nginx/pfa_access.log | sort | uniq -c | sort -rn

# Top 10 IPs
awk '{print $1}' /var/log/nginx/pfa_access.log | sort | uniq -c | sort -rn | head -10
```

#### Nginx Status Page (optionnel)

Ajouter dans nginx.conf :
```nginx
location /nginx_status {
    stub_status on;
    access_log off;
    allow 127.0.0.1;
    deny all;
}
```

```bash
# Consulter le status
curl http://localhost/nginx_status
```

### 3. Monitoring Système

#### Ressources Serveur

```bash
# CPU et mémoire
htop

# Disque
df -h

# Espace utilisé par le projet
du -sh /var/www/pfa

# Processus Node.js
ps aux | grep node

# Connexions réseau
netstat -tuln | grep :5001
```

#### Automatiser avec un script

Créer `/usr/local/bin/monitor-pfa.sh` :
```bash
#!/bin/bash

echo "=== PFA Monitoring ==="
echo "Date: $(date)"
echo ""

echo "--- PM2 Status ---"
pm2 status

echo ""
echo "--- Disk Usage ---"
df -h | grep -E "Filesystem|/var"

echo ""
echo "--- Memory Usage ---"
free -h

echo ""
echo "--- Recent Errors (last 10) ---"
tail -10 /var/log/pfa/backend-error.log

echo ""
echo "--- Nginx 5xx Errors (last hour) ---"
grep "$(date +%d/%b/%Y:%H)" /var/log/nginx/pfa_error.log | grep -c "5[0-9][0-9]"
```

```bash
# Rendre exécutable
chmod +x /usr/local/bin/monitor-pfa.sh

# Exécuter
/usr/local/bin/monitor-pfa.sh
```

### 4. Alertes par Email

#### Script d'alerte en cas de crash

Créer `/usr/local/bin/alert-pfa-down.sh` :
```bash
#!/bin/bash

# Vérifier si le backend répond
if ! curl -s http://localhost:5001/health > /dev/null; then
    # Envoyer un email
    echo "⚠️ PFA Backend is DOWN!" | mail -s "ALERT: PFA Backend Down" votre-email@example.com
    
    # Redémarrer automatiquement
    pm2 restart pfa-backend
    
    # Logger l'incident
    echo "$(date): Backend down, restarted automatically" >> /var/log/pfa/incidents.log
fi
```

```bash
# Installer mailutils
sudo apt install mailutils

# Rendre exécutable
chmod +x /usr/local/bin/alert-pfa-down.sh

# Ajouter au crontab (vérifier toutes les 5 minutes)
crontab -e
```
Ajouter :
```
*/5 * * * * /usr/local/bin/alert-pfa-down.sh
```

### 5. Intégration Sentry (optionnel)

Pour le monitoring d'erreurs frontend et backend :

1. **Créer un compte** : https://sentry.io/
2. **Créer 2 projets** : pfa-frontend, pfa-backend
3. **Configurer** :

**Frontend** (`environment.prod.ts`) :
```typescript
sentryDsn: 'https://xxx@xxx.ingest.sentry.io/xxx'
```

**Backend** (`backend/src/index.js`) :
```javascript
const Sentry = require("@sentry/node");

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: 'production'
  });
}
```

### 6. Uptime Monitoring

Services gratuits pour surveiller la disponibilité :

- **UptimeRobot** : https://uptimerobot.com/ (gratuit, 50 monitors)
- **Pingdom** : https://www.pingdom.com/ (essai gratuit)
- **StatusCake** : https://www.statuscake.com/ (gratuit, 10 monitors)

Configurer :
- URL à surveiller : https://nacer-dev.me
- Fréquence : 5 minutes
- Alertes : Email/SMS en cas de downtime

---

## 📊 Métriques à Surveiller

### Backend
- ✅ Temps de réponse API (< 200ms)
- ✅ Taux d'erreur 5xx (< 1%)
- ✅ Utilisation CPU (< 70%)
- ✅ Utilisation mémoire (< 80%)
- ✅ Connexions MongoDB (stable)

### Frontend
- ✅ Temps de chargement (< 3s)
- ✅ Erreurs JavaScript (< 0.1%)
- ✅ Taille des bundles (< 5MB)

### Base de Données
- ✅ Connexions actives
- ✅ Temps de requête moyen
- ✅ Espace disque utilisé

### Système
- ✅ Uptime serveur
- ✅ Espace disque disponible (> 20%)
- ✅ Charge système (< 2.0)

---

## 🚨 Troubleshooting Post-Déploiement

### Backend ne démarre pas

```bash
# Vérifier les logs PM2
pm2 logs pfa-backend --lines 50

# Problème courant : MongoDB connexion
# Solution : Vérifier MONGO_URI dans .env.production

# Redémarrer manuellement
cd /var/www/pfa/backend
node src/index.js
```

### Frontend retourne 502 Bad Gateway

```bash
# Vérifier que le backend tourne
pm2 status

# Vérifier les logs Nginx
tail -f /var/log/nginx/pfa_error.log

# Tester la connexion backend
curl http://localhost:5001/health
```

### Certificat SSL invalide

```bash
# Renouveler le certificat
sudo certbot renew --force-renewal

# Recharger Nginx
sudo systemctl reload nginx

# Vérifier les dates
openssl x509 -in /etc/letsencrypt/live/nacer-dev.me/cert.pem -noout -dates
```

### Uploads ne fonctionnent pas

```bash
# Vérifier les permissions
ls -la /var/www/pfa/uploads

# Corriger les permissions
sudo chown -R deploy:deploy /var/www/pfa/uploads
sudo chmod -R 775 /var/www/pfa/uploads
```

---

## 📝 Rapports Réguliers

### Daily Report Script

Créer `/usr/local/bin/pfa-daily-report.sh` :
```bash
#!/bin/bash

REPORT="/tmp/pfa-daily-report.txt"

{
    echo "=== PFA Daily Report ==="
    echo "Date: $(date)"
    echo ""
    
    echo "--- Uptime ---"
    uptime
    
    echo ""
    echo "--- PM2 Status ---"
    pm2 jlist | jq -r '.[] | "\(.name): \(.pm2_env.status), CPU: \(.monit.cpu)%, Memory: \(.monit.memory / 1024 / 1024 | floor)MB"'
    
    echo ""
    echo "--- Disk Usage ---"
    df -h /var
    
    echo ""
    echo "--- Requests Today ---"
    grep "$(date +%d/%b/%Y)" /var/log/nginx/pfa_access.log | wc -l
    
    echo ""
    echo "--- Errors Today ---"
    grep "$(date +%d/%b/%Y)" /var/log/nginx/pfa_error.log | wc -l
    
} > $REPORT

# Envoyer par email
cat $REPORT | mail -s "PFA Daily Report - $(date +%Y-%m-%d)" votre-email@example.com
```

Ajouter au crontab (tous les jours à 23h) :
```
0 23 * * * /usr/local/bin/pfa-daily-report.sh
```

---

## ✅ Checklist Finale

Une fois tout configuré :

- [ ] Application accessible et fonctionnelle
- [ ] Monitoring PM2 actif
- [ ] Logs accessibles et surveillés
- [ ] Alertes configurées
- [ ] Backups automatiques en place
- [ ] SSL renouvelable automatiquement
- [ ] Documentation à jour
- [ ] Équipe formée sur le déploiement

**🎉 Votre application est maintenant en production et surveillée !**
