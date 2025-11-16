# 📊 Guide d'Intégration Prometheus/Grafana pour PFA

Ce guide vous explique comment intégrer un système de monitoring complet avec Prometheus et Grafana dans votre application PFA.

## 🎯 Vue d'ensemble

Le stack de monitoring inclut :
- **Prometheus** : Collecte des métriques
- **Grafana** : Visualisation et dashboards
- **Alertmanager** : Gestion des alertes
- **Node Exporter** : Métriques système
- **MongoDB Exporter** : Métriques MongoDB
- **cAdvisor** : Métriques conteneurs

## 🚀 Installation et Configuration

### 1. Installation des dépendances

```bash
# Dans le dossier backend
cd backend
npm install prom-client@^15.1.0
```

### 2. Démarrage du monitoring

```bash
# Méthode 1: Script automatique
chmod +x monitoring/start-monitoring.sh
./monitoring/start-monitoring.sh

# Méthode 2: Docker Compose manuel
docker-compose -f monitoring/docker-compose.monitoring.yml up -d
```

### 3. Configuration des variables d'environnement

Ajoutez dans votre `.env` :

```env
# MongoDB URI pour l'exporter MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

# Configuration des alertes email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ALERT_EMAIL=admin@nacer-dev.me
```

## 📊 Accès aux interfaces

### Prometheus
- **URL**: http://localhost:9090
- **Usage**: Exploration des métriques, requêtes PromQL
- **Métriques PFA**: http://localhost:5001/api/metrics

### Grafana
- **URL**: http://localhost:3001
- **Login**: admin / admin123
- **Dashboards**: Pre-configurés pour PFA

### Alertmanager
- **URL**: http://localhost:9093
- **Usage**: Gestion des alertes et notifications

## 📈 Métriques Disponibles

### Métriques Application PFA
```promql
# Taux de requêtes HTTP
rate(http_requests_total[5m])

# Temps de réponse (95e percentile)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Taux d'erreurs
rate(http_requests_total{status=~"5.."}[5m])

# Nombre de tâches
pfa_tasks_total{status="pending"}
pfa_tasks_total{status="completed"}

# Nombre de projets
pfa_projects_total
```

### Métriques Système
```promql
# Usage CPU
100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[2m])) * 100)

# Usage mémoire
process_resident_memory_bytes / 1024 / 1024

# Usage disque
(node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100
```

### Métriques MongoDB
```promql
# État MongoDB
mongodb_up

# Connexions actives
mongodb_connections{state="current"}

# Opérations par seconde
rate(mongodb_op_counters_total[5m])
```

## 🚨 Configuration des Alertes

### Alertes Pré-configurées

1. **Temps de réponse élevé** (>2s pendant 5min)
2. **Taux d'erreur élevé** (>10% pendant 2min)
3. **Service indisponible** (>1min)
4. **Usage mémoire élevé** (>400MB pendant 5min)
5. **MongoDB déconnecté** (>1min)

### Notifications

Les alertes peuvent être envoyées par :
- **Email** (configuré dans alertmanager.yml)
- **Slack** (webhook à configurer)
- **Discord** (webhook à configurer)

## 📊 Dashboards Grafana

### Dashboard Principal PFA
- Taux de requêtes HTTP
- Temps de réponse
- Taux d'erreurs
- Métriques métier (tâches, projets)
- Usage mémoire/CPU
- État MongoDB

### Dashboards Système
- **Node Exporter Full** (ID: 1860)
- **Docker Container Metrics** (ID: 193)
- **MongoDB Metrics** (ID: 2583)

## 🔧 Personnalisation

### Ajouter des métriques personnalisées

```javascript
// Dans votre code backend
const { metrics } = require('./middleware/metrics');

// Exemple: Compteur de connexions utilisateur
const userLogins = new promClient.Counter({
  name: 'pfa_user_logins_total',
  help: 'Total user logins',
  labelNames: ['method']
});

// Incrémenter lors d'une connexion
userLogins.labels('password').inc();
userLogins.labels('mfa').inc();
```

### Modifier les seuils d'alerte

Éditez `monitoring/prometheus/rules/alerts.yml` :

```yaml
- alert: HighResponseTime
  expr: http_request_duration_seconds{quantile="0.95"} > 1  # Changé de 2s à 1s
  for: 2m  # Changé de 5m à 2m
```

## 🐳 Déploiement Production

### Docker Swarm
```bash
docker stack deploy -c monitoring/docker-compose.monitoring.yml monitoring
```

### Kubernetes (avec Helm)
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack
```

### Configuration Render.com

Ajoutez dans votre `render.yaml` :

```yaml
services:
  - type: web
    name: pfa-monitoring
    env: docker
    dockerfilePath: ./monitoring/Dockerfile
    envVars:
      - key: PROMETHEUS_CONFIG
        fromService:
          type: web
          name: pfa-backend
          envVarKey: PROMETHEUS_CONFIG
```

## 🔍 Dépannage

### Services ne démarrent pas
```bash
# Vérifier les logs
docker-compose -f monitoring/docker-compose.monitoring.yml logs

# Vérifier les permissions
sudo chown -R 472:472 monitoring/grafana/data
sudo chown -R 65534:65534 monitoring/prometheus/data
```

### Métriques non disponibles
```bash
# Tester l'endpoint métriques
curl http://localhost:5001/api/metrics

# Vérifier la configuration Prometheus
curl http://localhost:9090/api/v1/targets
```

### Alertes non reçues
```bash
# Tester Alertmanager
curl -X POST http://localhost:9093/api/v1/alerts

# Vérifier la configuration email
docker logs pfa-alertmanager
```

## 📚 Ressources Utiles

- [Documentation Prometheus](https://prometheus.io/docs/)
- [Documentation Grafana](https://grafana.com/docs/)
- [PromQL Guide](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [Alerting Rules](https://prometheus.io/docs/prometheus/latest/configuration/alerting_rules/)

## 🎉 Résultat Final

Une fois configuré, vous aurez :

✅ **Monitoring temps réel** de votre application PFA  
✅ **Dashboards visuels** pour toutes les métriques  
✅ **Alertes automatiques** en cas de problème  
✅ **Historique des performances** sur 90 jours  
✅ **Métriques métier** (tâches, projets, utilisateurs)  
✅ **Monitoring infrastructure** (CPU, RAM, disque)  

Votre application PFA aura désormais un niveau de monitoring professionnel ! 🚀