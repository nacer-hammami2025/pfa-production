# Guide: Utiliser MongoDB local avec vos données

## 📋 Option 1: Continuer avec Atlas (Recommandé si possible)

Le problème semble être un pare-feu/antivirus qui bloque MongoDB.

**Actions à essayer:**
1. Désactiver temporairement Windows Defender Firewall
2. Ajouter une exception pour Node.js dans le pare-feu
3. Vérifier si un VPN/Proxy bloque la connexion

## 📋 Option 2: Utiliser MongoDB local avec vos données

### Étape 1: Installer MongoDB Compass (si pas déjà fait)
Télécharger: https://www.mongodb.com/try/download/compass

### Étape 2: Se connecter à Atlas via Compass
1. Ouvrir MongoDB Compass
2. URI de connexion: `mongodb+srv://mohamednacerhammami:Hammami2025@devdashcluster.wksgu.mongodb.net/DevDashboard`
3. Cliquer "Connect"

### Étape 3: Exporter les collections
Pour chaque collection (projects, tasks, users, teams):
1. Sélectionner la collection
2. Cliquer "Export Collection"
3. Format: JSON
4. Sauvegarder dans: `C:\Users\mohamednacer.hammami\Documents\PFA\backend\db-export\`

### Étape 4: Se connecter à MongoDB local
1. Nouvelle connexion Compass
2. URI: `mongodb://localhost:27017`
3. Créer une base "DevDashboard"

### Étape 5: Importer les collections
Pour chaque fichier JSON exporté:
1. Sélectionner la collection
2. "Add Data" → "Import JSON or CSV file"
3. Sélectionner le fichier
4. "Import"

### Étape 6: Modifier le .env
Décommenter la ligne:
```
MONGODB_URI=mongodb://localhost:27017/DevDashboard
```

Et commenter la ligne Atlas.

## 📋 Option 3: Export/Import automatique (si mongodump disponible)

PowerShell:
```powershell
# Export depuis Atlas
mongodump --uri="mongodb+srv://mohamednacerhammami:Hammami2025@devdashcluster.wksgu.mongodb.net/DevDashboard" --out="C:\Users\mohamednacer.hammami\Documents\PFA\backup"

# Import vers local
mongorestore --uri="mongodb://localhost:27017" --db=DevDashboard "C:\Users\mohamednacer.hammami\Documents\PFA\backup\DevDashboard"
```

## 🎯 Résultat attendu

Une fois importé, Grafana affichera:
- ✅ **Total Projects**: 3
- ✅ **Tasks by Status**: Vos vraies tâches
- ✅ **Active Teams**: Vos équipes
- ✅ **User Activity**: Activité réelle

Les métriques système (CPU, Memory, HTTP) fonctionnent déjà!
