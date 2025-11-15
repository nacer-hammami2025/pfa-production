export const environment = {
  production: false,
  integrations: {
    google: {
      clientId: '310821257679-u275u71vsiuv2qv67sqq2s3q2pdlteun.apps.googleusercontent.com',
      redirectUri: 'http://localhost:4200/integrations/google-calendar/callback'
    },
    outlook: {
      clientId: 'your_outlook_client_id_here',
      redirectUri: 'http://localhost:4200/integrations/outlook/callback'
    },
    slack: {
      clientId: 'your_slack_client_id_here',
      redirectUri: 'http://localhost:4200/integrations/slack/callback'
    },
    trello: {
      apiKey: 'your_trello_api_key_here',
      redirectUri: 'http://localhost:4200/integrations/trello/callback'
    }
  }
};