# 🔒 Configuration SSL avec Let's Encrypt

Guide complet pour obtenir et configurer un certificat SSL gratuit avec Let's Encrypt pour nacer-dev.me.

## Prérequis

- Serveur accessible sur Internet
- Domaine `nacer-dev.me` pointant vers l'IP du serveur (DNS configuré)
- Port 80 ouvert (pour la validation HTTP-01)
- Accès root/sudo sur le serveur

## Installation de Certbot

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
```

### CentOS/RHEL
```bash
sudo yum install epel-release
sudo yum install certbot python3-certbot-nginx
```

## Obtention du Certificat SSL

### Méthode 1: Automatique avec Nginx (Recommandé)

```bash
# Arrêter Nginx temporairement
sudo systemctl stop nginx

# Obtenir le certificat
sudo certbot certonly --standalone -d nacer-dev.me -d www.nacer-dev.me

# Redémarrer Nginx
sudo systemctl start nginx
```

### Méthode 2: Avec Nginx en fonctionnement

```bash
# Si Nginx est déjà configuré
sudo certbot --nginx -d nacer-dev.me -d www.nacer-dev.me
```

### Méthode 3: Webroot (si vous avez un serveur web actif)

```bash
sudo certbot certonly --webroot -w /var/www/certbot \
    -d nacer-dev.me -d www.nacer-dev.me
```

## Informations Demandées

Lors de l'exécution, Certbot demandera :

1. **Email** : `votre-email@example.com` (pour renouvellements et alertes)
2. **Accepter les ToS** : `Y`
3. **Partager l'email** : `N` (optionnel)
4. **Redirect HTTP → HTTPS** : `2` (oui, recommandé)

## Vérification du Certificat

```bash
# Vérifier les certificats installés
sudo certbot certificates

# Tester la configuration SSL
sudo nginx -t

# Tester en ligne
curl -I https://nacer-dev.me
```

## Structure des Fichiers SSL

Les certificats sont créés dans `/etc/letsencrypt/` :

```
/etc/letsencrypt/
├── live/
│   └── nacer-dev.me/
│       ├── fullchain.pem   → Certificat complet
│       ├── privkey.pem     → Clé privée
│       ├── cert.pem        → Certificat seul
│       └── chain.pem       → Chaîne de certificats
├── archive/                → Historique des certificats
└── renewal/                → Configuration de renouvellement
```

## Configuration Nginx

La configuration Nginx dans `nginx.conf` utilise déjà les bons chemins :

```nginx
ssl_certificate /etc/letsencrypt/live/nacer-dev.me/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/nacer-dev.me/privkey.pem;
```

## Renouvellement Automatique

Let's Encrypt émet des certificats valides 90 jours. Certbot configure automatiquement le renouvellement.

### Vérifier le Renouvellement Automatique

```bash
# Vérifier le timer systemd
sudo systemctl status certbot.timer

# Tester le renouvellement (dry-run)
sudo certbot renew --dry-run
```

### Configuration Manuelle du Renouvellement

Si le timer n'est pas actif, configurez un cron job :

```bash
# Éditer le crontab
sudo crontab -e

# Ajouter cette ligne (renouvellement à 2h du matin tous les jours)
0 2 * * * certbot renew --quiet --post-hook "systemctl reload nginx"
```

### Hook Post-Renouvellement

Pour recharger Nginx après renouvellement :

```bash
# Créer un script de hook
sudo nano /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh
```

Contenu du script :
```bash
#!/bin/bash
systemctl reload nginx
```

Rendre exécutable :
```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/post/reload-nginx.sh
```

## Sécurité SSL Avancée

### Générer des Paramètres Diffie-Hellman

```bash
sudo openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
```

### Configuration SSL Optimale (déjà dans nginx.conf)

```nginx
# Protocoles modernes uniquement
ssl_protocols TLSv1.2 TLSv1.3;

# Ciphers sécurisés
ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';

# HSTS (HTTP Strict Transport Security)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## Test de la Configuration SSL

### Outil en ligne

Visitez : https://www.ssllabs.com/ssltest/analyze.html?d=nacer-dev.me

Objectif : **Note A ou A+**

### Tests en ligne de commande

```bash
# Tester la connexion SSL
openssl s_client -connect nacer-dev.me:443 -servername nacer-dev.me

# Vérifier les protocoles supportés
nmap --script ssl-enum-ciphers -p 443 nacer-dev.me

# Tester avec curl
curl -vI https://nacer-dev.me
```

## Troubleshooting

### Erreur : "Port 80 already in use"

```bash
# Identifier le processus
sudo lsof -i :80

# Arrêter Nginx temporairement
sudo systemctl stop nginx

# Relancer certbot
sudo certbot certonly --standalone -d nacer-dev.me
```

### Erreur : "DNS problem: NXDOMAIN"

```bash
# Vérifier la résolution DNS
nslookup nacer-dev.me
dig nacer-dev.me

# Attendre la propagation DNS (peut prendre 24-48h)
```

### Erreur : "Certificate verify failed"

```bash
# Forcer le renouvellement
sudo certbot renew --force-renewal

# Recharger Nginx
sudo systemctl reload nginx
```

### Certificat Expiré

```bash
# Renouveler immédiatement
sudo certbot renew

# Vérifier la date d'expiration
openssl x509 -in /etc/letsencrypt/live/nacer-dev.me/cert.pem -noout -dates
```

## Certificat Wildcard (Optionnel)

Pour `*.nacer-dev.me` (sous-domaines) :

```bash
sudo certbot certonly --manual --preferred-challenges=dns \
    -d nacer-dev.me -d "*.nacer-dev.me"
```

Suivre les instructions pour ajouter un enregistrement DNS TXT.

## Révocation de Certificat

En cas de compromission :

```bash
sudo certbot revoke --cert-path /etc/letsencrypt/live/nacer-dev.me/cert.pem
sudo certbot delete --cert-name nacer-dev.me
```

## Checklist Finale

- [ ] Certificat obtenu avec succès
- [ ] Nginx configuré avec les bons chemins
- [ ] HTTPS fonctionne sur https://nacer-dev.me
- [ ] HTTP redirige vers HTTPS
- [ ] Renouvellement automatique actif
- [ ] Test SSL Labs = Note A/A+
- [ ] Headers de sécurité présents (HSTS, X-Frame-Options)
- [ ] Backend accessible via `/api/*`

## Liens Utiles

- Documentation Certbot : https://certbot.eff.org/
- Let's Encrypt : https://letsencrypt.org/
- SSL Labs Test : https://www.ssllabs.com/ssltest/
- Mozilla SSL Config Generator : https://ssl-config.mozilla.org/
