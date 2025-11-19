import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { IntegrationsService, Integrations, Integration } from '../../services/integrations.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-integrations',
  templateUrl: './integrations.component.html',
  styleUrls: ['./integrations.component.css']
})
export class IntegrationsComponent implements OnInit, OnDestroy {
  integrations: Integrations = {};
  isLoading = false;
  private subscriptions: Subscription[] = [];

  // Available integrations
  availableIntegrations = [
    {
      id: 'googleCalendar',
      name: 'Google Calendar',
      description: 'Synchronisez vos tâches avec Google Calendar pour une meilleure organisation',
      icon: '📅',
      features: ['Sync automatique des tâches', 'Rappels intégrés', 'Gestion du temps'],
      color: '#4285F4'
    },
    {
      id: 'outlook',
      name: 'Microsoft Outlook',
      description: 'Intégrez vos tâches avec Outlook Calendar',
      icon: '📧',
      features: ['Synchronisation bidirectionnelle', 'Rappels Outlook', 'Intégration Office 365'],
      color: '#0078D4'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Recevez des notifications de tâches directement dans Slack',
      icon: '💬',
      features: ['Notifications temps réel', 'Messages personnalisés', 'Intégration équipe'],
      color: '#4A154B'
    },
    {
      id: 'trello',
      name: 'Trello',
      description: 'Synchronisez vos tâches avec des tableaux Trello',
      icon: '📋',
      features: ['Tableaux visuels', 'Collaboration d\'équipe', 'Gestion de projet'],
      color: '#0079BF'
    }
  ];

  constructor(
    private integrationsService: IntegrationsService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadIntegrations();

    // Handle OAuth callbacks
    this.subscriptions.push(
      this.route.queryParams.subscribe(params => {
        const code = params['code'];
        const token = params['token']; // For Trello
        const state = params['state'];

        if ((code || token) && state) {
          this.handleOAuthCallback(state, code || token);
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadIntegrations(): void {
    this.isLoading = true;
    this.subscriptions.push(
      this.integrationsService.integrations$.subscribe(integrations => {
        this.integrations = integrations;
        this.isLoading = false;
      })
    );
  }

  connectIntegration(integrationId: string): void {
    switch (integrationId) {
      case 'googleCalendar':
        this.connectGoogleCalendar();
        break;
      case 'outlook':
        this.connectOutlook();
        break;
      case 'slack':
        this.connectSlack();
        break;
      case 'trello':
        this.connectTrello();
        break;
    }
  }

  private connectGoogleCalendar(): void {
    const authUrl = this.integrationsService.getGoogleCalendarAuthUrl();
    window.location.href = authUrl;
  }

  private connectOutlook(): void {
    const authUrl = this.integrationsService.getOutlookAuthUrl();
    window.location.href = authUrl;
  }

  private connectSlack(): void {
    const authUrl = this.integrationsService.getSlackAuthUrl();
    window.location.href = authUrl;
  }

  private connectTrello(): void {
    const authUrl = this.integrationsService.getTrelloAuthUrl();
    window.open(authUrl, '_blank');
  }

  disconnectIntegration(integrationId: string): void {
    if (confirm(`Êtes-vous sûr de vouloir déconnecter ${this.getIntegrationDisplayName(integrationId)} ?`)) {
      this.integrationsService.disconnect(integrationId).subscribe(
        () => {
          console.log(`${integrationId} disconnected successfully`);
        },
        error => {
          console.error(`Error disconnecting ${integrationId}:`, error);
        }
      );
    }
  }

  syncIntegration(integrationId: string): void {
    this.isLoading = true;

    let syncObservable;
    switch (integrationId) {
      case 'googleCalendar':
        syncObservable = this.integrationsService.syncToGoogleCalendar();
        break;
      case 'trello':
        syncObservable = this.integrationsService.syncToTrello();
        break;
      default:
        this.isLoading = false;
        return;
    }

    syncObservable.subscribe(
      response => {
        console.log(`Sync to ${integrationId} successful:`, response);
        this.isLoading = false;
        alert(`Synchronisation avec ${this.getIntegrationDisplayName(integrationId)} terminée !`);
      },
      error => {
        console.error(`Error syncing to ${integrationId}:`, error);
        this.isLoading = false;
        alert(`Erreur lors de la synchronisation avec ${this.getIntegrationDisplayName(integrationId)}`);
      }
    );
  }

  private handleOAuthCallback(provider: string, code: string): void {
    this.isLoading = true;

    let connectObservable;
    switch (provider) {
      case 'google-calendar':
        connectObservable = this.integrationsService.connectGoogleCalendar(code);
        break;
      case 'outlook':
        connectObservable = this.integrationsService.connectOutlook(code);
        break;
      case 'slack':
        connectObservable = this.integrationsService.connectSlack(code);
        break;
      case 'trello':
        // Trello uses token instead of code
        connectObservable = this.integrationsService.connectTrello(code);
        break;
      default:
        this.isLoading = false;
        return;
    }

    connectObservable.subscribe(
      response => {
        console.log(`${provider} connected successfully:`, response);
        this.isLoading = false;
        // Clear URL parameters
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {}
        });
        alert(`${this.getIntegrationDisplayName(provider.replace('-', ''))} connecté avec succès !`);
        
        // Redirect to setup guide section
        setTimeout(() => {
          this.scrollToSetupGuide();
        }, 500);
      },
      error => {
        console.error(`Error connecting ${provider}:`, error);
        this.isLoading = false;
        alert(`Erreur lors de la connexion à ${this.getIntegrationDisplayName(provider.replace('-', ''))}`);
      }
    );
  }

  // Utility methods
  isConnected(integrationId: string): boolean {
    return this.integrationsService.isConnected(integrationId);
  }

  getIntegration(integrationId: string): Integration | undefined {
    return this.integrationsService.getIntegration(integrationId);
  }

  getIntegrationDisplayName(integrationId: string): string {
    return this.integrationsService.getIntegrationDisplayName(integrationId);
  }

  getIntegrationIcon(integrationId: string): string {
    return this.integrationsService.getIntegrationIcon(integrationId);
  }

  getIntegrationDescription(integrationId: string): string {
    return this.integrationsService.getIntegrationDescription(integrationId);
  }

  getIntegrationStatus(integrationId: string): 'connected' | 'disconnected' | 'error' {
    return this.integrationsService.getIntegrationStatus(integrationId);
  }

  getConnectedIntegrations(): string[] {
    return this.integrationsService.getConnectedIntegrations();
  }

  formatLastSync(date: Date | undefined): string {
    if (!date) return 'Jamais';
    return new Date(date).toLocaleString('fr-FR');
  }

  getBaseUrl(): string {
    return window.location.origin;
  }

  getIntegrationColor(integrationId: string): string {
    const integration = this.availableIntegrations.find(i => i.id === integrationId);
    return integration?.color || '#6c757d';
  }

  // Test methods (for development)
  testSlackNotification(): void {
    const message = '🔔 Test de notification depuis TaskFlow Pro !';
    this.integrationsService.sendSlackNotification(message).subscribe(
      response => {
        console.log('Test notification sent:', response);
        alert('Notification de test envoyée à Slack !');
      },
      error => {
        console.error('Error sending test notification:', error);
        alert('Erreur lors de l\'envoi de la notification de test');
      }
    );
  }

  // Scroll to setup guide section
  private scrollToSetupGuide(): void {
    const guideElement = document.querySelector('.integration-instructions');
    if (guideElement) {
      guideElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }
}