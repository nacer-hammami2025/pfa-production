const https = require('https');

const userData = {
  name: 'Super Admin',
  email: 'superadmin@taskflow.com',
  password: 'SuperAdmin123!',
  role: 'admin'
};

const postData = JSON.stringify(userData);

const options = {
  hostname: 'pfa-production.onrender.com',
  port: 443,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': postData.length
  }
};

console.log('Creating admin user via API...');
console.log('URL:', `https://${options.hostname}${options.path}`);
console.log('Data:', userData);

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response body:', data);
    if (res.statusCode === 201) {
      console.log('✅ Admin user created successfully!');
      console.log('Email: admin@taskflow.com');
      console.log('Password: admin123');
    } else {
      console.log('❌ Failed to create admin user');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.write(postData);
req.end();