const mongoose = require('mongoose');
const TeamCreationRequest = require('./models/TeamCreationRequest');
const PersistentNotification = require('./models/PersistentNotification');
const User = require('./models/User');

async function testTeamCreationRequestSystem() {
  try {
    console.log('🔄 Test du système de demandes de création d\'équipe...\n');

    // Connexion à la base de données
    await mongoose.connect('mongodb://localhost:27017/pfa', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connexion MongoDB réussie');

    // Créer un utilisateur test
    const testUser = new User({
      username: 'testuser_team',
      email: 'testuser_team@example.com',
      password: 'hashedpassword',
      role: 'user'
    });
    await testUser.save();
    console.log('✅ Utilisateur test créé');

    // Créer un admin test
    const testAdmin = new User({
      username: 'testadmin_team',
      email: 'testadmin_team@example.com',
      password: 'hashedpassword',
      role: 'admin'
    });
    await testAdmin.save();
    console.log('✅ Admin test créé');

    // Tester la création d'une demande d'équipe
    const request = new TeamCreationRequest({
      requester: testUser._id,
      teamName: 'Test Team Professional',
      teamDescription: 'Une équipe de test professionnelle',
      status: 'pending'
    });
    await request.save();
    console.log('✅ Demande de création d\'équipe créée');

    // Tester la création d'une notification pour l'admin
    const adminNotification = new PersistentNotification({
      user: testAdmin._id,
      type: 'info',
      title: 'Nouvelle demande de création d\'équipe',
      message: `${testUser.username} souhaite créer l'équipe "Test Team Professional"`,
      category: 'admin',
      priority: 'high',
      action: {
        label: 'Voir la demande',
        callback: '/admin/team-requests'
      },
      persistent: true,
      read: false
    });
    await adminNotification.save();
    console.log('✅ Notification admin créée');

    // Tester l'approbation de la demande
    request.status = 'approved';
    request.reviewedBy = testAdmin._id;
    request.reviewComment = 'Demande approuvée automatiquement pour le test';
    request.reviewedAt = new Date();
    await request.save();
    console.log('✅ Demande approuvée');

    // Créer une notification pour l'utilisateur
    const userNotification = new PersistentNotification({
      user: testUser._id,
      type: 'success',
      title: 'Demande d\'équipe approuvée',
      message: 'Votre demande de création d\'équipe "Test Team Professional" a été approuvée. L\'équipe a été créée avec succès !',
      category: 'admin',
      priority: 'high',
      persistent: true,
      read: false
    });
    await userNotification.save();
    console.log('✅ Notification utilisateur créée');

    // Vérifier les données
    const userRequests = await TeamCreationRequest.find({ requester: testUser._id });
    const adminNotifications = await PersistentNotification.find({ user: testAdmin._id });
    const userNotifications = await PersistentNotification.find({ user: testUser._id });

    console.log(`\n📊 Statistiques:`);
    console.log(`   - Demandes utilisateur: ${userRequests.length}`);
    console.log(`   - Notifications admin: ${adminNotifications.length}`);
    console.log(`   - Notifications utilisateur: ${userNotifications.length}`);

    // Nettoyer
    await TeamCreationRequest.deleteMany({ requester: testUser._id });
    await PersistentNotification.deleteMany({ user: { $in: [testUser._id, testAdmin._id] } });
    await User.deleteMany({ username: { $in: ['testuser_team', 'testadmin_team'] } });

    console.log('\n🧹 Nettoyage terminé');
    console.log('\n🎉 Test du système de demandes d\'équipe réussi !');

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    process.exit(1);
  }
}

// Lancer le test
testTeamCreationRequestSystem();