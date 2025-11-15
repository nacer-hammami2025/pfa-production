# Guide de Déploiement Render

## 🚀 Déploiement de l'Application PFA sur Render

### Étape 1: Créer un compte Render
1. Allez sur https://render.com
2. Cliquez sur "Get Started for Free"
3. Connectez-vous avec votre compte GitHub

### Étape 2: Créer un Web Service
1. Dans le dashboard Render, cliquez sur "New +"
2. Sélectionnez "Web Service"
3. Connectez votre repository GitHub `nacer-hammami2025/pfa-production`
4. Configurez les paramètres suivants :

**Configuration de base :**
- **Name:** `pfa-production`
- **Region:** `Frankfurt (EU Central)` ou `Oregon (US West)`
- **Branch:** `main`
- **Root Directory:** (laisser vide)
- **Runtime:** `Node`

**Commandes de build :**
- **Build Command:** `npm run build`
- **Start Command:** `npm start`

### Étape 3: Configurer les Variables d'Environnement

Dans la section "Environment", ajoutez ces variables :

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here  
FRONTEND_URL=https://nacer-dev.me
ALLOWED_ORIGINS=https://nacer-dev.me,https://pfa-production.onrender.com
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key_here
EMAIL_FROM=noreply@nacer-dev.me
```

### Étape 4: Plan de Tarification
- Sélectionnez **"Free"** (750h/mois gratuites)
- Cliquez sur "Create Web Service"

### Étape 5: Déploiement
Render va automatiquement :
1. Cloner votre repository
2. Installer les dépendances
3. Builder le frontend Angular
4. Démarrer l'application

### Étape 6: Configuration du Domaine Personnalisé
Une fois déployé :
1. Dans votre service Render, allez dans "Settings"
2. Scroll jusqu'à "Custom Domains"
3. Ajoutez `nacer-dev.me`
4. Render vous donnera les enregistrements DNS à configurer

### Étape 7: Configuration DNS (nacer-dev.me)
Dans votre registraire de domaine, ajoutez :
```
Type: CNAME
Name: @
Value: pfa-production.onrender.com
```

### 🎯 URLs Finales
- **Application:** https://pfa-production.onrender.com
- **Domaine personnalisé:** https://nacer-dev.me (après config DNS)

### ⚠️ Notes Importantes
- **Cold Start:** Les services gratuits Render "dorment" après 15min d'inactivité
- **Premier démarrage:** Peut prendre 50-90 secondes
- **Limites:** 750h/mois (suffisant pour un projet personnel)

### 🔧 Surveillance
- **Logs:** Disponibles dans l'interface Render
- **Métriques:** CPU, RAM, requêtes visibles dans le dashboard
- **Health Check:** Render ping automatiquement `/health`

---

## 🚨 En cas de problème

**Build failed :**
- Vérifiez les logs de build dans Render
- Assurez-vous que `package.json` est correct

**Application ne démarre pas :**
- Vérifiez les variables d'environnement
- Regardez les logs d'application

**Base de données inaccessible :**
- Vérifiez `MONGODB_URI`
- Testez la connexion MongoDB Atlas