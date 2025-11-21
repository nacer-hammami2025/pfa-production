const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

async function createProdAdmin() {
  try {
    // Use production MongoDB URI from environment
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI environment variable not set!');
      process.exit(1);
    }
    
    console.log('Connecting to production MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to production MongoDB');

    // Check existing users
    const existingUsers = await User.find({}, 'name email role');
    console.log('Existing users in production:');
    existingUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}): ${user.role}`);
    });

    // Create admin user if doesn't exist
    const adminEmail = 'admin@taskflow.com';
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      console.log('Creating admin user in production...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'CHANGE_THIS_PASSWORD_IN_PRODUCTION', salt);

      adminUser = new User({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully in production!');
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: [SET IN ADMIN_PASSWORD ENV VAR]`);
    } else {
      console.log('Admin user already exists in production');
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        await adminUser.save();
        console.log('✅ User role updated to admin');
      }
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createProdAdmin();