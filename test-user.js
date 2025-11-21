const mongoose = require('./backend/node_modules/mongoose');
const User = require('./backend/src/models/User');

async function test() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow');
    console.log('Connected');
    const users = await User.find({});
    console.log('Users:', users.length);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

test();