const mongoose = require('./backend/node_modules/mongoose');
const User = require('./backend/src/models/User');

async function test() {
  try {
    await mongoose.connect('mongodb+srv://mohamednacerhammami:J6Xi7CEiuJMKYyN@devdashcluster.ivyoi9j.mongodb.net/devdash?retryWrites=true&w=majority&appName=DevDashCluster');
    console.log('Connected');
    const users = await User.find({});
    console.log('Users:', users.length);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

test();