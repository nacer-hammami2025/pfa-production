// Production Environment Configuration
export const environment = {
  production: true,
  apiUrl: 'https://nacer-dev.me/api',
  wsUrl: 'wss://nacer-dev.me',
  
  // Feature Flags
  features: {
    analytics: true,
    notifications: true,
    aiSuggestions: true,
    voiceCommands: false, // Désactivé en production par défaut
    betaFeatures: false
  },
  
  // Analytics (remplacer avec vos IDs)
  googleAnalyticsId: 'UA-XXXXXXXXX-X',
  
  // Monitoring (optionnel - Sentry)
  sentryDsn: '', // 'https://xxx@xxx.ingest.sentry.io/xxx'
  
  // Cache Configuration
  cacheTimeout: 300000, // 5 minutes
  
  // API Configuration
  apiTimeout: 30000,
  maxRetries: 3,
  
  // Upload Configuration
  maxFileSize: 10485760, // 10MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  
  // Security
  enableSecurityHeaders: true,
  enableRateLimiting: true,
  
  // Performance
  enableServiceWorker: true,
  enableCompression: true,
  
  // Integrations (mettre à jour avec vos credentials)
  integrations: {
    google: {
      clientId: '310821257679-u275u71vsiuv2qv67sqq2s3q2pdlteun.apps.googleusercontent.com',
      redirectUri: 'https://nacer-dev.me/integrations/google-calendar/callback'
    },
    outlook: {
      clientId: 'your_outlook_client_id_here',
      redirectUri: 'https://nacer-dev.me/integrations/outlook/callback'
    },
    slack: {
      clientId: 'your_slack_client_id_here',
      redirectUri: 'https://nacer-dev.me/integrations/slack/callback'
    },
    trello: {
      apiKey: 'your_trello_api_key_here',
      redirectUri: 'https://nacer-dev.me/integrations/trello/callback'
    }
  }
};