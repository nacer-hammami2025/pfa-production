import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Notification {
  _id: string;
  user: string;
  type: 'task_due' | 'task_overdue' | 'task_assigned' | 'task_completed' | 'team_invitation' | 'team_activity' | 'achievement_unlocked' | 'reminder' | 'system_update' | 'deadline_approaching';
  title: string;
  message: string;
  data: {
    taskId?: string;
    teamId?: string;
    achievementId?: string;
    dueDate?: Date;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  };
  read: boolean;
  readAt?: Date;
  sent: boolean;
  sentAt?: Date;
  scheduledFor?: Date;
  channels: ('in_app' | 'email' | 'push')[];
  createdAt: Date;
  expiresAt: Date;
}

export interface NotificationPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    reminders: boolean;
    taskDue: boolean;
    teamActivity: boolean;
    achievements: boolean;
  };
  timezone: string;
  language: string;
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationApiService {
  private baseUrl = '/api/notifications';
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUnreadCount();
  }

  // Récupérer les notifications avec pagination
  getNotifications(page = 1, limit = 20, unreadOnly = false): Observable<NotificationResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (unreadOnly) {
      params = params.set('unread', 'true');
    }

    return this.http.get<NotificationResponse>(this.baseUrl, { params });
  }

  // Compter les notifications non lues
  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/unread-count`);
  }

  // Marquer une notification comme lue
  markAsRead(notificationId: string): Observable<Notification> {
    return this.http.put<Notification>(`${this.baseUrl}/${notificationId}/read`, {}).pipe(
      map(notification => {
        this.loadUnreadCount(); // Recharger le compteur
        return notification;
      })
    );
  }

  // Marquer toutes les notifications comme lues
  markAllAsRead(): Observable<{ message: string; modifiedCount: number }> {
    return this.http.put<{ message: string; modifiedCount: number }>(`${this.baseUrl}/read-all`, {}).pipe(
      map(response => {
        this.unreadCountSubject.next(0); // Réinitialiser le compteur
        return response;
      })
    );
  }

  // Supprimer une notification
  deleteNotification(notificationId: string): Observable<{ msg: string }> {
    return this.http.delete<{ msg: string }>(`${this.baseUrl}/${notificationId}`).pipe(
      map(response => {
        this.loadUnreadCount(); // Recharger le compteur
        return response;
      })
    );
  }

  // Récupérer les préférences de notifications
  getPreferences(): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.baseUrl}/preferences`);
  }

  // Mettre à jour les préférences de notifications
  updatePreferences(preferences: NotificationPreferences): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(`${this.baseUrl}/preferences`, preferences);
  }

  // Créer une notification de test (pour développement)
  createTestNotification(): Observable<{ message: string; notification: Notification }> {
    return this.http.post<{ message: string; notification: Notification }>(`${this.baseUrl}/test`, {}).pipe(
      map(response => {
        this.loadUnreadCount(); // Recharger le compteur
        return response;
      })
    );
  }

  // Méthodes utilitaires
  private loadUnreadCount(): void {
    this.getUnreadCount().subscribe(
      response => this.unreadCountSubject.next(response.count),
      error => console.error('Error loading unread count:', error)
    );
  }

  // Obtenir la couleur de priorité
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent': return '#e74c3c';
      case 'high': return '#e67e22';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  }

  // Obtenir l'icône selon le type de notification
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'task_due': return '⏰';
      case 'task_overdue': return '🚨';
      case 'task_assigned': return '👤';
      case 'task_completed': return '✅';
      case 'team_invitation': return '👥';
      case 'team_activity': return '💬';
      case 'achievement_unlocked': return '🏆';
      case 'reminder': return '🔔';
      case 'system_update': return '🔄';
      case 'deadline_approaching': return '⚡';
      default: return '📢';
    }
  }

  // Formater la date relative
  formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

    return new Date(date).toLocaleDateString();
  }
}