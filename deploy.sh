#!/bin/bash

# Script de déploiement automatisé pour nacer-dev.me
# Usage: ./deploy.sh [production|staging]

set -e # Arrêter en cas d'erreur

# Configuration
ENV=${1:-production}
PROJECT_DIR="/var/www/pfa"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
BACKUP_DIR="/var/backups/pfa"
LOG_FILE="/var/log/pfa/deployment.log"

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a $LOG_FILE
    exit 1
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a $LOG_FILE
}

# Vérification des permissions
if [ "$EUID" -eq 0 ]; then
    error "Ne pas exécuter ce script en tant que root"
fi

log "======================================"
log "Début du déploiement - Environnement: $ENV"
log "======================================"

# 1. Sauvegarde de la base de données
log "Étape 1/9: Sauvegarde de la base de données..."
BACKUP_FILE="$BACKUP_DIR/mongodb_$(date +%Y%m%d_%H%M%S).gz"
mkdir -p $BACKUP_DIR
mongodump --uri="$MONGO_URI" --archive=$BACKUP_FILE --gzip || warning "Échec de la sauvegarde MongoDB"
log "✅ Sauvegarde créée: $BACKUP_FILE"

# 2. Arrêt des services
log "Étape 2/9: Arrêt des services..."
pm2 stop pfa-backend || warning "Service backend déjà arrêté"
log "✅ Services arrêtés"

# 3. Sauvegarde du code actuel
log "Étape 3/9: Sauvegarde du code actuel..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
tar -czf "$BACKUP_DIR/code_backup_$TIMESTAMP.tar.gz" -C "$PROJECT_DIR" . || warning "Échec de la sauvegarde du code"
log "✅ Code sauvegardé"

# 4. Récupération du nouveau code
log "Étape 4/9: Récupération du nouveau code..."
cd $PROJECT_DIR
git fetch origin
git checkout main
git pull origin main
log "✅ Code mis à jour"

# 5. Installation des dépendances backend
log "Étape 5/9: Installation des dépendances backend..."
cd $BACKEND_DIR
npm ci --production
log "✅ Dépendances backend installées"

# 6. Build du frontend
log "Étape 6/9: Build du frontend Angular..."
cd $FRONTEND_DIR
npm ci
npm run build -- --configuration=production
log "✅ Frontend buildé"

# 7. Migration de la base de données (si nécessaire)
log "Étape 7/9: Vérification des migrations..."
cd $BACKEND_DIR
if [ -f "migrations/migrate.js" ]; then
    node migrations/migrate.js || error "Échec de la migration"
    log "✅ Migrations appliquées"
else
    warning "Aucun script de migration trouvé"
fi

# 8. Permissions des fichiers
log "Étape 8/9: Configuration des permissions..."
sudo chown -R $USER:$USER $PROJECT_DIR
chmod -R 755 $PROJECT_DIR
mkdir -p /var/www/pfa/uploads/profiles
chmod -R 775 /var/www/pfa/uploads
log "✅ Permissions configurées"

# 9. Démarrage des services
log "Étape 9/9: Démarrage des services..."
cd $PROJECT_DIR
pm2 start ecosystem.config.js --env $ENV
pm2 save
log "✅ Services démarrés"

# Vérification de santé
log "Vérification de santé du backend..."
sleep 5
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/health)
if [ "$HEALTH_CHECK" -eq 200 ]; then
    log "✅ Backend opérationnel"
else
    error "Backend ne répond pas correctement (HTTP $HEALTH_CHECK)"
fi

# Nettoyage des anciennes sauvegardes (garder les 7 dernières)
log "Nettoyage des anciennes sauvegardes..."
cd $BACKUP_DIR
ls -t mongodb_*.gz | tail -n +8 | xargs -r rm
ls -t code_backup_*.tar.gz | tail -n +8 | xargs -r rm
log "✅ Anciennes sauvegardes nettoyées"

# Recharger Nginx
log "Rechargement de Nginx..."
sudo nginx -t && sudo systemctl reload nginx || warning "Échec du rechargement Nginx"

log "======================================"
log "✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS"
log "======================================"
log "Application accessible sur: https://nacer-dev.me"
log "Logs PM2: pm2 logs pfa-backend"
log "Status PM2: pm2 status"
log ""
log "Pour rollback en cas de problème:"
log "  tar -xzf $BACKUP_DIR/code_backup_$TIMESTAMP.tar.gz -C $PROJECT_DIR"
log "  mongorestore --uri=\"\$MONGO_URI\" --archive=$BACKUP_FILE --gzip"
log "  pm2 restart pfa-backend"

# Envoyer une notification (optionnel)
# curl -X POST https://hooks.slack.com/services/YOUR/WEBHOOK/URL \
#      -H 'Content-Type: application/json' \
#      -d "{\"text\":\"✅ Déploiement PFA réussi sur $ENV\"}"
