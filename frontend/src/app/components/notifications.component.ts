import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { NotificationService, Notification } from '../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notifications',
  template: `
    <div class="notifications-panel" [class.visible]="true">
      <div class="notifications-header">
        <h3>Notifications</h3>
        <button class="close-btn" (click)="closePanelEvent()">
          <i class="close-icon">✕</i>
        </button>
      </div>

      <div class="notifications-content">
        <div *ngIf="notifications.length === 0" class="no-notifications">
          <div class="no-notifications-icon">🔔</div>
          <p>No notifications yet</p>
          <span class="no-notifications-subtitle">We'll notify you when something important happens</span>
        </div>

        <div *ngFor="let notification of notifications" class="notification-item"
             [class.unread]="!notification.read"
             (click)="markAsRead(notification)">
          <div class="notification-icon">
            <span [innerHTML]="getNotificationIcon(notification.type)"></span>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">{{ getTimeAgo(notification.timestamp) }}</div>
          </div>
          <div class="notification-actions" *ngIf="notification.action">
            <button class="action-btn" (click)="executeAction(notification)">
              {{ notification.action.label }}
            </button>
          </div>
        </div>
      </div>

      <div class="notifications-footer" *ngIf="notifications.length > 0">
        <button class="clear-all-btn" (click)="clearAllNotifications()">
          Clear All
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notifications-panel {
      position: fixed;
      top: 80px;
      right: 20px;
      width: 380px;
      max-height: 600px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
      z-index: 1001;
      overflow: hidden;
      transform: translateY(-10px);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .notifications-panel.visible {
      transform: translateY(0);
      opacity: 1;
      visibility: visible;
    }

    :host-context(.dark-mode) .notifications-panel {
      background: rgba(15, 15, 35, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    }

    .notifications-header {
      padding: 1.5rem 1.5rem 1rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    :host-context(.dark-mode) .notifications-header {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .notifications-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #2c3e50;
    }

    :host-context(.dark-mode) .notifications-header h3 {
      color: #e2e8f0;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: all 0.3s ease;
      color: #6c757d;
    }

    .close-btn:hover {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
    }

    .close-icon {
      font-size: 1.1rem;
    }

    .notifications-content {
      max-height: 450px;
      overflow-y: auto;
    }

    .no-notifications {
      padding: 3rem 2rem;
      text-align: center;
      color: #6c757d;
    }

    :host-context(.dark-mode) .no-notifications {
      color: #a0aec0;
    }

    .no-notifications-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .no-notifications p {
      margin: 0 0 0.5rem 0;
      font-weight: 500;
    }

    .no-notifications-subtitle {
      font-size: 0.9rem;
      opacity: 0.7;
    }

    .notification-item {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
    }

    .notification-item:hover {
      background: rgba(102, 126, 234, 0.05);
    }

    .notification-item.unread {
      background: rgba(102, 126, 234, 0.1);
      border-left: 3px solid #667eea;
    }

    :host-context(.dark-mode) .notification-item {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-mode) .notification-item:hover {
      background: rgba(102, 126, 234, 0.1);
    }

    :host-context(.dark-mode) .notification-item.unread {
      background: rgba(102, 126, 234, 0.15);
    }

    .notification-icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(45deg, #667eea, #764ba2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
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

    :host-context(.dark-mode) .notification-title {
      color: #e2e8f0;
    }

    .notification-message {
      color: #6c757d;
      font-size: 0.9rem;
      line-height: 1.4;
      margin-bottom: 0.5rem;
    }

    :host-context(.dark-mode) .notification-message {
      color: #a0aec0;
    }

    .notification-time {
      font-size: 0.8rem;
      color: #95a5a6;
    }

    :host-context(.dark-mode) .notification-time {
      color: #718096;
    }

    .notification-actions {
      flex-shrink: 0;
    }

    .action-btn {
      padding: 0.375rem 0.75rem;
      border: 1px solid #667eea;
      background: transparent;
      color: #667eea;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .action-btn:hover {
      background: #667eea;
      color: white;
    }

    .notifications-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    :host-context(.dark-mode) .notifications-footer {
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .clear-all-btn {
      background: none;
      border: none;
      color: #e74c3c;
      cursor: pointer;
      font-size: 0.9rem;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      transition: all 0.3s ease;
    }

    .clear-all-btn:hover {
      background: rgba(231, 76, 60, 0.1);
    }

    /* Scrollbar styling */
    .notifications-content::-webkit-scrollbar {
      width: 6px;
    }

    .notifications-content::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 3px;
    }

    .notifications-content::-webkit-scrollbar-thumb {
      background: rgba(102, 126, 234, 0.3);
      border-radius: 3px;
    }

    .notifications-content::-webkit-scrollbar-thumb:hover {
      background: rgba(102, 126, 234, 0.5);
    }

    :host-context(.dark-mode) .notifications-content::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.1);
    }

    :host-context(.dark-mode) .notifications-content::-webkit-scrollbar-thumb {
      background: rgba(102, 126, 234, 0.5);
    }

    :host-context(.dark-mode) .notifications-content::-webkit-scrollbar-thumb:hover {
      background: rgba(102, 126, 234, 0.7);
    }

    /* Responsive */
    @media (max-width: 480px) {
      .notifications-panel {
        top: 75px;
        right: 10px;
        left: 10px;
        width: auto;
        max-height: 500px;
      }

      .notification-item {
        padding: 1rem;
        gap: 0.75rem;
      }

      .notification-icon {
        width: 35px;
        height: 35px;
        font-size: 1rem;
      }
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription?: Subscription;

  @Output() closePanel = new EventEmitter<void>();

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.subscription = this.notificationService.getNotifications().subscribe(
      notifications => {
        this.notifications = notifications;
      }
    );
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  closePanelEvent() {
    this.closePanel.emit();
  }

  markAsRead(notification: Notification) {
    if (!notification.read) {
      this.notificationService.markAsRead(notification.id);
    }
  }

  executeAction(notification: Notification) {
    if (notification.action && notification.action.callback) {
      notification.action.callback();
    }
  }

  clearAllNotifications() {
    this.notificationService.clearAll();
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      case 'task': return '📋';
      default: return '🔔';
    }
  }

  getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const timeDiff = now.getTime() - new Date(timestamp).getTime();

    const minutes = Math.floor(timeDiff / (1000 * 60));
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
}