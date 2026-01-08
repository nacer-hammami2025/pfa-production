# 🚀 CONFIGURATION AUTO-DEPLOY RENDER

## ✅ Fichier `render.yaml` créé

Ce fichier configure l'auto-déploiement automatique pour vos services Render.

## 📋 Services configurés

### Backend API (`pfa-backend`)
- **Type**: Web Service (Node.js)
- **Build**: `cd backend && npm install`
- **Start**: `cd backend && npm start`
- **Health Check**: `/api/health`
- **Auto-deploy**: ✅ Activé sur branch `main`

### Frontend (`pfa-frontend`)
- **Type**: Static Site (Angular build)
- **Build**: `cd frontend && npm install && npm run build --configuration=production`
- **Publish**: `./frontend/dist/taskflow/browser`
- **Auto-deploy**: ✅ Activé sur branch `main`

## 🔧 ÉTAPES POUR ACTIVER L'AUTO-DEPLOY

### Option A : Via Render Dashboard (Recommandé)

1. **Connectez-vous** à https://dashboard.render.com

2. **Pour chaque service** (backend + frontend) :
   - Cliquez sur le service
   - Allez dans **Settings** → **Build & Deploy**
   - Vérifiez que **"Auto-Deploy"** est sur **Yes**
   - Branch: **main**
   - Root Directory: laissez vide (render.yaml gère ça)

3. **Webhook GitHub** (si pas déjà fait) :
   - Dans Settings, section **"GitHub"**
   - Cliquez **"Connect Repository"** si pas connecté
   - Sélectionnez le repo : `nacer-hammami2025/pfa-production`
   - Render créera automatiquement le webhook

### Option B : Blueprint (Infrastructure as Code)

1. Allez sur https://dashboard.render.com/blueprints

2. Cliquez **"New Blueprint Instance"**

3. Connectez votre repo GitHub : `nacer-hammami2025/pfa-production`

4. Render détectera automatiquement `render.yaml`

5. Cliquez **"Apply"** → Les services seront créés/mis à jour automatiquement

## ✅ Vérification

Après configuration, à chaque `git push origin main` :

1. GitHub notifie Render via webhook
2. Render lance le build automatiquement
3. Le nouveau code est déployé (2-5 minutes)
4. Vous recevez une notification de déploiement

## 🔍 Monitoring

- **Logs de déploiement** : https://dashboard.render.com → Service → Events
- **Status** : Vérifiez le badge de déploiement
- **Webhook logs** : Settings → GitHub → Webhook logs

## 🚨 En cas de problème

Si l'auto-deploy ne fonctionne pas :

1. Vérifiez dans **Settings** → **Build & Deploy** → Auto-Deploy = **Yes**
2. Testez le webhook : Settings → GitHub → "Test webhook"
3. Vérifiez que le repo est bien `main` branch
4. Force un deploy : Click "Manual Deploy" → "Deploy latest commit"

## 📝 Variables d'environnement

**Backend** (`pfa-backend`) :
- `MONGODB_URI` : Votre connection string MongoDB Atlas
- `JWT_SECRET` : Secret pour JWT tokens
- `FRONTEND_URL` : https://nacer-dev.me
- `PORT` : 10000 (auto-configuré par Render)
- `NODE_ENV` : production

**Frontend** (`pfa-frontend`) :
- `NODE_ENV` : production

## 🎯 Prochaines étapes

1. Poussez `render.yaml` sur GitHub
2. Allez sur Render Dashboard et vérifiez que Auto-Deploy est activé
3. Faites un commit de test pour vérifier que ça fonctionne
4. Surveillez les logs de déploiement

---

**Note** : Render free tier limite à 750h/mois. Les services s'endorment après 15min d'inactivité.
