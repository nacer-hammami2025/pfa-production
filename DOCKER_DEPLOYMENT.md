# Docker Deployment (Optionnel)

Configuration Docker pour déploiement conteneurisé de l'application PFA.

## Structure Docker

```
pfa/
├── docker-compose.prod.yml      ← Configuration production
├── backend/
│   └── Dockerfile              ← Image backend
└── frontend/
    └── Dockerfile              ← Image frontend
```

## Fichiers Docker Existants

Les Dockerfiles sont déjà créés. Voici la configuration production avec Docker Compose.

## docker-compose.prod.yml

Remplacer le contenu existant avec cette version production-ready :

```yaml
version: '3.8'

services:
  # Backend Node.js
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: pfa-backend-prod
    restart: unless-stopped
    env_file:
      - ./backend/.env.production
    environment:
      - NODE_ENV=production
      - PORT=5001
      - HOST=0.0.0.0
    ports:
      - "5001:5001"
    volumes:
      - ./backend/uploads:/app/uploads
      - backend-logs:/var/log/pfa
    networks:
      - pfa-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    depends_on:
      - mongodb
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  # Frontend Nginx
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: pfa-frontend-prod
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - frontend-static:/usr/share/nginx/html
    networks:
      - pfa-network
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # MongoDB (optionnel - préférer MongoDB Atlas en production)
  mongodb:
    image: mongo:6.0
    container_name: pfa-mongodb-prod
    restart: unless-stopped
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: pfa_production
    ports:
      - "27017:27017"
    volumes:
      - mongodb-data:/data/db
      - mongodb-config:/data/configdb
      - ./backups:/backups
    networks:
      - pfa-network
    command: mongod --auth
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/pfa_production --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis (optionnel - cache et sessions)
  redis:
    image: redis:7-alpine
    container_name: pfa-redis-prod
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - pfa-network
    command: redis-server --requirepass ${REDIS_PASSWORD} --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mongodb-data:
    driver: local
  mongodb-config:
    driver: local
  redis-data:
    driver: local
  backend-logs:
    driver: local
  frontend-static:
    driver: local

networks:
  pfa-network:
    driver: bridge
```

## Backend Dockerfile (vérifier/mettre à jour)

```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Image de production
FROM node:18-alpine

WORKDIR /app

# Créer l'utilisateur non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copier les dépendances et le code depuis builder
COPY --from=builder --chown=nodejs:nodejs /app /app

# Créer les répertoires nécessaires
RUN mkdir -p /app/uploads/profiles /var/log/pfa && \
    chown -R nodejs:nodejs /app /var/log/pfa

# Changer d'utilisateur
USER nodejs

# Exposer le port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:5001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Démarrer l'application
CMD ["node", "src/index.js"]
```

## Frontend Dockerfile (vérifier/mettre à jour)

```dockerfile
# frontend/Dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./

# Installer les dépendances
RUN npm ci

# Copier le code source
COPY . .

# Build de production
RUN npm run build -- --configuration=production

# Stage 2: Production
FROM nginx:alpine

# Copier la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier les fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

# Créer un utilisateur non-root
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Exposer les ports
EXPOSE 80 443

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
```

## .dockerignore (créer si n'existe pas)

### backend/.dockerignore
```
node_modules
npm-debug.log
.env
.env.local
.git
.gitignore
README.md
uploads/*
!uploads/.gitkeep
coverage
.nyc_output
dist
```

### frontend/.dockerignore
```
node_modules
npm-debug.log
.angular
dist
.git
.gitignore
README.md
coverage
.nyc_output
e2e
```

## Déploiement avec Docker

### 1. Créer les variables d'environnement

```bash
# Créer .env à la racine du projet
cat > .env.docker << EOF
MONGO_ROOT_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
EOF
```

### 2. Build des images

```bash
# Build toutes les images
docker-compose -f docker-compose.prod.yml build

# Ou build individuellement
docker-compose -f docker-compose.prod.yml build backend
docker-compose -f docker-compose.prod.yml build frontend
```

### 3. Démarrer les services

```bash
# Démarrer en arrière-plan
docker-compose -f docker-compose.prod.yml up -d

# Voir les logs
docker-compose -f docker-compose.prod.yml logs -f

# Vérifier le statut
docker-compose -f docker-compose.prod.yml ps
```

### 4. Vérification

```bash
# Health checks
docker ps
docker-compose -f docker-compose.prod.yml exec backend curl http://localhost:5001/health

# Logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
```

## Commandes Utiles

```bash
# Arrêter les services
docker-compose -f docker-compose.prod.yml down

# Arrêter et supprimer les volumes
docker-compose -f docker-compose.prod.yml down -v

# Redémarrer un service
docker-compose -f docker-compose.prod.yml restart backend

# Reconstruire après changement de code
docker-compose -f docker-compose.prod.yml up -d --build

# Voir les ressources utilisées
docker stats

# Nettoyer les images non utilisées
docker system prune -a
```

## Backup MongoDB Docker

```bash
# Backup
docker-compose -f docker-compose.prod.yml exec mongodb mongodump \
  --username admin \
  --password $MONGO_ROOT_PASSWORD \
  --authenticationDatabase admin \
  --db pfa_production \
  --out /backups/$(date +%Y%m%d)

# Restore
docker-compose -f docker-compose.prod.yml exec mongodb mongorestore \
  --username admin \
  --password $MONGO_ROOT_PASSWORD \
  --authenticationDatabase admin \
  --db pfa_production \
  /backups/20240115
```

## Mise à Jour de l'Application

```bash
# 1. Pull nouveau code
git pull origin main

# 2. Rebuild et redéployer
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Vérifier
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

## Monitoring

### Logs en temps réel
```bash
# Tous les services
docker-compose -f docker-compose.prod.yml logs -f

# Service spécifique
docker-compose -f docker-compose.prod.yml logs -f backend

# Dernières 100 lignes
docker-compose -f docker-compose.prod.yml logs --tail=100 backend
```

### Ressources
```bash
# Stats en temps réel
docker stats

# Inspect d'un container
docker inspect pfa-backend-prod
```

## SSL avec Docker

Pour utiliser SSL avec Docker :

1. Obtenir les certificats Let's Encrypt (sur l'hôte)
2. Monter les certificats dans le container frontend

```yaml
# Dans docker-compose.prod.yml
frontend:
  volumes:
    - /etc/letsencrypt/live/nacer-dev.me:/etc/nginx/ssl:ro
```

Ou utiliser un reverse proxy comme Traefik pour la gestion automatique SSL.

## Avantages Docker

✅ **Isolation** : Environnement cohérent dev/prod  
✅ **Portabilité** : Fonctionne partout  
✅ **Scalabilité** : Facile à scale horizontalement  
✅ **Rollback** : Revenir à une version précédente rapidement  
✅ **CI/CD** : Intégration facile dans pipelines  

## Inconvénients Docker

⚠️ **Complexité** : Courbe d'apprentissage  
⚠️ **Overhead** : Légère consommation de ressources  
⚠️ **Debugging** : Plus difficile qu'en natif  

## Recommandation

Pour **nacer-dev.me** :
- Si vous êtes à l'aise avec Docker → **Utiliser Docker** (meilleure isolation)
- Si vous préférez la simplicité → **Déploiement natif** (PM2 + Nginx)

Les deux approches sont valides !
