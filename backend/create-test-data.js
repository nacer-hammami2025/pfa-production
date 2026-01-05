// Script pour créer des données de test et générer des métriques
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./src/models/User');
const Task = require('./src/models/Task');
const Team = require('./models/Team');

async function createTestData() {
  try {
    console.log('🔌 Connexion à MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');

    // Créer des utilisateurs de test
    console.log('\n👥 Création des utilisateurs...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);

    const users = [];
    for (let i = 1; i <= 3; i++) {
      const user = await User.findOneAndUpdate(
        { email: `user${i}@test.com` },
        {
          name: `Test User ${i}`,
          email: `user${i}@test.com`,
          password: hashedPassword,
          role: 'user'
        },
        { upsert: true, new: true }
      );
      users.push(user);
      console.log(`✅ Utilisateur créé: ${user.email}`);
    }

    // Créer des tâches
    console.log('\n📋 Création des tâches...');
    const taskStatuses = ['TODO', 'IN_PROGRESS', 'DONE'];
    const priorities = ['low', 'medium', 'high'];
    
    for (const user of users) {
      for (let i = 0; i < 5; i++) {
        const task = await Task.create({
          title: `Tâche ${i + 1} de ${user.name}`,
          description: `Description de la tâche ${i + 1}`,
          owner: user._id,
          status: taskStatuses[i % 3],
          priority: priorities[i % 3],
          completed: i % 3 === 2,
          category: 'work'
        });
        console.log(`✅ Tâche créée: ${task.title} (${task.status})`);
      }
    }

    // Créer des équipes
    console.log('\n👨‍💼 Création des équipes...');
    try {
      const team1 = await Team.create({
        name: 'Équipe Développement',
        description: 'Équipe de développement logiciel',
        members: [{ user: users[0]._id, role: 'admin' }],
        isActive: true
      });
      console.log(`✅ Équipe créée: ${team1.name}`);

      const team2 = await Team.create({
        name: 'Équipe Marketing',
        description: 'Équipe marketing et communication',
        members: [{ user: users[1]._id, role: 'member' }],
        isActive: true
      });
      console.log(`✅ Équipe créée: ${team2.name}`);
    } catch (err) {
      console.log('⚠️  Équipes (modèle peut-être non disponible):', err.message);
    }

    // Statistiques finales
    console.log('\n📊 Statistiques:');
    const totalUsers = await User.countDocuments();
    const totalTasks = await Task.countDocuments();
    const todoTasks = await Task.countDocuments({ status: 'TODO' });
    const inProgressTasks = await Task.countDocuments({ status: 'IN_PROGRESS' });
    const doneTasks = await Task.countDocuments({ status: 'DONE' });

    console.log(`👥 Utilisateurs: ${totalUsers}`);
    console.log(`📋 Tâches totales: ${totalTasks}`);
    console.log(`   - TODO: ${todoTasks}`);
    console.log(`   - IN_PROGRESS: ${inProgressTasks}`);
    console.log(`   - DONE: ${doneTasks}`);

    try {
      const totalTeams = await Team.countDocuments();
      console.log(`👨‍💼 Équipes: ${totalTeams}`);
    } catch (err) {
      console.log(`👨‍💼 Équipes: N/A`);
    }

    console.log('\n✅ Données de test créées avec succès!');
    console.log('🔄 Les métriques seront mises à jour dans les 30 secondes');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n👋 Déconnecté de MongoDB');
  }
}

createTestData();
