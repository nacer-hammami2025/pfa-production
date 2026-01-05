# 📊 Guide de Monitoring PFA - TaskFlow Pro

## 🚀 Démarrage Rapide

### 1. Démarrer MongoDB Local
```powershell
docker start mongodb-test
```

### 2. Démarrer le Backend
**Option A - Script PowerShell:**
```powershell
.\backend\start-backend.ps1
```

**Option B - Manuel:**
```powershell
cd backend
npm start
```

### 3. Démarrer la Stack Monitoring
```powershell
cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d
```

## 🎯 URLs d'Accès

| Service | URL | Identifiants |
|---------|-----|--------------|
| **Grafana** | http://localhost:3001 | `admin` / `admin123` |
| **Prometheus** | http://localhost:9090 | Pas de login |
| **Alertmanager** | http://localhost:9093 | Pas de login |
| **Backend API** | http://localhost:5001 | - |
| **Métriques Backend** | http://localhost:5001/api/metrics | - |
| **Health Check** | http://localhost:5001/api/health | - |

## 📈 Dashboards Disponibles dans Grafana

1. **PFA Complete Dashboard** - Vue complète avec toutes les métriques
2. **PFA Simple Clean** - Dashboard simplifié et clair
3. **PFA Unified Dashboard** - Dashboard unifié

## 🔍 Vérifications

### Vérifier que tous les services tournent:
```powershell
# Conteneurs Docker
docker ps | Select-String "pfa-|mongodb"

# Prometheus targets
# Ouvrir: http://localhost:9090/targets
# Le target 'pfa-backend' doit être UP (vert)
```

### Tester les métriques du backend:
```powershell
curl http://localhost:5001/api/metrics
```

### Tester Prometheus:
```powershell
# Vérifier que Prometheus scrape le backend
curl http://localhost:9090/api/v1/targets
```

## 🛠️ Métriques Disponibles

Le backend expose automatiquement les métriques suivantes:

- **http_requests_total** - Nombre total de requêtes HTTP
- **http_request_duration_seconds** - Durée des requêtes HTTP
- **nodejs_heap_size_total_bytes** - Mémoire heap totale
- **nodejs_heap_size_used_bytes** - Mémoire heap utilisée
- **nodejs_external_memory_bytes** - Mémoire externe
- **nodejs_eventloop_lag_seconds** - Latence de l'event loop
- Et bien d'autres métriques Node.js par défaut...

## 🔧 Configuration

### Fichiers de Configuration

- **Backend**: `backend/.env`
- **Prometheus**: `monitoring/prometheus/prometheus.yml`
- **Grafana**: `monitoring/grafana/provisioning/`
- **Alertmanager**: `monitoring/alertmanager/alertmanager.yml`

### Changer les Identifiants Grafana

Éditer `monitoring/docker-compose.monitoring.yml`:
```yaml
environment:
  - GF_SECURITY_ADMIN_PASSWORD=nouveau_mot_de_passe
  - GF_SECURITY_ADMIN_USER=nouveau_username
```

Puis redémarrer:
```powershell
docker-compose -f docker-compose.monitoring.yml restart grafana
```

## 🔄 Arrêter le Monitoring

```powershell
cd monitoring
docker-compose -f docker-compose.monitoring.yml down
```

## 📝 Notes

- Le backend doit tourner pour que Prometheus puisse collecter les métriques
- MongoDB doit être accessible pour que le backend fonctionne
- Les dashboards Grafana sont automatiquement provisionnés au démarrage
- Les données Prometheus sont persistées dans un volume Docker
