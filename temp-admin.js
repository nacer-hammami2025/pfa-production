const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

async function createAdmin() {
  try {
    await mongoose.connect('mongodb://localhost:27017/taskflow');
    console.log('Connected to MongoDB');

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
      console.log('✅ Admin user created!');
      console.log('Email: admin@taskflow.com');
      console.log('Password: admin123');
    } else {
      console.log('Admin user already exists');
      if (adminUser.role !== 'admin') {
        adminUser.role = 'admin';
        await adminUser.save();
        console.log('✅ User role updated to admin');
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createAdmin();