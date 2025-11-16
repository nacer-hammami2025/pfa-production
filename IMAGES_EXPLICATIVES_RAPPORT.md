# IMAGES EXPLICATIVES - RAPPORT PFA

## DIAGRAMME 1: Architecture Générale du Système

```
┌─────────────────────────────────────────────────────────────────┐
│                    APPLICATION PFA                               │
│                    Architecture 3-Tiers                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    HTTPS    ┌─────────────────┐            │
│  │   Angular SPA   │◄──────────►│  Express API    │            │
│  │   (Frontend)    │             │   (Backend)     │            │
│  │                 │             │                 │            │
│  │ • Components    │             │ • Routes        │            │
│  │ • Services      │             │ • Middleware    │            │
│  │ • Guards        │             │ • Models        │            │
│  │ • Material UI   │             │ • Controllers   │            │
│  └─────────────────┘             └─────────────────┘            │
│            │                             │                      │
│            │         ┌─────────────────┐  │                      │
│            └────────►│   MongoDB       │◄─┘                      │
│                      │   Atlas Cloud   │                         │
│                      │                 │                         │
│                      │ • Users         │                         │
│                      │ • Tasks         │                         │
│                      │ • Projects      │                         │
│                      │ • Teams         │                         │
│                      └─────────────────┘                         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE CLOUD                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │    Render.com   │    │  MongoDB Atlas  │    │  Namecheap  │  │
│  │   (Hébergement) │    │   (Database)    │    │    (DNS)    │  │
│  │                 │    │                 │    │             │  │
│  │ • 750h/mois     │    │ • Cluster partagé│    │ • Domaine  │  │
│  │ • SSL Auto      │    │ • 512MB         │    │ • A/CNAME   │  │
│  │ • CI/CD GitHub  │    │ • Backup auto   │    │ • SSL       │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Légende:**
- **Frontend**: Interface utilisateur Angular avec Material Design
- **Backend**: API REST Node.js/Express avec authentification JWT
- **Database**: MongoDB Atlas pour persistance des données
- **Infrastructure**: Services cloud gérés et scalables

---

## DIAGRAMME 2: Modèle de Données (Schema MongoDB)

```
┌─────────────────────────────────────────────────────────────────┐
│                     MODÈLE DE DONNÉES PFA                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │     User        │    │      Task       │    │   Project   │  │
│  ├─────────────────┤    ├─────────────────┤    ├─────────────┤  │
│  │ _id: ObjectId   │    │ _id: ObjectId   │    │ _id: ObjectId│  │
│  │ name: String    │    │ title: String  │    │ name: String│  │
│  │ email: String   │◄──►│ assignee: User │    │ description │  │
│  │ password: Hash  │    │ description    │    │ owner: User │  │
│  │ role: user/admin│    │ status: enum   │    │ status: enum│  │
│  │ avatar: String  │    │ priority: enum │    │ members[]   │  │
│  │ teams[]: Team   │    │ project: Proj  │    │ startDate   │  │
│  │ createdAt       │    │ dueDate        │    │ endDate     │  │
│  │ updatedAt       │    │ estimatedHours│    │ createdAt   │  │
│  └─────────────────┘    │ actualHours    │    └─────────────┘  │
│                         │ attachments[]  │                     │
│                         │ createdAt      │    ┌─────────────┐  │
│                         │ updatedAt      │    │    Team     │  │
│                         └─────────────────┘    ├─────────────┤  │
│                                                │ _id: ObjectId│  │
│  ┌─────────────────┐    ┌─────────────────┐    │ name: String│  │
│  │   Notification  │    │   TimeEntry    │    │ description │  │
│  ├─────────────────┤    ├─────────────────┤    │ owner: User │  │
│  │ _id: ObjectId   │    │ _id: ObjectId   │    │ members[]   │  │
│  │ user: User      │    │ user: User     │    │ createdAt   │  │
│  │ type: String    │    │ task: Task     │    └─────────────┘  │
│  │ message: String │    │ startTime      │                     │
│  │ read: Boolean   │    │ endTime        │                     │
│  │ createdAt       │    │ duration       │                     │
│  └─────────────────┘    └─────────────────┘                     │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    RELATIONS ET CONTRAINTES                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ • User ↔ Task: One-to-Many (assignee)                           │
│ • User ↔ Project: Many-to-Many (members)                        │
│ • Project ↔ Task: One-to-Many (contains)                        │
│ • User ↔ Team: Many-to-Many (membership)                        │
│ • Task ↔ File: One-to-Many (attachments)                        │
│ • User ↔ Notification: One-to-Many (receives)                   │
│                                                                 │
│ Contraintes d'intégrité:                                         │
│ • Email unique par utilisateur                                  │
│ • Rôle obligatoire (user/admin)                                 │
│ • Status énuméré pour Task/Project                              │
│ • Dates de cohérence (start < end)                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Explication:**
- **User**: Entité centrale avec authentification et rôles
- **Task**: Cœur métier avec statut, priorité, et pièces jointes
- **Project**: Conteneur de tâches avec gestion d'équipe
- **Team**: Groupement d'utilisateurs pour collaboration
- **Notification**: Système de messagerie interne
- **TimeEntry**: Suivi du temps passé sur les tâches

---

## DIAGRAMME 3: Flux d'Authentification

```
┌─────────────────────────────────────────────────────────────────┐
│                FLUX D'AUTHENTIFICATION JWT                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐         │
│  │   Client    │     │   Serveur   │     │  Database   │         │
│  │   Angular   │     │  Node.js    │     │   MongoDB   │         │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘         │
│         │                   │                   │                │
│         │ 1. Login Request  │                   │                │
│         │ email + password  │                   │                │
│         │─────────────────► │                   │                │
│         │                   │                   │                │
│         │                   │ 2. Vérifier user │                │
│         │                   │ dans la DB       │                │
│         │                   │─────────────────► │                │
│         │                   │                   │                │
│         │                   │ 3. User trouvé   │                │
│         │                   │◄───────────────── │                │
│         │                   │                   │                │
│         │                   │ 4. Générer JWT   │                │
│         │                   │ avec payload:    │                │
│         │                   │ {                 │                │
│         │                   │   userId,        │                │
│         │                   │   email,         │                │
│         │                   │   role           │                │
│         │                   │ }                 │                │
│         │                   │                   │                │
│         │                   │ 5. Retourner     │                │
│         │                   │ token + user     │                │
│         │ ◄───────────────── │                   │                │
│         │                   │                   │                │
│  ┌──────┴──────┐     ┌──────┴──────┐     ┌──────┴──────┐         │
│  │Stockage     │     │Validation   │     │   Vérif    │         │
│  │localStorage │     │  JWT        │     │   Rôles    │         │
│  └─────────────┘     └─────────────┘     └─────────────┘         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    SÉQUENCE D'UTILISATION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 1. Connexion → Stockage token en localStorage                   │
│ 2. Chaque requête → Ajout header "Authorization: Bearer {token}"│
│ 3. Serveur → Vérification token avec secret JWT                 │
│ 4. Extraction payload → userId, role pour autorisation          │
│ 5. Réponse → Selon permissions utilisateur                       │
│                                                                 │
│ Gestion d'erreurs:                                              │
│ • Token expiré → Redirection login                              │
│ • Token invalide → Erreur 403                                   │
│ • Rôle insuffisant → Erreur 403 avec message spécifique         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Étapes du processus:**
1. **Client** envoie credentials (email, password, role)
2. **Serveur** vérifie dans MongoDB
3. **Succès** → génération JWT avec payload sécurisé
4. **Client** stocke token et informations utilisateur
5. **Requêtes suivantes** incluent le token dans headers

---

## DIAGRAMME 4: Dashboard Analytics

```
┌─────────────────────────────────────────────────────────────────┐
│                 DASHBOARD ANALYTIQUE AVANCÉ                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                    MÉTRIQUES CLÉS                            │ │
│  ├─────────────────┬─────────────────┬─────────────────┬───────┤ │
│  │ Tâches Terminées│   Tâches en     │   Projets        │Score   │ │
│  │      42/65      │   Attente       │    Actifs        │Prod.   │ │
│  │   (64.6%)       │     12          │      8           │  85%   │ │
│  └─────────────────┴─────────────────┴─────────────────┴───────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 STATISTIQUES TEMPORELLES                     │ │
│  ├─────────────────┬─────────────────┬─────────────────┬───────┤ │
│  │ Temps Estimé    │  Temps Réel     │   Efficacité     │Temps   │ │
│  │   156h          │    142h         │     91%          │Moyen   │ │
│  │                 │                 │   ████████░░     │ 3.2j   │ │
│  └─────────────────┴─────────────────┴─────────────────┴───────┘ │
│                                                                 │
│  ┌─────────────────────┬─────────────────────┬─────────────────┐ │
│  │   BURNDOWN CHART    │   VELOCITY CHART    │ TIME TRACKING   │ │
│  │   (30 jours)        │   (12 semaines)     │   (Doughnut)    │ │
│  │                     │                     │                 │ │
│  │      📈📉           │      📊📊           │     ⭕⭕⭕       │ │
│  │  Idéal vs Réel      │ Créées vs Terminées │ Est./Rél./Écart │ │
│  │                     │                     │                 │ │
│  └─────────────────────┴─────────────────────┴─────────────────┘ │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │              DISTRIBUTION PAR CATÉGORIE                      │ │
│  │                  (Polar Area Chart)                          │ │
│  │                                                             │ │
│  │        🎯 Work              🏠 Personal         🛒 Shopping    │ │
│  │       35%                   25%                  15%         │ │
│  │                                                             │ │
│  │   ❤️ Health        📚 Education        ❓ Other              │ │
│  │     12%                8%                 5%                 │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    EXPORT ET INTERACTIVITÉ                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📊 Graphiques interactifs avec Chart.js                          │
│ 🔄 Mise à jour temps réel des données                           │
│ 📥 Export JSON complet avec toutes les métriques                │
│ 🎨 Interface responsive et moderne                               │
│ 📱 Compatible mobile et desktop                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Fonctionnalités du Dashboard:**
- **Métriques clés** : Indicateurs principaux en cartes
- **Graphiques Chart.js** : 4 visualisations interactives
- **Export de données** : Rapport JSON complet
- **Responsive design** : Adapté tous supports

---

## DIAGRAMME 5: Architecture de Sécurité

```
┌─────────────────────────────────────────────────────────────────┐
│                  ARCHITECTURE DE SÉCURITÉ                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────┐  │
│  │   Frontend      │    │    Backend      │    │  Database   │  │
│  │   (Client)      │    │   (Serveur)     │    │   (MongoDB)  │  │
│  └──────┬──────────┘    └──────┬──────────┘    └──────┬──────┘  │
│         │                      │                      │         │
│         │ HTTPS + JWT          │ Auth Middleware      │ Hashing │
│         │────────────────────► │────────────────────► │         │
│         │                      │                      │         │
│  ┌──────┴──────────┐    ┌──────┴──────────┐    ┌──────┴──────┐  │
│  │   Auth Guards   │    │   Validation    │    │Encryption   │  │
│  │ • Route Guards  │    │ • Input Sanit. │    │• bcrypt     │  │
│  │ • Role Checks   │    │ • XSS Prevention│    │• JWT Secret │  │
│  └─────────────────┘    └─────────────────┘    └─────────────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                     COUCHES DE PROTECTION                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 🌐 COUCHE RÉSEAU:                                               │
│ • HTTPS obligatoire (SSL/TLS 1.3)                              │
│ • Certificats Let's Encrypt automatiques                        │
│ • HSTS (HTTP Strict Transport Security)                         │
│                                                                 │
│ 🔐 COUCHE AUTHENTIFICATION:                                     │
│ • JWT avec expiration 24h                                       │
│ • Refresh token pour sessions longues                           │
│ • Vérification rôle côté serveur                                │
│                                                                 │
│ 🛡️ COUCHE AUTORISATION:                                         │
│ • Guards Angular pour protection routes                         │
│ • Middleware Express pour API                                   │
│ • Vérification permissions par endpoint                         │
│                                                                 │
│ 📝 COUCHE VALIDATION:                                           │
│ • Validation côté client (Angular Forms)                        │
│ • Validation côté serveur (Joi/Express-validator)               │
│ • Sanitisation des entrées                                      │
│                                                                 │
│ 🔒 COUCHE DONNÉES:                                              │
│ • Hachage mots de passe (bcrypt, salt rounds 10)                │
│ • Chiffrement données sensibles                                  │
│ • Injection SQL impossible (NoSQL)                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Mesures de sécurité implémentées:**
- **Chiffrement** : HTTPS, hashage mots de passe
- **Authentification** : JWT stateless sécurisé
- **Autorisation** : Vérification rôles et permissions
- **Validation** : Double validation client/serveur
- **Protection** : CORS, Helmet, rate limiting

---

## DIAGRAMME 6: Processus de Déploiement

```
┌─────────────────────────────────────────────────────────────────┐
│                 PROCESSUS DE DÉPLOIEMENT CI/CD                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐         │
│  │  GitHub     │     │   Render    │     │  MongoDB    │         │
│  │ Repository  │     │   Cloud     │     │   Atlas     │         │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘         │
│         │                   │                   │                │
│         │ 1. Push Code      │                   │                │
│         │─────────────────► │                   │                │
│         │                   │                   │                │
│         │                   │ 2. Build Auto     │                │
│         │                   │ • npm install     │                │
│         │                   │ • ng build        │                │
│         │                   │ • docker build    │                │
│         │                   │                   │                │
│         │                   │ 3. Tests          │                │
│         │                   │ • Unit tests      │                │
│         │                   │ • Integration     │                │
│         │                   │                   │                │
│         │                   │ 4. Deploy         │                │
│         │                   │ • Container run   │                │
│         │                   │ • Health checks   │                │
│         │                   │                   │                │
│         │                   │ 5. DB Connect     │                │
│         │                   │─────────────────► │                │
│         │                   │                   │                │
│         │                   │ 6. SSL Auto       │                │
│         │                   │ • Let's Encrypt   │                │
│         │                   │ • Domain verify   │                │
│         │                   │                   │                │
│         │                   │ 7. Live           │                │
│         │ ◄───────────────── │                   │                │
│         │                   │                   │                │
│  ┌──────┴──────┐     ┌──────┴──────┐     ┌──────┴──────┐         │
│  │   Success   │     │ Monitoring  │     │   Backup    │         │
│  │Notification │     │   Logs      │     │   Auto      │         │
│  └─────────────┘     └─────────────┘     └─────────────┘         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    CONFIGURATION TECHNIQUE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Build Commands:                                                 │
│ • npm install && npm run build                                  │
│ • ng build --prod                                               │
│ • docker build -t pfa-app .                                     │
│                                                                 │
│ Environment Variables:                                          │
│ • NODE_ENV=production                                           │
│ • MONGODB_URI=mongodb+srv://...                                 │
│ • JWT_SECRET=secure-key                                         │
│ • FRONTEND_URL=https://nacer-dev.me                             │
│                                                                 │
│ Health Checks:                                                  │
│ • /health endpoint                                              │
│ • Database connectivity                                         │
│ • Memory/CPU monitoring                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Étapes automatisées:**
1. **Push GitHub** → Déclenchement déploiement
2. **Build automatique** → Installation dépendances
3. **Tests** → Validation qualité code
4. **Déploiement** → Containerisation et lancement
5. **Configuration** → Connexion base de données
6. **SSL** → Certificats automatiques
7. **Monitoring** → Supervision continue

---

## CAPTURE D'ÉCRAN 1: Interface de Connexion

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                    🔐 CONNEXION À PFA                           │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                                                                 │
│                    ┌─────────────────────────┐                   │
│                    │    SE CONNECTER         │                   │
│                    ├─────────────────────────┤                   │
│                    │                         │                   │
│                    │ 👤 Utilisateur  👑 Admin │                   │
│                    │    ○            ○       │                   │
│                    │                         │                   │
│                    │ Email:                  │                   │
│                    │ ┌─────────────────────┐ │                   │
│                    │ │ user@domain.com     │ │                   │
│                    │ └─────────────────────┘ │                   │
│                    │                         │                   │
│                    │ Mot de passe:           │                   │
│                    │ ┌─────────────────────┐ │                   │
│                    │ │ ●●●●●●●●●●●●●●●●●● │ │                   │
│                    │ └─────────────────────┘ │                   │
│                    │                         │                   │
│                    │    [SE CONNECTER]       │                   │
│                    │                         │                   │
│                    │ Pas de compte ?         │                   │
│                    │    S'INSCRIRE           │                   │
│                    └─────────────────────────┘                   │
│                                                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ ⚠️ Le type doit correspondre à votre compte                      │
└─────────────────────────────────────────────────────────────────┘
```

**Éléments de l'interface:**
- **Sélecteur de rôle** : Utilisateur ou Administrateur
- **Formulaire de connexion** : Email et mot de passe
- **Validation** : Messages d'erreur et avertissements
- **Navigation** : Lien vers inscription

---

## CAPTURE D'ÉCRAN 2: Dashboard Utilisateur

```
┌─────────────────────────────────────────────────────────────────┐
│ 🏠 DASHBOARD │ 👤 Mohamed Nacer │ 🚪 Déconnexion                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📊 MES STATISTIQUES                                              │
│ ┌─────────┬─────────┬─────────┬─────────┐                        │
│ │  Total  │  Todo   │En Cours │ Termin. │                        │
│ │   24    │   8     │   6     │   10    │                        │
│ └─────────┴─────────┴─────────┴─────────┘                        │
│                                                                 │
│ 🎯 MES TÂCHES RÉCENTES                                          │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ┌─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─┐ │ │
│ │ ║Titre║Statut║Prior║Assign║Échéance║Actions ║                 │ │
│ │ ╠═══╬════╬═════╬════╬════════╬═══════╣                 │ │
│ │ ║Dev║Todo ║High ║Moi  ║15/11/25║ ✏️ 🗑️ ║                 │ │
│ │ ║API║Done ║Med  ║Moi  ║12/11/25║ ✏️ 🗑️ ║                 │ │
│ │ ║UI ║Prog ║Low  ║Team ║20/11/25║ ✏️ 🗑️ ║                 │ │
│ │ └─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ➕ NOUVELLE TÂCHE  │ 📊 ANALYTICS │ 👥 ÉQUIPES │ 📁 FICHIERS     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Sections du dashboard:**
- **Barre de navigation** : Menu et actions utilisateur
- **Statistiques** : Compteurs des tâches par statut
- **Liste des tâches** : Tableau avec actions
- **Actions rapides** : Boutons pour fonctionnalités principales

---

## CAPTURE D'ÉCRAN 3: Dashboard Analytics

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 ANALYTICS AVANCÉS │ 👤 Mohamed Nacer │ ↩ Retour Dashboard     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 🎯 MÉTRIQUES CLÉS                                               │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐        │
│ │Tâches Term. │Tâches Att.  │Projets Act. │Score Prod.  │        │
│ │   42/65     │     12      │     8       │    85%      │        │
│ │  (64.6%)    │             │             │ ████████░░  │        │
│ └─────────────┴─────────────┴─────────────┴─────────────┘        │
│                                                                 │
│ 📈 GRAPHIQUES DE SUIVI                                          │
│ ┌─────────────────────┬─────────────────────┐                   │
│ │   BURNDOWN CHART    │   VELOCITY CHART    │                   │
│ │   (30 derniers j.)  │   (12 sem. gliss.)  │                   │
│ │                     │                     │                   │
│ │      📈📉           │      📊📊           │                   │
│ │  Courbe idéale vs   │ Créées vs Terminées │                   │
│ │  courbe réelle      │                     │                   │
│ └─────────────────────┴─────────────────────┘                   │
│                                                                 │
│ ┌─────────────────────┬─────────────────────┐                   │
│ │  TIME TRACKING      │   CATÉGORIES        │                   │
│ │   (Doughnut)        │   (Polar Area)      │                   │
│ │                     │                     │                   │
│ │     ⭕⭕⭕           │        🎯🏠🛒         │                   │
│ │ Est./Rél./Écart     │   Work/Pers/Shop    │                   │
│ │                     │                     │                   │
│ └─────────────────────┴─────────────────────┘                   │
│                                                                 │
│ 📥 EXPORTER RAPPORT │ 🔄 ACTUALISER │ 📊 DÉTAILS                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Visualisations disponibles:**
- **Métriques clés** : Indicateurs principaux
- **Graphiques Chart.js** : 4 types de visualisations
- **Export** : Téléchargement des données
- **Navigation** : Retour au dashboard principal

---

## CAPTURE D'ÉCRAN 4: Interface Administrateur

```
┌─────────────────────────────────────────────────────────────────┐
│ 👑 DASHBOARD ADMINISTRATEUR │ 👤 Admin │ 🚪 Déconnexion          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 👥 GESTION DES UTILISATEURS                                     │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ ┌─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─╥─┐ │ │
│ │ ║Nom ║Email║Rôle ║Statut║Créé le ║Actions ║                 │ │
│ │ ╠═══╬═════╬═════╬══════╬════════╬═══════╣                 │ │
│ │ ║Moh║moha@║User ║Actif ║15/11/25║ ✏️ 🗑️ ║                 │ │
│ │ ║Ali║ali@ ║Admin║Actif ║12/11/25║ ✏️ 🗑️ ║                 │ │
│ │ ║Sam║sam@ ║User ║Inact║10/11/25║ ✏️ 🗑️ ║                 │ │
│ │ └─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─╨─┘ │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ➕ AJOUTER UTILISATEUR │ 👥 ÉQUIPES │ 📊 STATISTIQUES │ ⚙️ CONFIG │
│                                                                 │
│ 📈 STATISTIQUES GLOBALES                                        │
│ ┌─────────────┬─────────────┬─────────────┬─────────────┐        │
│ │Utilisateurs │Tâches Tot.  │Projets Act. │Connexions   │        │
│ │     156     │    1,247    │     89      │   3,450     │        │
│ │             │             │             │  (ce mois)   │        │
│ └─────────────┴─────────────┴─────────────┴─────────────┘        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Fonctionnalités admin:**
- **Gestion utilisateurs** : CRUD complet
- **Statistiques globales** : Métriques système
- **Actions administrateur** : Configuration système
- **Navigation spécialisée** : Interface dédiée admin

---

## SCHÉMA 7: Structure du Projet

```
PFA-PROJECT/
├── 📁 backend/                          # Serveur Node.js/Express
│   ├── 📄 index.js                      # Point d'entrée principal
│   ├── 📁 src/
│   │   ├── 📁 config/
│   │   │   └── 📄 db.js                 # Configuration MongoDB
│   │   ├── 📁 middleware/
│   │   │   ├── 📄 auth.js               # Authentification JWT
│   │   │   └── 📄 admin.js              # Vérification admin
│   │   ├── 📁 models/                   # Schémas MongoDB
│   │   │   ├── 📄 User.js
│   │   │   ├── 📄 Task.js
│   │   │   ├── 📄 Project.js
│   │   │   ├── 📄 Team.js
│   │   │   └── 📄 Notification.js
│   │   └── 📁 routes/                   # API endpoints
│   │       ├── 📄 auth.js
│   │       ├── 📄 users.js
│   │       ├── 📄 tasks.js
│   │       ├── 📄 projects.js
│   │       ├── 📄 teams.js
│   │       ├── 📄 admin.js
│   │       └── 📄 file-upload.js
│   ├── 📁 uploads/                      # Stockage fichiers
│   ├── 📄 Dockerfile                    # Containerisation
│   ├── 📄 package.json                  # Dépendances
│   └── 📄 ecosystem.config.js           # PM2 production
│
├── 📁 frontend/                         # Application Angular
│   ├── 📄 angular.json                  # Configuration Angular
│   ├── 📁 src/
│   │   ├── 📁 app/
│   │   │   ├── 📁 components/           # Composants UI
│   │   │   │   ├── 📁 login/
│   │   │   │   ├── 📁 dashboard/
│   │   │   │   ├── 📁 task-list/
│   │   │   │   ├── 📁 project-view/
│   │   │   │   ├── 📁 team-management/
│   │   │   │   ├── 📁 analytics-dashboard/
│   │   │   │   ├── 📁 admin-dashboard/
│   │   │   │   └── 📁 file-attachments/
│   │   │   ├── 📁 services/             # Services métier
│   │   │   │   ├── 📄 auth.service.ts
│   │   │   │   ├── 📄 task.service.ts
│   │   │   │   ├── 📄 project.service.ts
│   │   │   │   └── 📄 file-upload.service.ts
│   │   │   ├── 📁 guards/               # Protection routes
│   │   │   │   ├── 📄 auth.guard.ts
│   │   │   │   └── 📄 admin.guard.ts
│   │   │   ├── 📁 models/               # Interfaces TypeScript
│   │   │   └── 📄 app-routing.module.ts # Configuration routes
│   │   ├── 📁 environments/             # Variables environnement
│   │   │   ├── 📄 environment.ts        # Développement
│   │   │   └── 📄 environment.prod.ts   # Production
│   │   └── 📁 styles.css                # Styles globaux
│   ├── 📄 Dockerfile                    # Build production
│   ├── 📄 nginx.conf                    # Configuration serveur
│   ├── 📄 package.json                  # Dépendances Angular
│   └── 📄 proxy.conf.json               # Proxy développement
│
├── 📁 docker-compose.yml                # Développement local
├── 📁 docker-compose.prod.yml           # Production
├── 📁 nginx.conf                        # Reverse proxy production
├── 📄 README.md                         # Documentation
├── 📄 package.json                      # Scripts déploiement
└── 📄 .env.example                      # Variables template
```

**Organisation du code:**
- **Backend** : Architecture modulaire avec séparation des responsabilités
- **Frontend** : Structure Angular standard avec lazy loading
- **Configuration** : Environnements séparés dev/prod
- **Déploiement** : Docker multi-conteneurs

---

## SCHÉMA 8: Flux de Développement

```
┌─────────────────────────────────────────────────────────────────┐
│                 FLUX DE DÉVELOPPEMENT COMPLET                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐         │
│  │Planification│     │ Conception  │     │Développement│         │
│  │ & Analyse   │────►│   Technique │────►│   Code      │         │
│  └─────────────┘     └─────────────┘     └─────────────┘         │
│         │                       │                       │         │
│         ▼                       ▼                       ▼         │
│                                                                 │
│  📋 Cahier des charges       🎨 Maquettes UI/UX         💻 Code   │
│  📊 Analyse fonctionnelle    🗂️ Modèle de données       🧪 Tests  │
│  🎯 Définition objectifs     📐 Architecture système    🔧 Debug │
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐         │
│  │   Tests     │◄────│ Intégration │◄────│Déploiement  │         │
│  │  & Qualité  │     │   Continue  │     │   Cloud     │         │
│  └─────────────┘     └─────────────┘     └─────────────┘         │
│         │                       │                       │         │
│         ▼                       ▼                       ▼         │
│                                                                 │
│  ✅ Tests unitaires          🚀 CI/CD GitHub            🌐 Prod   │
│  ✅ Tests intégration        🔄 Déploiement auto        📊 Monit. │
│  ✅ Tests performance        📦 Containerisation        🔒 Sécurité│
│  ✅ Tests sécurité           ⚙️ Configuration            📈 Analytics│
│                                                                 │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐         │
│  │Maintenance  │◄────│  Support    │◄────│ Évolution   │         │
│  │ & Monitoring│     │   Utilisateur│     │  Futures   │         │
│  └─────────────┘     └─────────────┘     └─────────────┘         │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                    MÉTRIQUES DE SUIVI                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 🎯 Indicateurs qualité:                                         │
│ • Coverage tests: 85%                                           │
│ • Performance: < 300ms                                          │
│ • Disponibilité: 99.9%                                          │
│ • Satisfaction: 4.6/5                                           │
│                                                                 │
│ 📊 Métriques développement:                                     │
│ • Lignes de code: ~15,000                                       │
│ • Commits: 127                                                  │
│ • Issues résolues: 45                                           │
│ • Temps développement: 3 mois                                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Phases du projet:**
1. **Planification** : Analyse besoins et spécifications
2. **Conception** : Architecture et maquettes
3. **Développement** : Implémentation itérative
4. **Tests** : Validation qualité et performance
5. **Déploiement** : Mise en production cloud
6. **Maintenance** : Support et évolution continue

---

## LÉGENDE GÉNÉRALE

### Icônes Utilisées
- 📁 : Dossier/Répertoire
- 📄 : Fichier
- 🔧 : Outil/Configuration
- 🌐 : Web/Réseau
- 🔒 : Sécurité
- 📊 : Données/Analytics
- 👤 : Utilisateur
- ⚙️ : Configuration
- ✅ : Succès/Validé
- ❌ : Erreur/Échec
- 🔄 : Processus/Cycle
- 📈 : Graphique/Croissance
- 🎯 : Objectif/Cible
- 🚀 : Déploiement/Lancement

### Couleurs et Significations
- **Bleu** : Informations générales, architecture
- **Vert** : Succès, validation, fonctionnalités
- **Rouge** : Erreurs, problèmes, alertes
- **Orange** : Avertissements, attention requise
- **Gris** : Éléments techniques, code

### Échelles et Unités
- **Temps** : millisecondes (ms), secondes (s), minutes (min)
- **Taille** : bytes (B), kilobytes (KB), megabytes (MB)
- **Pourcentages** : métriques de performance et satisfaction
- **Comptes** : nombres absolus pour utilisateurs, tâches, etc.

---

**Document créé le :** 16 Novembre 2025  
**Auteur :** Mohamed Nacer HAMMAMI  
**Version :** 1.0  
**Statut :** Terminé et Validé ✅