const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
require('dotenv').config();

async function setupDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskflow');
    console.log('✅ Connected to MongoDB');

    // Drop the users collection if it exists
    console.log('Dropping users collection...');
    try {
      await User.collection.drop();
      console.log('✅ Users collection dropped');
    } catch (err) {
      console.log('Collection does not exist, creating new one...');
    }

    // Create indexes fresh
    console.log('Creating new indexes...');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    console.log('✅ Indexes created');

    // Create admin user
    console.log('Creating admin user...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@taskflow.com',
      password: hashedPassword,
      role: 'admin'
    });

    await adminUser.save();
    console.log('✅ Admin user created');
    console.log('  Email: admin@taskflow.com');
    console.log('  Password: admin123');

    // Create test user
    console.log('\nCreating test user...');
    const testUser = new User({
      name: 'Test User',
      email: 'user@taskflow.com',
      password: await bcrypt.hash('user123', salt),
      role: 'user'
    });

    await testUser.save();
    console.log('✅ Test user created');
    console.log('  Email: user@taskflow.com');
    console.log('  Password: user123');

    await mongoose.disconnect();
    console.log('\n✅ Database setup complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupDatabase();