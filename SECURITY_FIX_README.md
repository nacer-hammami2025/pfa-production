# 🔒 GUIDE DE SÉCURITÉ - Variables d'Environnement

## 🚨 URGENT - Alertes GitGuardian Résolues

Les alertes suivantes ont été corrigées et poussées :

### ✅ Corrections Appliquées

1. **MongoDB Credentials** - Supprimées de :
   - `RAPPORT_COMPLET_PFA.md`
   - `backend/create-prod-admin.js`
   - `test-user.js`

2. **Passwords Exposés** - Supprimés de :
   - `create-admin-via-api.js`
   - `backend/create-admin.js`
   - `backend/create-prod-admin.js`

### 🔧 Configuration Requise

#### 1. Variables d'Environnement dans Render

Ajoutez ces variables dans votre **Render Dashboard** :

```bash
# Base de données
MONGODB_URI=mongodb+srv://votre_username:votre_password@votre_cluster.mongodb.net/votre_db

# Sécurité
JWT_SECRET=votre_cle_jwt_ultra_secrete
ADMIN_PASSWORD=votre_mot_de_passe_admin_securise

# Intégrations (optionnel)
GOOGLE_CLIENT_ID=votre_google_client_id
GOOGLE_CLIENT_SECRET=votre_google_client_secret
SLACK_CLIENT_ID=votre_slack_client_id
SLACK_CLIENT_SECRET=votre_slack_client_secret
TRELLO_API_KEY=votre_trello_api_key
```

#### 2. Pour le Développement Local

Copiez `.env.example` vers `.env` dans le dossier `backend/` :

```bash
cd backend
cp .env.example .env
# Éditez .env avec vos vraies valeurs
```

#### 3. Générer des Mots de Passe Sécurisés

```bash
# Générer un JWT secret
openssl rand -base64 32

# Générer un mot de passe admin
openssl rand -base64 24
```

### 🛡️ Bonnes Pratiques de Sécurité

- ✅ **Jamais** de credentials en dur dans le code
- ✅ **Toujours** utiliser des variables d'environnement
- ✅ **Fichiers .env** dans `.gitignore`
- ✅ **Mots de passe** complexes et uniques
- ✅ **Clés JWT** régénérées régulièrement

### 🚦 Statut des Alertes

Après ces corrections, les alertes GitGuardian devraient disparaître :
- ❌ MongoDB Credentials → ✅ Résolu
- ❌ Generic Password → ✅ Résolu
- ❌ Company Email Password → ✅ Résolu

### 📞 Support

Si vous avez des questions sur la configuration, consultez :
- `ENVIRONMENT_SETUP.md` pour le guide complet
- Render Dashboard pour les variables de production