import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Integration {
  connected: boolean;
  connectedAt?: Date;
  lastSync?: Date;
  email?: string;
  teamName?: string;
  username?: string;
  [key: string]: any;
}

export interface Integrations {
  googleCalendar?: Integration;
  outlook?: Integration;
  slack?: Integration;
  trello?: Integration;
  [key: string]: Integration | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class IntegrationsService {
  private apiUrl = '/api/integrations';
  private integrationsSubject = new BehaviorSubject<Integrations>({});
  public integrations$ = this.integrationsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadIntegrations();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  loadIntegrations(): Observable<Integrations> {
    return this.http.get<Integrations>(this.apiUrl, { headers: this.getHeaders() })
      .pipe(
        tap(integrations => this.integrationsSubject.next(integrations))
      );
  }

  // Google Calendar Integration
  connectGoogleCalendar(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/google-calendar/connect`, { code }, { headers: this.getHeaders() })
      .pipe(
        tap(() => this.loadIntegrations().subscribe())
      );
  }

  syncToGoogleCalendar(): Observable<any> {
    return this.http.post(`${this.apiUrl}/google-calendar/sync`, {}, { headers: this.getHeaders() });
  }

  getGoogleCalendarAuthUrl(): string {
    const clientId = environment.integrations.google.clientId;
    const redirectUri = encodeURIComponent(environment.integrations.google.redirectUri);
    const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email');

    return `https://accounts.google.com/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=offline`;
  }

  // Microsoft Outlook Integration
  connectOutlook(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/outlook/connect`, { code }, { headers: this.getHeaders() })
      .pipe(
        tap(() => this.loadIntegrations().subscribe())
      );
  }

  getOutlookAuthUrl(): string {
    const clientId = environment.integrations.outlook.clientId;
    const redirectUri = encodeURIComponent(environment.integrations.outlook.redirectUri);
    const scope = encodeURIComponent('https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/User.Read');

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=offline`;
  }

  // Slack Integration
  connectSlack(code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/slack/connect`, { code }, { headers: this.getHeaders() })
      .pipe(
        tap(() => this.loadIntegrations().subscribe())
      );
  }

  sendSlackNotification(message: string, channel?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/slack/notify`, { message, channel }, { headers: this.getHeaders() });
  }

  getSlackAuthUrl(): string {
    const clientId = environment.integrations.slack.clientId;
    const redirectUri = encodeURIComponent(environment.integrations.slack.redirectUri);
    const scope = encodeURIComponent('chat:write channels:read');

    return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  }

  // Trello Integration
  connectTrello(token: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/trello/connect`, { token }, { headers: this.getHeaders() })
      .pipe(
        tap(() => this.loadIntegrations().subscribe())
      );
  }

  syncToTrello(): Observable<any> {
    return this.http.post(`${this.apiUrl}/trello/sync`, {}, { headers: this.getHeaders() });
  }

  getTrelloAuthUrl(): string {
    const apiKey = environment.integrations.trello.apiKey;
    const redirectUri = encodeURIComponent(environment.integrations.trello.redirectUri);
    const scope = encodeURIComponent('read,write');
    const expiration = 'never';

    return `https://trello.com/1/authorize?expiration=${expiration}&name=TaskFlow%20Pro&scope=${scope}&response_type=token&key=${apiKey}&return_url=${redirectUri}`;
  }

  // Generic disconnect
  disconnect(provider: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${provider}`, { headers: this.getHeaders() })
      .pipe(
        tap(() => this.loadIntegrations().subscribe())
      );
  }

  // Utility methods
  isConnected(provider: string): boolean {
    const integrations = this.integrationsSubject.value;
    return integrations[provider]?.connected || false;
  }

  getIntegration(provider: string): Integration | undefined {
    return this.integrationsSubject.value[provider];
  }

  getConnectedIntegrations(): string[] {
    const integrations = this.integrationsSubject.value;
    return Object.keys(integrations).filter(provider => integrations[provider]?.connected);
  }

  // Auto-sync methods
  autoSyncCompletedTask(task: any): void {
    const integrations = this.integrationsSubject.value;

    // Sync to Google Calendar if connected
    if (integrations.googleCalendar?.connected) {
      this.syncToGoogleCalendar().subscribe(
        () => console.log('Task synced to Google Calendar'),
        error => console.error('Failed to sync to Google Calendar:', error)
      );
    }

    // Sync to Trello if connected
    if (integrations.trello?.connected) {
      this.syncToTrello().subscribe(
        () => console.log('Tasks synced to Trello'),
        error => console.error('Failed to sync to Trello:', error)
      );
    }

    // Send Slack notification if connected
    if (integrations.slack?.connected) {
      const message = `✅ Tâche terminée: "${task.title}"`;
      this.sendSlackNotification(message).subscribe(
        () => console.log('Notification sent to Slack'),
        error => console.error('Failed to send Slack notification:', error)
      );
    }
  }

  autoSyncNewTask(task: any): void {
    const integrations = this.integrationsSubject.value;

    // Sync to Google Calendar if connected and task has due date
    if (integrations.googleCalendar?.connected && task.dueDate) {
      this.syncToGoogleCalendar().subscribe(
        () => console.log('Task synced to Google Calendar'),
        error => console.error('Failed to sync to Google Calendar:', error)
      );
    }

    // Sync to Trello if connected
    if (integrations.trello?.connected) {
      this.syncToTrello().subscribe(
        () => console.log('Tasks synced to Trello'),
        error => console.error('Failed to sync to Trello:', error)
      );
    }
  }

  // Integration status helpers
  getIntegrationStatus(provider: string): 'connected' | 'disconnected' | 'error' {
    const integration = this.getIntegration(provider);
    if (!integration) return 'disconnected';
    if (integration.connected) return 'connected';
    return 'error';
  }

  getIntegrationDisplayName(provider: string): string {
    const names: { [key: string]: string } = {
      googleCalendar: 'Google Calendar',
      outlook: 'Microsoft Outlook',
      slack: 'Slack',
      trello: 'Trello'
    };
    return names[provider] || provider;
  }

  getIntegrationIcon(provider: string): string {
    const icons: { [key: string]: string } = {
      googleCalendar: '📅',
      outlook: '📧',
      slack: '💬',
      trello: '📋'
    };
    return icons[provider] || '🔗';
  }

  getIntegrationDescription(provider: string): string {
    const descriptions: { [key: string]: string } = {
      googleCalendar: 'Synchronisez vos tâches avec Google Calendar',
      outlook: 'Intégrez avec Microsoft Outlook Calendar',
      slack: 'Recevez des notifications dans Slack',
      trello: 'Synchronisez vos tâches avec Trello'
    };
    return descriptions[provider] || 'Intégration externe';
  }
}