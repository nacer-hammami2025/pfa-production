const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./src/models/User');
require('dotenv').config();

async function testAdminAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskflow');
    console.log('Connected to MongoDB');

    // Get admin user
    const adminUser = await User.findOne({ email: 'admin@taskflow.com' });
    if (!adminUser) {
      console.log('Admin user not found');
      return;
    }

    console.log('Admin user found:', adminUser.name, adminUser.role);

    // Generate JWT token
    const payload = {
      user: {
        id: adminUser.id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('Generated token:', token.substring(0, 50) + '...');

    // Test the API by making a request
    const http = require('http');

    const options = {
      hostname: 'localhost',
      port: 5001,
      path: '/api/admin/dashboard-summary',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    console.log('Making request to:', `http://${options.hostname}:${options.port}${options.path}`);

    const req = http.request(options, (res) => {
      console.log('Response status:', res.statusCode);
      console.log('Response headers:', res.headers);

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('Response data:', data);
      });
    });

    req.on('error', (err) => {
      console.error('Request error:', err.message);
    });

    req.end();

  } catch (err) {
    console.error('Error:', err);
  }
}

testAdminAPI();