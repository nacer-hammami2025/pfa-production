const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

async function fixSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/taskflow-pro');

    console.log('🔍 Checking superadmin account...');

    // Find the superadmin account
    const superAdmin = await User.findOne({ email: 'superadmin@taskflow.com' });

    if (!superAdmin) {
      console.log('❌ Superadmin account not found. Creating it...');

      // Create superadmin account
      const superAdmin = new User({
        name: 'Super Admin',
        email: 'superadmin@taskflow.com',
        password: '$2a$10$hashedpassword', // This will be hashed properly
        role: 'admin'
      });

      // Hash password properly
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      superAdmin.password = await bcrypt.hash('admin123', salt);

      await superAdmin.save();
      console.log('✅ Superadmin account created successfully');
      console.log('📧 Email: superadmin@taskflow.com');
      console.log('🔑 Password: admin123');
      console.log('👑 Role: admin');

    } else {
      console.log('📋 Current superadmin account:');
      console.log('- Name:', superAdmin.name);
      console.log('- Email:', superAdmin.email);
      console.log('- Role:', superAdmin.role);
      console.log('- Created:', superAdmin.createdAt);

      if (superAdmin.role !== 'admin') {
        console.log('❌ Role is incorrect! Fixing...');
        superAdmin.role = 'admin';
        await superAdmin.save();
        console.log('✅ Role fixed to admin');
      } else {
        console.log('✅ Role is already correct');
      }
    }

    // Verify the fix
    const verifiedAdmin = await User.findOne({ email: 'superadmin@taskflow.com' });
    console.log('\n🔐 Verification:');
    console.log('- Email:', verifiedAdmin.email);
    console.log('- Role:', verifiedAdmin.role);
    console.log('- Is Admin:', verifiedAdmin.role === 'admin' ? '✅ YES' : '❌ NO');

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixSuperAdmin();