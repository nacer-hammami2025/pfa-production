# MongoDB Migration Script
# Migrer les données de développement vers production (optionnel)

## Option 1 : Export/Import Complet

### Export depuis le développement local
```bash
# Export de toutes les données
mongodump --uri="mongodb://localhost:27017/pfa" --out=./backup-dev

# Ou export avec compression
mongodump --uri="mongodb://localhost:27017/pfa" --archive=pfa-dev.gz --gzip
```

### Import vers MongoDB Atlas (production)
```bash
# Import sans compression
mongorestore --uri="mongodb+srv://username:password@cluster.mongodb.net/pfa_production" ./backup-dev/pfa

# Ou import avec compression
mongorestore --uri="mongodb+srv://username:password@cluster.mongodb.net/pfa_production" --archive=pfa-dev.gz --gzip
```

## Option 2 : Migration Sélective (Recommandé)

### Exporter seulement certaines collections
```bash
# Exporter les utilisateurs
mongoexport --uri="mongodb://localhost:27017/pfa" --collection=users --out=users.json

# Exporter les équipes
mongoexport --uri="mongodb://localhost:27017/pfa" --collection=teams --out=teams.json

# Exporter les projets
mongoexport --uri="mongodb://localhost:27017/pfa" --collection=projects --out=projects.json
```

### Importer vers production
```bash
# Importer les utilisateurs
mongoimport --uri="mongodb+srv://username:password@cluster.mongodb.net/pfa_production" --collection=users --file=users.json

# Importer les équipes
mongoimport --uri="mongodb+srv://username:password@cluster.mongodb.net/pfa_production" --collection=teams --file=teams.json

# Importer les projets
mongoimport --uri="mongodb+srv://username:password@cluster.mongodb.net/pfa_production" --collection=projects --file=projects.json
```

## Option 3 : Script Node.js Automatisé

Créer `backend/migrations/migrate-to-production.js` :

```javascript
const mongoose = require('mongoose');

// Configurations
const DEV_URI = 'mongodb://localhost:27017/pfa';
const PROD_URI = 'mongodb+srv://username:password@cluster.mongodb.net/pfa_production';

// Collections à migrer
const COLLECTIONS = ['users', 'teams', 'projects', 'tasks', 'timeentries'];

async function migrate() {
  try {
    console.log('🚀 Début de la migration...\n');
    
    // Connexion source (développement)
    const devConn = await mongoose.createConnection(DEV_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connecté à la base de développement');
    
    // Connexion destination (production)
    const prodConn = await mongoose.createConnection(PROD_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connecté à la base de production');
    
    // Migrer chaque collection
    for (const collectionName of COLLECTIONS) {
      console.log(`\n📦 Migration de ${collectionName}...`);
      
      const devCollection = devConn.collection(collectionName);
      const prodCollection = prodConn.collection(collectionName);
      
      // Compter les documents
      const count = await devCollection.countDocuments();
      console.log(`   Total documents: ${count}`);
      
      if (count === 0) {
        console.log('   ⚠️  Collection vide, ignorée');
        continue;
      }
      
      // Récupérer tous les documents
      const documents = await devCollection.find({}).toArray();
      
      // Insérer dans la production
      if (documents.length > 0) {
        await prodCollection.insertMany(documents);
        console.log(`   ✅ ${documents.length} documents migrés`);
      }
    }
    
    // Fermer les connexions
    await devConn.close();
    await prodConn.close();
    
    console.log('\n✅ Migration terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    process.exit(1);
  }
}

// Exécuter la migration
migrate();
```

### Utilisation du script
```bash
cd backend
node migrations/migrate-to-production.js
```

## Option 4 : Démarrer avec une Base Vide

Si vous ne voulez pas migrer les données de développement :

1. La base de production sera automatiquement créée au premier démarrage
2. Créer un utilisateur admin initial :

```bash
cd /var/www/pfa/backend
node create-admin.js
```

Ou avec un script :
```javascript
// backend/create-admin-prod.js
require('dotenv').config({ path: '.env.production' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    const adminData = {
      name: 'Admin',
      email: 'admin@nacer-dev.me',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin'
    };
    
    const admin = await User.create(adminData);
    console.log('✅ Admin créé:', admin.email);
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

createAdmin();
```

## Vérification Post-Migration

### 1. Compter les documents
```bash
# Se connecter à MongoDB Atlas
mongosh "mongodb+srv://username:password@cluster.mongodb.net/pfa_production"

# Compter les documents de chaque collection
use pfa_production
db.users.countDocuments()
db.teams.countDocuments()
db.projects.countDocuments()
db.tasks.countDocuments()
```

### 2. Vérifier un utilisateur
```javascript
db.users.findOne({ email: "admin@example.com" })
```

### 3. Créer les index nécessaires
```javascript
// Les index sont normalement créés par Mongoose, mais on peut les vérifier
db.users.createIndex({ email: 1 }, { unique: true })
db.teams.createIndex({ name: 1 })
db.projects.createIndex({ name: 1 })
db.tasks.createIndex({ project: 1 })
```

## Rollback

En cas de problème, restaurer depuis un backup :

```bash
# Supprimer les données de production
mongosh "mongodb+srv://username:password@cluster.mongodb.net/pfa_production" --eval "db.dropDatabase()"

# Restaurer depuis le backup
mongorestore --uri="mongodb+srv://username:password@cluster.mongodb.net/pfa_production" --archive=backup.gz --gzip
```

## Conseils de Sécurité

1. **Toujours faire un backup avant migration**
2. **Ne jamais migrer les mots de passe en clair** (déjà hashés avec bcrypt, OK)
3. **Vérifier les variables d'environnement** avant la migration
4. **Tester sur une base de staging** avant la production
5. **Supprimer les données de test** si nécessaire :

```javascript
// Supprimer les utilisateurs de test
db.users.deleteMany({ email: { $regex: /test|demo/i } })
```

## Checklist Migration

- [ ] Backup de la base de développement créé
- [ ] MongoDB Atlas configuré et accessible
- [ ] URI de production testée (connexion OK)
- [ ] Script de migration préparé
- [ ] Migration exécutée avec succès
- [ ] Nombre de documents vérifié (dev = prod)
- [ ] Utilisateur admin créé/vérifié
- [ ] Index créés automatiquement par Mongoose
- [ ] Application démarrée et testée
- [ ] Backup de la nouvelle base de production créé
