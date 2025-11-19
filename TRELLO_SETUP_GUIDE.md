# 🔧 Guide de Configuration Trello

## Problème
Erreur "App not found" lors de la connexion Trello - l'API key n'est pas configurée.

## ✅ Solution

### 1. Créer une Application Trello

1. **Aller sur** [Trello Power-Ups Admin](https://trello.com/power-ups/admin/)
2. **Cliquer** "New" pour créer une nouvelle application
3. **Remplir les informations** :
   - **Name** : TaskFlow Pro
   - **Workspace** : Sélectionner votre workspace
   - **Description** : Intégration TaskFlow Pro pour synchroniser les tâches

### 2. Configurer l'Application

Dans les paramètres de l'application :

#### **API Key**
- L'API Key sera générée automatiquement
- **Notez cette clé** - c'est `TRELLO_API_KEY`

#### **OAuth**
- **Allowed Origins** : `https://nacer-dev.me`
- **Return URL** : `https://nacer-dev.me/api/integrations/trello/callback`

#### **Permissions**
- ✅ **read** : Lire les tableaux, listes, cartes
- ✅ **write** : Créer et modifier des cartes
- ✅ **account** : Accéder aux informations du compte

### 3. Variables d'Environnement Render

Ajouter dans Render :
```
TRELLO_API_KEY=votre_api_key_trello_ici
```

### 4. Frontend Environment

Le frontend est déjà configuré avec :
```typescript
trello: {
  apiKey: 'your_trello_api_key_here', // Remplacer par la vraie clé
  redirectUri: 'https://nacer-dev.me/api/integrations/trello/callback'
}
```

## 🔄 Processus OAuth Trello

1. **Clic "Se connecter"** → Redirection vers Trello
2. **Autorisation** → Trello génère un token
3. **Callback** → Token envoyé au backend
4. **Vérification** → Backend valide le token avec l'API key
5. **Connexion** → Intégration sauvegardée

## 🧪 Tester

Après configuration :
1. **Mettre à jour** `TRELLO_API_KEY` dans Render
2. **Redéployer** l'application
3. **Tester** la connexion Trello
4. **Vérifier** que l'intégration apparaît comme connectée

## 🔍 Dépannage

### "App not found"
- ✅ API key correcte dans Render
- ✅ Application créée sur Trello
- ✅ Permissions configurées

### "Invalid token"
- ✅ Token OAuth valide (expiré après 30 jours max avec `expiration=never`)
- ✅ API key correspond à l'application

### Erreur de callback
- ✅ URL de callback configurée dans Trello
- ✅ Route backend `/api/integrations/trello/callback` accessible