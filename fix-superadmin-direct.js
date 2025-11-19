// Script to directly fix the superadmin account in MongoDB
const mongoose = require('./backend/node_modules/mongoose');
const bcrypt = require('./backend/node_modules/bcryptjs');
const User = require('./backend/src/models/User');

async function fixSuperAdminDirectly() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/taskflow-pro');
    console.log('✅ Connected to MongoDB');

    // Check if superadmin account exists
    const existingAdmin = await User.findOne({ email: 'superadmin@taskflow.com' });

    if (existingAdmin) {
      console.log('📋 Found existing superadmin account:');
      console.log('- Name:', existingAdmin.name);
      console.log('- Email:', existingAdmin.email);
      console.log('- Role:', existingAdmin.role);
      console.log('- Created:', existingAdmin.createdAt);

      if (existingAdmin.role !== 'admin') {
        console.log('❌ CRITICAL: Account has WRONG role! Fixing...');

        existingAdmin.role = 'admin';
        await existingAdmin.save();

        console.log('✅ Role fixed to admin');

        // Verify the fix
        const fixedAdmin = await User.findOne({ email: 'superadmin@taskflow.com' });
        console.log('🔐 Verification:');
        console.log('- Email:', fixedAdmin.email);
        console.log('- Role:', fixedAdmin.role);
        console.log('- Is Admin:', fixedAdmin.role === 'admin' ? '✅ YES' : '❌ NO');

      } else {
        console.log('✅ Account already has correct admin role');
      }

    } else {
      console.log('❌ Superadmin account not found. Creating it...');

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      const superAdmin = new User({
        name: 'Super Admin',
        email: 'superadmin@taskflow.com',
        password: hashedPassword,
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
        mfaEnabled: false,
        mfaSecret: '',
        mfaTempSecret: '',
        avatar: '',
        photoUrl: '',
        phone: '',
        bio: ''
      });

      await superAdmin.save();
      console.log('✅ Superadmin account created successfully');
      console.log('📧 Email: superadmin@taskflow.com');
      console.log('🔑 Password: admin123');
      console.log('👑 Role: admin');
    }

    console.log('\n🎉 SUPERADMIN ACCOUNT SECURED!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixSuperAdminDirectly();