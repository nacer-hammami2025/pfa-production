# 🔧 Guide de Mise à Jour des URLs OAuth

## Problème Résolu
L'erreur 404 lors de la connexion Google Calendar était due à des URLs de callback incorrectes.

## ✅ Solution Implémentée
- **Avant** : Callbacks pointaient vers le frontend (`/integrations/*/callback`)
- **Après** : Callbacks pointent vers le backend (`/api/integrations/*/callback`) qui redirige vers le frontend

## 🚀 Actions Requises

### 1. Mettre à Jour Google Cloud Console

1. **Aller sur** [Google Cloud Console](https://console.cloud.google.com/)
2. **Sélectionner votre projet** (celui avec le client ID `310821257679-...`)
3. **Aller dans** "APIs & Services" → "Credentials"
4. **Cliquer sur** votre OAuth 2.0 Client ID
5. **Dans "Authorized redirect URIs"**, remplacer :
   ```
   ❌ https://nacer-dev.me/integrations/google-calendar/callback
   ✅ https://nacer-dev.me/api/integrations/google-calendar/callback
   ```
6. **Sauvegarder**

### 2. Variables d'Environnement Render

Vérifier que ces variables sont configurées dans Render :
```
FRONTEND_URL=https://nacer-dev.me
GOOGLE_CLIENT_ID=310821257679-u275u71vsiuv2qv67sqq2s3q2pdlteun.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=[votre_secret]
```

### 3. Tester la Connexion

Après déploiement et mise à jour Google :
1. **Aller sur** `https://nacer-dev.me/integrations`
2. **Cliquer** "Se connecter" pour Google Calendar
3. **Autoriser** l'application
4. **Résultat attendu** : Redirection vers la page intégrations avec message de succès

## 🔍 Dépannage

Si vous avez encore des erreurs :

1. **Vérifier les logs Render** pour les erreurs backend
2. **Tester les routes** avec le script `node test-integrations-callback.js`
3. **Vérifier les variables** dans Render dashboard

## 📞 Support

Si le problème persiste, vérifier :
- ✅ Déploiement Render terminé
- ✅ URLs Google Cloud mises à jour
- ✅ Variables d'environnement correctes
- ✅ Routes backend accessibles