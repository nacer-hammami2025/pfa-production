import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotificationService } from './notification.service';

export interface PersistentNotification {
  _id: string;
  user: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  category?: 'task' | 'productivity' | 'motivation' | 'reminder' | 'admin';
  priority?: 'low' | 'medium' | 'high';
  action?: {
    label: string;
    callback: string;
  };
  persistent: boolean;
  read: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class PersistentNotificationService {
  private apiUrl = '/api/notifications';

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  // Load persistent notifications from backend and show them in the UI
  loadPersistentNotifications(): Observable<PersistentNotification[]> {
    return this.http.get<PersistentNotification[]>(`${this.apiUrl}/user`);
  }

  // Display persistent notifications in the UI
  displayPersistentNotifications(): void {
    console.log('🔄 Chargement des notifications persistantes...');
    this.loadPersistentNotifications().subscribe({
      next: (response: any) => {
        const notifications = response.notifications || response;
        console.log(`📬 ${notifications.length} notification(s) trouvée(s)`);
        
        notifications.forEach((notification: PersistentNotification) => {
          if (!notification.read) {
            console.log('📨 Affichage notification:', notification.title);
            this.notificationService.addNotification({
              type: notification.type,
              title: notification.title,
              message: notification.message,
              category: notification.category || 'admin',
              priority: notification.priority || 'medium',
              action: notification.action ? {
                label: notification.action.label,
                callback: () => {
                  // Handle action callback (could navigate to a route)
                  if (notification.action?.callback) {
                    console.log('🔗 Navigation vers:', notification.action.callback);
                    window.location.href = notification.action.callback;
                  }
                }
              } : undefined,
              persistent: notification.persistent,
              autoHide: false // Persistent notifications should not auto-hide
            });
            
            // Marquer comme lue automatiquement après affichage
            setTimeout(() => {
              this.markAsRead(notification._id).subscribe({
                next: () => console.log('✅ Notification marquée comme lue'),
                error: (err) => console.error('❌ Erreur marquage lecture:', err)
              });
            }, 5000);
          }
        });
      },
      error: (error) => {
        console.error('❌ Erreur chargement notifications persistantes:', error);
      }
    });
  }

  // Mark notification as read
  markAsRead(notificationId: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  // Delete notification
  deleteNotification(notificationId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${notificationId}`);
  }
}