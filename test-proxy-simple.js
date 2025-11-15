const http = require('http');

console.log('Testing proxy configuration...');

const req = http.get('http://localhost:4200/api/admin/dashboard-summary', {
  headers: {
    'Authorization': 'Bearer test'
  },
  timeout: 5000
}, (res) => {
  console.log('✅ Proxy working! Status:', res.statusCode);
  console.log('Response headers:', res.headers);

  res.on('data', (chunk) => {
    console.log('Response data:', chunk.toString());
  });

  res.on('end', () => {
    console.log('Request completed');
  });
});

req.on('error', (err) => {
  console.error('❌ Proxy error:', err.message);
});

req.on('timeout', () => {
  console.error('❌ Request timeout');
  req.destroy();
});