// PM2 Ecosystem Configuration
// Gestion des processus Node.js en production

module.exports = {
  apps: [
    {
      name: 'pfa-backend',
      script: './backend/src/index.js',
      cwd: './backend',
      instances: 2, // Utiliser 2 instances pour load balancing
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      env_file: './backend/.env.production',
      
      // Auto-restart configuration
      watch: false, // Désactiver en production
      max_memory_restart: '500M',
      
      // Logging
      error_file: '/var/log/pfa/backend-error.log',
      out_file: '/var/log/pfa/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Advanced settings
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      
      // Monitoring
      autorestart: true,
      cron_restart: '0 3 * * *', // Redémarrage quotidien à 3h du matin
      
      // Source map support
      source_map_support: true,
      
      // Ignore watch (si watch activé)
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      
      // Environment-specific settings
      env_production: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 5002
      }
    }
  ],
  
  // Deployment configuration
  deploy: {
    production: {
      user: 'deploy',
      host: 'nacer-dev.me',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/pfa.git',
      path: '/var/www/pfa',
      'post-deploy': 'cd backend && npm install && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': ''
    }
  }
};
