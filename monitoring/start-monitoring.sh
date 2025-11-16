#!/bin/bash

# Script de démarrage du monitoring Prometheus/Grafana pour PFA
# Usage: ./start-monitoring.sh

set -e

echo "🚀 Démarrage du stack de monitoring PFA..."

# Vérifier que Docker est installé et en cours d'exécution
if ! command -v docker &> /dev/null; then
    echo "❌ Docker n'est pas installé. Veuillez installer Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker n'est pas en cours d'exécution. Veuillez démarrer Docker."
    exit 1
fi

# Créer les répertoires nécessaires s'ils n'existent pas
echo "📁 Création des répertoires de données..."
mkdir -p ./monitoring/prometheus/data
mkdir -p ./monitoring/grafana/data
mkdir -p ./monitoring/alertmanager/data

# Définir les permissions appropriées
chmod 777 ./monitoring/prometheus/data
chmod 777 ./monitoring/grafana/data
chmod 777 ./monitoring/alertmanager/data

# Installer prom-client dans le backend si pas déjà fait
echo "📦 Installation des dépendances Node.js..."
cd backend
if ! npm list prom-client &> /dev/null; then
    npm install prom-client@^15.1.0
fi
cd ..

# Démarrer les services de monitoring
echo "🐳 Démarrage des conteneurs de monitoring..."
docker-compose -f monitoring/docker-compose.monitoring.yml up -d

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 30

# Vérifier l'état des services
echo "🔍 Vérification de l'état des services..."

# Prometheus
if curl -s http://localhost:9090/-/ready | grep -q "Prometheus is Ready"; then
    echo "✅ Prometheus est prêt sur http://localhost:9090"
else
    echo "⚠️  Prometheus n'est pas encore prêt"
fi

# Grafana
if curl -s http://localhost:3001/api/health | grep -q "ok"; then
    echo "✅ Grafana est prêt sur http://localhost:3001 (admin/admin123)"
else
    echo "⚠️  Grafana n'est pas encore prêt"
fi

# Alertmanager
if curl -s http://localhost:9093/-/ready | grep -q "Alertmanager is Ready"; then
    echo "✅ Alertmanager est prêt sur http://localhost:9093"
else
    echo "⚠️  Alertmanager n'est pas encore prêt"
fi

echo ""
echo "🎉 Stack de monitoring démarré avec succès!"
echo ""
echo "📊 URLs des services:"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3001 (admin/admin123)"
echo "  - Alertmanager: http://localhost:9093"
echo "  - Node Exporter: http://localhost:9100"
echo "  - cAdvisor: http://localhost:8080"
echo ""
echo "📈 Pour voir les métriques de votre application:"
echo "  - Démarrez votre backend PFA"
echo "  - Visitez http://localhost:5001/api/metrics"
echo ""
echo "🛑 Pour arrêter le monitoring:"
echo "  docker-compose -f monitoring/docker-compose.monitoring.yml down"