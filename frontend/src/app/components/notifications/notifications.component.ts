import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notifications-container" *ngIf="notifications.length > 0">
      <div class="notifications-header">
        <h3>Notifications</h3>
        <button
          class="clear-all-btn"
          (click)="clearAll()"
          *ngIf="notifications.length > 0"
        >
          Tout effacer
        </button>
      </div>

      <div class="notifications-list">
        <div
          *ngFor="let notification of notifications"
          class="notification-item"
          [class.read]="notification.read"
          [class]="notification.type"
        >
          <div class="notification-icon">
            <span [class]="getIconClass(notification.type)"></span>
          </div>

          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">
              {{ formatTime(notification.timestamp) }}
            </div>
          </div>

          <div class="notification-actions">
            <button
              *ngIf="notification.action"
              class="action-btn"
              (click)="executeAction(notification)"
            >
              {{ notification.action.label }}
            </button>
            <button
              class="close-btn"
              (click)="removeNotification(notification.id)"
              title="Fermer"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-container {
      position: fixed;
      top: 80px;
      right: 20px;
      width: 400px;
      max-height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      overflow: hidden;
      animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .notifications-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e9ecef;
      background: #f8f9fa;
    }

    .notifications-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #2c3e50;
      font-weight: 600;
    }

    .clear-all-btn {
      background: none;
      border: none;
      color: #6c757d;
      font-size: 0.9rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .clear-all-btn:hover {
      background: #e9ecef;
      color: #495057;
    }

    .notifications-list {
      max-height: 500px;
      overflow-y: auto;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f1f3f4;
      transition: all 0.2s ease;
      position: relative;
    }

    .notification-item:hover {
      background: #f8f9fa;
    }

    .notification-item.read {
      opacity: 0.7;
      background: #fafafa;
    }

    .notification-item.success {
      border-left: 4px solid #27ae60;
    }

    .notification-item.warning {
      border-left: 4px solid #f39c12;
    }

    .notification-item.error {
      border-left: 4px solid #e74c3c;
    }

    .notification-item.info {
      border-left: 4px solid #3498db;
    }

    .notification-icon {
      margin-right: 1rem;
      margin-top: 0.2rem;
    }

    .notification-icon span {
      font-size: 1.2rem;
    }

    .notification-item.success .notification-icon span::before {
      content: '✓';
      color: #27ae60;
    }

    .notification-item.warning .notification-icon span::before {
      content: '⚠';
      color: #f39c12;
    }

    .notification-item.error .notification-icon span::before {
      content: '✕';
      color: #e74c3c;
    }

    .notification-item.info .notification-icon span::before {
      content: 'ℹ';
      color: #3498db;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.25rem;
      font-size: 0.95rem;
    }

    .notification-message {
      color: #6c757d;
      font-size: 0.9rem;
      line-height: 1.4;
      margin-bottom: 0.5rem;
    }

    .notification-time {
      font-size: 0.8rem;
      color: #adb5bd;
    }

    .notification-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-left: 1rem;
    }

    .action-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .close-btn {
      background: none;
      border: none;
      color: #6c757d;
      font-size: 1.2rem;
      cursor: pointer;
      padding: 0.2rem;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: #e9ecef;
      color: #495057;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .notifications-container {
        width: calc(100vw - 40px);
        right: 20px;
        left: 20px;
        max-height: calc(100vh - 120px);
      }

      .notifications-header {
        padding: 1rem;
      }

      .notification-item {
        padding: 1rem;
        flex-direction: column;
        align-items: flex-start;
      }

      .notification-actions {
        margin-left: 0;
        margin-top: 0.5rem;
        align-self: flex-end;
      }
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription!: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.getNotifications().subscribe(
      notifications => {
        this.notifications = notifications;
      }
    );
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  getIconClass(type: string): string {
    return `icon-${type}`;
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  }

  executeAction(notification: Notification): void {
    if (notification.action) {
      notification.action.callback();
      this.markAsRead(notification.id);
    }
  }

  removeNotification(id: string): void {
    this.notificationService.removeNotification(id);
  }

  clearAll(): void {
    this.notificationService.clearAll();
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id);
  }
}