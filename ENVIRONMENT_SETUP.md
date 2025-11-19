# 🔧 Configuration des Variables d'Environnement - Production

## 📍 Où Configurer les Variables

### ❌ PAS dans le fichier .env
Le fichier `backend/.env` est dans `.gitignore` pour des raisons de sécurité.
**NE PAS** y mettre les vraies valeurs de production !

### ✅ DANS le Dashboard Render

1. **Aller sur** [Render Dashboard](https://dashboard.render.com/)
2. **Sélectionner** votre service PFA
3. **Aller dans** "Environment"
4. **Ajouter** les variables suivantes :

## 🔑 Variables Requises pour les Intégrations

### Google Calendar
```
GOOGLE_CLIENT_ID=votre_client_id_google
GOOGLE_CLIENT_SECRET=votre_client_secret_google
```

### Microsoft Outlook
```
OUTLOOK_CLIENT_ID=votre_client_id_outlook
OUTLOOK_CLIENT_SECRET=votre_client_secret_outlook
```

### Slack
```
SLACK_CLIENT_ID=votre_client_id_slack
SLACK_CLIENT_SECRET=votre_client_secret_slack
```

### Trello
```
TRELLO_API_KEY=votre_clé_api_trello
```

### Autres Variables Importantes
```
MONGODB_URI=votre_uri_mongodb_atlas
JWT_SECRET=votre_clé_jwt_secrète
FRONTEND_URL=https://nacer-dev.me
```

## 🚀 Procédure Complète

### 1. Obtenir les Credentials

#### Pour Slack :
1. [Slack API Apps](https://api.slack.com/apps)
2. Créer app "TaskFlow Pro"
3. Noter Client ID et Client Secret

#### Pour Trello :
1. [Trello Power-Ups Admin](https://trello.com/power-ups/admin/)
2. Créer Power-Up "TaskFlow Pro"
3. Noter l'API Key

#### Pour Google Calendar :
1. [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Créer OAuth 2.0 Client ID

### 2. Configurer dans Render

1. **Dashboard Render** → Votre service
2. **Environment** → Add Environment Variable
3. **Ajouter chaque variable** avec sa vraie valeur

### 3. Redéployer

Après avoir ajouté les variables :
- Render redéploiera automatiquement
- Les intégrations seront fonctionnelles

## 🔒 Sécurité

- ✅ **Variables dans Render** : Sécurisées et chiffrées
- ✅ **Pas dans le code** : .env ignoré par Git
- ✅ **Accès restreint** : Seulement les admins du projet

## 🧪 Tester

Après configuration :
```bash
# Tester les intégrations
node test-slack-integration.js
node test-trello-integration.js
node test-integrations-callback.js
```

**Les variables sont maintenant correctement configurées !** 🔐