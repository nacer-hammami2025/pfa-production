const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
require('dotenv').config();

async function createAdminUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskflow');
    console.log('Connected to MongoDB');

    // Check existing users
    const existingUsers = await User.find({}, 'name email role');
    console.log('Existing users:');
    existingUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email}): ${user.role}`);
    });

    // Create admin user if doesn't exist
    const adminEmail = 'admin@taskflow.com';
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      console.log('Creating admin user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);

      adminUser = new User({
        name: 'Admin User',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log(`Email: ${adminEmail}`);
      console.log(`Password: admin123`);
    } else {
      console.log('Admin user already exists');
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        await adminUser.save();
        console.log('✅ User role updated to admin');
      }
    }

    // Update first user to admin if no admin exists
    if (existingUsers.length > 0 && !existingUsers.some(u => u.role === 'admin')) {
      const firstUser = existingUsers[0];
      console.log(`Making first user (${firstUser.email}) an admin...`);
      await User.findByIdAndUpdate(firstUser._id, { role: 'admin' });
      console.log('✅ First user updated to admin role');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminUser();