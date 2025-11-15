const http = require('http');

const options = {
  hostname: 'localhost',
  port: 4200,
  path: '/api/admin/dashboard-summary',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer test',
    'Content-Type': 'application/json'
  }
};

console.log('Testing proxy: making request to', `http://${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
  console.log('Response status:', res.statusCode);
  console.log('Response headers:', JSON.stringify(res.headers, null, 2));

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

req.setTimeout(5000, () => {
  console.log('Request timed out');
  req.destroy();
});

req.end();