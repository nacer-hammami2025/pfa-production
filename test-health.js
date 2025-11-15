const https = require('https');

// Test de l'endpoint health pour voir les détails de la DB
const options = {
  hostname: 'pfa-production.onrender.com',
  port: 443,
  path: '/api/health',
  method: 'GET'
};

console.log('Testing health endpoint...');

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const health = JSON.parse(data);
      console.log('Health Response:');
      console.log(JSON.stringify(health, null, 2));
      
      if (health.database) {
        console.log('\n🔍 Database Status Analysis:');
        console.log(`Connected: ${health.database.connected}`);
        console.log(`Ready State: ${health.database.readyState}`);
        console.log(`Database Name: ${health.database.name}`);
        console.log(`MongoDB URI: ${health.mongoUri}`);
      }
    } catch (error) {
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.end();