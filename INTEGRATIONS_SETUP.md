# Configuration des Intégrations Externes

## Vue d'ensemble
TaskFlow Pro prend en charge l'intégration avec plusieurs services externes pour améliorer votre productivité. Voici comment configurer chaque intégration.

## Prérequis
1. Un compte développeur pour chaque service que vous souhaitez intégrer
2. Les variables d'environnement configurées dans votre fichier `.env` du backend

## Configuration des Variables d'Environnement

Ajoutez ces variables à votre fichier `backend/.env` :

```env
# Google Calendar
GOOGLE_CLIENT_ID=votre_client_id_google
GOOGLE_CLIENT_SECRET=votre_client_secret_google

# Microsoft Outlook
OUTLOOK_CLIENT_ID=votre_client_id_outlook
OUTLOOK_CLIENT_SECRET=votre_client_secret_outlook

# Slack
SLACK_CLIENT_ID=votre_client_id_slack
SLACK_CLIENT_SECRET=votre_client_secret_slack

# Trello
TRELLO_API_KEY=votre_api_key_trello
TRELLO_API_SECRET=votre_api_secret_trello

# URL de base du frontend
FRONTEND_URL=http://localhost:4200
```

## Configuration par Service

### 1. Google Calendar

1. **Créer une application Google Cloud :**
   - Allez sur [Google Cloud Console](https://console.cloud.google.com/)
   - Créez un nouveau projet ou sélectionnez un projet existant
   - Activez l'API Google Calendar

2. **Configurer OAuth 2.0 :**
   - Dans "APIs & Services" > "Credentials"
   - Créez des "OAuth 2.0 Client IDs"
   - Type d'application : "Web application"
   - URIs de redirection autorisées : `http://localhost:4200/integrations/google-calendar/callback`

3. **Permissions :**
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/userinfo.email`

### 2. Microsoft Outlook

1. **Créer une application Azure :**
   - Allez sur [Azure Portal](https://portal.azure.com/)
   - "Azure Active Directory" > "App registrations"
   - Créez une nouvelle inscription d'application

2. **Configurer l'authentification :**
   - Plateforme : "Web"
   - URI de redirection : `http://localhost:4200/integrations/outlook/callback`

3. **Permissions API :**
   - Microsoft Graph > Calendars > Calendars.ReadWrite
   - Microsoft Graph > User > User.Read

### 3. Slack

1. **Créer une application Slack :**
   - Allez sur [Slack API](https://api.slack.com/apps)
   - Créez une nouvelle application

2. **Configurer OAuth :**
   - Dans "OAuth & Permissions"
   - Redirect URLs : `http://localhost:4200/integrations/slack/callback`

3. **Permissions (Scopes) :**
   - `chat:write` (pour envoyer des messages)
   - `channels:read` (pour lire les canaux)

### 4. Trello

1. **Obtenir une clé API Trello :**
   - Allez sur [Trello Developer](https://developer.atlassian.com/cloud/trello/guides/rest-api/api-introduction/)
   - Générez une clé API

2. **Configuration :**
   - L'authentification Trello utilise une approche différente
   - L'utilisateur sera redirigé vers Trello pour autoriser l'accès
   - URL de callback : `http://localhost:4200/integrations/trello/callback`

## Test des Intégrations

1. **Démarrer les serveurs :**
   ```bash
   # Backend
   cd backend && npm start

   # Frontend
   cd frontend && npm start
   ```

2. **Accéder à la page des intégrations :**
   - Connectez-vous à TaskFlow Pro
   - Allez dans "Intégrations Externes"

3. **Tester chaque intégration :**
   - Cliquez sur "Se connecter" pour chaque service
   - Autorisez l'accès dans la popup OAuth
   - Vérifiez que la connexion est établie

## Dépannage

### Erreurs Courantes

1. **"Invalid client" ou "Client not found" :**
   - Vérifiez que les CLIENT_ID sont corrects dans le fichier `.env`

2. **"Redirect URI mismatch" :**
   - Assurez-vous que les URIs de redirection correspondent exactement à celles configurées dans les applications OAuth

3. **"Access denied" :**
   - Vérifiez que les permissions/scopes sont correctement configurés

4. **Problèmes CORS :**
   - Assurez-vous que le backend permet les requêtes depuis le frontend

### Logs de Debug

- Ouvrez la console du navigateur (F12) pour voir les erreurs détaillées
- Vérifiez les logs du serveur backend pour les erreurs d'API

## Sécurité

- **Ne partagez jamais vos clés secrètes**
- **Utilisez HTTPS en production**
- **Configurez des restrictions d'IP si possible**
- **Surveillez l'utilisation de vos APIs**

## Support

Si vous rencontrez des problèmes, vérifiez :
1. La configuration des variables d'environnement
2. Les paramètres OAuth de chaque service
3. Les logs d'erreur dans la console
4. La documentation officielle de chaque API