# PFA Production Application

Application de gestion de productivité avec authentification, gestion d'équipes, et tableaux de bord administrateur.

## Déploiement Railway

Cette application est configurée pour être déployée sur Railway avec build automatique.

## Structure

- `backend/` - API Node.js avec Express et MongoDB
- `frontend/` - Application Angular
- `railway.toml` - Configuration Railway

## Variables d'environnement nécessaires

```
NODE_ENV=production
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your_sendgrid_api_key
EMAIL_FROM=your_email
FRONTEND_URL=your_domain
ALLOWED_ORIGINS=your_domain,railway_url
```