// SCRIPT POUR GÉNÉRER COMMANDES MONGODB POUR SUPERADMIN
const bcrypt = require('./backend/node_modules/bcryptjs');

async function genererCommandesSuperAdmin() {
  console.log('🔐 GÉNÉRATION COMMANDES MONGODB POUR SUPERADMIN PRODUCTION');
  console.log('=========================================================\n');
  
  const password = 'admin123';
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  console.log('📋 OPTION 1: CRÉER NOUVEAU SUPERADMIN');
  console.log('====================================\n');
  
  const createSuperAdminCommand = `db.users.insertOne({
  name: 'Super Admin',
  email: 'superadmin@taskflow.com',
  password: '${hashedPassword}',
  avatar: '',
  photoUrl: '',
  phone: '',
  bio: '',
  mfaEnabled: false,
  mfaSecret: '',
  mfaTempSecret: '',
  role: 'admin',
  preferences: {
    theme: 'light',
    notifications: {
      email: true,
      push: true,
      reminders: true,
      taskDue: true,
      teamActivity: true,
      achievements: true
    },
    timezone: 'UTC',
    language: 'en'
  },
  stats: {
    tasksCompleted: 0,
    totalTasks: 0,
    streakDays: 0,
    level: 1,
    experience: 0
  },
  lastLogin: new Date(),
  createdAt: new Date()
});`;

  console.log(createSuperAdminCommand);
  
  console.log('\n📋 OPTION 2: ÉLEVER admin@taskflow.com EN ADMIN (PLUS RAPIDE)');
  console.log('============================================================\n');
  console.log('db.users.updateOne(');
  console.log('  { email: "admin@taskflow.com" },');
  console.log('  { $set: { role: "admin" } }');
  console.log(');');
  
  console.log('\n📋 OPTION 3: VÉRIFIER LE RÉSULTAT');
  console.log('================================\n');
  console.log('db.users.find({ $or: [');
  console.log('  { email: "superadmin@taskflow.com" },');
  console.log('  { email: "admin@taskflow.com" }');
  console.log('] }, { name: 1, email: 1, role: 1 });');
  
  console.log('\n🎯 INSTRUCTIONS:');
  console.log('================');
  console.log('1. Connectez-vous à votre serveur de production');
  console.log('2. Accédez à MongoDB (via mongo shell, MongoDB Compass, ou interface web)');
  console.log('3. Sélectionnez la base "taskflow-pro" ou celle utilisée par votre app');
  console.log('4. Exécutez UNE des options ci-dessus');
  console.log('5. Testez sur https://nacer-dev.me/login');
  console.log('\n   - OPTION 1: superadmin@taskflow.com / admin123');
  console.log('   - OPTION 2: admin@taskflow.com / admin123 (maintenant avec droits admin)');
}

genererCommandesSuperAdmin();