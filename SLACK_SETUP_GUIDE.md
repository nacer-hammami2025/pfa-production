# 🔧 Guide de Configuration Slack

## Problème
Erreur "Invalid client_id parameter" lors de la connexion Slack - le client ID n'est pas configuré.

## ✅ Solution

### 1. Créer une Application Slack

1. **Aller sur** [Slack API Apps](https://api.slack.com/apps)
2. **Cliquer** "Create New App" → "From scratch"
3. **Remplir les informations** :
   - **App Name** : TaskFlow Pro
   - **Workspace** : Sélectionner votre workspace Slack

### 2. Configurer l'Application

#### **OAuth & Permissions**
Dans l'onglet "OAuth & Permissions" :

- **Redirect URLs** :
  - Ajouter : `https://nacer-dev.me/api/integrations/slack/callback`

- **Scopes (Permissions)** :
  - **Bot Token Scopes** :
    - `chat:write` - Send messages as TaskFlow Pro
    - `channels:read` - Read public channel information
    - `users:read` - Read user information

#### **App Credentials**
Dans l'onglet "Basic Information" :

- **Client ID** : Notez cette valeur (sera `SLACK_CLIENT_ID`)
- **Client Secret** : Notez cette valeur (sera `SLACK_CLIENT_SECRET`)

### 3. Variables d'Environnement Render

Ajouter dans Render :
```
SLACK_CLIENT_ID=votre_client_id_slack_ici
SLACK_CLIENT_SECRET=votre_client_secret_slack_ici
```

### 4. Frontend Environment

Le frontend est déjà configuré avec :
```typescript
slack: {
  clientId: 'your_slack_client_id_here', // Remplacer par la vraie valeur
  redirectUri: 'https://nacer-dev.me/api/integrations/slack/callback'
}
```

## 🔄 Processus OAuth Slack

1. **Clic "Se connecter"** → Redirection vers Slack
2. **Autorisation** → Slack génère un code d'autorisation
3. **Callback** → Code envoyé au backend
4. **Échange** → Backend échange le code contre un token d'accès
5. **Connexion** → Intégration sauvegardée

## 🧪 Tester

Après configuration :
1. **Mettre à jour** `SLACK_CLIENT_ID` et `SLACK_CLIENT_SECRET` dans Render
2. **Redéployer** l'application
3. **Tester** la connexion Slack
4. **Vérifier** que l'intégration apparaît comme connectée
5. **Tester** l'envoi de notification

## 🔍 Dépannage

### "Invalid client_id parameter"
- ✅ Client ID correct dans Render
- ✅ Application créée sur Slack API
- ✅ Application installée dans le workspace

### "Redirect URI mismatch"
- ✅ URL de callback configurée dans Slack
- ✅ URL correspond exactement à celle dans le code

### "Missing required scope"
- ✅ Scopes configurés dans Slack
- ✅ Permissions accordées lors de l'autorisation

### Erreur lors de l'envoi de message
- ✅ Token d'accès valide
- ✅ Permissions suffisantes
- ✅ Canal accessible par le bot

## 📋 Permissions Requises

Pour un fonctionnement complet, assurez-vous que :

1. **L'application est installée** dans votre workspace
2. **Les permissions sont accordées** lors de l'autorisation
3. **Le bot a accès** aux canaux où vous voulez envoyer des messages
4. **Les tokens sont valides** (peuvent expirer)