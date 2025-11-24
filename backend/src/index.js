process.on('exit', (code) => {
  console.log(`Process exited with code: ${code}`);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

require('dotenv').config({ path: './.env' });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { metricsMiddleware, metricsHandler } = require('./middleware/metrics');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect DB (with error handling for testing)
console.log('[INDEX] About to connect to database...');
connectDB().catch(err => {
  console.error('DB connection failed:', err.message);
  console.log('[INDEX] Continuing without database for testing purposes...');
});
console.log('[INDEX] Database connection initiated');

// CORS Configuration
console.log('[INDEX] Setting up CORS...');

// Fonction pour obtenir l'IP locale
function getLocalIP() {
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // Ignorer les adresses non-IPv4 et les adresses internes
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return 'localhost';
}

const localIP = getLocalIP();
console.log(`[INDEX] IP locale détectée: ${localIP}`);

const corsOptions = {
  origin: [
    'http://localhost:4200', 
    'http://localhost:3000', 
    'http://127.0.0.1:4200', 
    'http://127.0.0.1:3000',
    `http://${localIP}:4200`,
    `http://${localIP}:3000`,
    'https://nacer-dev.me',
    'https://www.nacer-dev.me',
    process.env.FRONTEND_URL,
    process.env.ALLOWED_ORIGINS?.split(',') || []
  ].flat().filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
// Handle preflight requests
app.options('*', cors(corsOptions));
app.use(express.json());

// Prometheus metrics middleware
app.use(metricsMiddleware);
console.log('[INDEX] Middleware configured');

// Health check endpoint
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = {
    connected: mongoose.connection.readyState === 1,
    readyState: mongoose.connection.readyState,
    name: mongoose.connection.name || 'Not connected'
  };
  
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: PORT,
    database: dbStatus,
    mongoUri: process.env.MONGODB_URI ? 'MONGODB_URI Set' : 'MONGODB_URI NOT SET',
    mongoUriLegacy: process.env.MONGO_URI ? 'MONGO_URI Set' : 'MONGO_URI NOT SET'
  });
});

// Prometheus metrics endpoint
app.get('/api/metrics', metricsHandler);try {
  const persistentNotificationsRoute = require('../routes/persistent-notifications');
  console.log('[INDEX] Persistent notifications route loaded successfully');
  app.use('/api/notifications', persistentNotificationsRoute);
  console.log('[INDEX] Persistent notifications route registered');
} catch (err) {
  console.error('[INDEX] Error loading persistent notifications route:', err.message);
  console.error('[INDEX] Full error:', err);
}
console.log('[INDEX] About to load auth routes...');
try {
  const authRoute = require('./routes/auth');
  console.log('[INDEX] Auth route loaded successfully');
  app.use('/api/auth', authRoute);
  console.log('[INDEX] Auth route registered');
} catch (err) {
  console.error('[INDEX] Error loading auth route:', err.message);
  console.error('[INDEX] Full error:', err);
}
try {
  const adminRoute = require('./routes/admin');
  console.log('[INDEX] Admin route loaded successfully');
  app.use('/api/admin', adminRoute);
  console.log('[INDEX] Admin route registered');
} catch (err) {
  console.error('[INDEX] Error loading admin route:', err.message);
  console.error('[INDEX] Full error:', err);
}
try {
  const tasksRoute = require('./routes/tasks');
  console.log('[INDEX] Tasks route loaded successfully');
  app.use('/api/tasks', tasksRoute);
  console.log('[INDEX] Tasks route registered');
} catch (err) {
  console.error('[INDEX] Error loading tasks route:', err.message);
  console.error('[INDEX] Full error:', err);
}
try {
  const projectsRoute = require('./routes/projects');
  console.log('[INDEX] Projects route loaded successfully');
  app.use('/api/projects', projectsRoute);
  console.log('[INDEX] Projects route registered');
} catch (err) {
  console.error('[INDEX] Error loading projects route:', err.message);
  console.error('[INDEX] Full error:', err);
}
try {
  const fileUploadRoute = require('./routes/file-upload');
  console.log('[INDEX] File upload route loaded successfully');
  app.use('/api/files', fileUploadRoute);
  console.log('[INDEX] File upload route registered');
} catch (err) {
  console.error('[INDEX] Error loading file upload route:', err.message);
  console.error('[INDEX] Full error:', err);
}
try {
  const usersRoute = require('./routes/users');
  console.log('[INDEX] Users route loaded successfully');
  app.use('/api/users', usersRoute);
  console.log('[INDEX] Users route registered');
} catch (err) {
  console.error('[INDEX] Error loading users route:', err.message);
  console.error('[INDEX] Full error:', err);
}
try {
  const teamCreationRequestsRoute = require('./routes/team-creation-requests');
  console.log('[INDEX] Team creation requests route loaded successfully');
  app.use('/api/team-creation-requests', teamCreationRequestsRoute);
  console.log('[INDEX] Team creation requests route registered');
} catch (err) {
  console.error('[INDEX] Error loading team creation requests route:', err.message);
  console.error('[INDEX] Full error:', err);
}
try {
  const persistentNotificationsRoute = require('../routes/persistent-notifications');
  console.log('[INDEX] Persistent notifications route loaded successfully');
  app.use('/api/notifications', persistentNotificationsRoute);
  console.log('[INDEX] Persistent notifications route registered');
} catch (err) {
  console.error('[INDEX] Error loading persistent notifications route:', err.message);
  console.error('[INDEX] Full error:', err);
}
try {
  const teamsRoute = require('./routes/teams');
  console.log('[INDEX] Teams route loaded successfully');
  app.use('/api/teams', teamsRoute);
  console.log('[INDEX] Teams route registered');
} catch (err) {
  console.error('[INDEX] Error loading teams route:', err.message);
  console.error('[INDEX] Full error:', err);
}

// Serve uploaded files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve Angular frontend (Production mode)
if (process.env.NODE_ENV === 'production') {
  // Serve static files from Angular build
  app.use(express.static(path.join(__dirname, '../../frontend/dist/production')));
  
  // Handle Angular routing (SPA)
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, '../../frontend/dist/production/index.html'));
  });
} else {
  // Development routes
  app.get('/test', (req, res) => {
    res.json({ message: 'Server is working' });
  });
  
  app.get('/', (req, res) => res.send('PFA Backend API running'));
}

console.log('About to start listening...');
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('✅ Server started successfully!');
  console.log(`📡 Listening on:`);
  console.log(`   - Local:   http://localhost:${PORT}`);
  console.log(`   - Network: http://${localIP}:${PORT}`);
  console.log('='.repeat(60));
});

server.on('error', (err) => {
  console.error('Server error:', err);
});

server.on('close', () => {
  console.log('Server closed normally');
});

// Keep server running in all environments for testing
process.on('SIGTERM', () => {
  console.log('SIGTERM received - server will continue running for testing');
});

process.on('SIGINT', () => {
  console.log('SIGINT received - server will continue running for testing');
});
