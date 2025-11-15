const mongoose = require('mongoose');
const User = require('./src/models/User');

async function checkAndUpdateUsers() {
  try {
    await mongoose.connect('mongodb://localhost:27017/taskflow');
    console.log('Connected to MongoDB');

    const users = await User.find({}, 'name email role');
    console.log('Users in database:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}): ${user.role}`);
    });

    if (users.length > 0) {
      // Make the first user an admin
      const firstUser = users[0];
      if (firstUser.role !== 'admin') {
        await User.findByIdAndUpdate(firstUser._id, { role: 'admin' });
        console.log(`✅ Made ${firstUser.email} an admin!`);
      } else {
        console.log(`User ${firstUser.email} is already an admin`);
      }
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAndUpdateUsers();