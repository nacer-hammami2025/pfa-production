import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { SmartNotificationService, SmartNotification } from '../../services/smart-notification.service';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notification-center-overlay" *ngIf="isVisible" (click)="closeCenter()">
      <div class="notification-center" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="center-header">
          <div class="header-content">
            <h2 class="center-title">
              <i class="icon-bell"></i>
              Centre de Notifications
            </h2>
            <span class="notification-count" *ngIf="notifications.length > 0">
              {{ notifications.length }}
            </span>
          </div>
          <div class="header-actions">
            <button class="btn-ghost" (click)="clearAll()" *ngIf="notifications.length > 0">
              <i class="icon-trash"></i>
              Tout effacer
            </button>
            <button class="btn-close" (click)="closeCenter()">
              <i class="icon-x"></i>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="center-content">
          <div *ngIf="notifications.length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="icon-bell-off"></i>
            </div>
            <h3>Aucune notification</h3>
            <p>Vous êtes à jour !</p>
          </div>

          <div *ngIf="notifications.length > 0" class="notifications-list">
            <div class="notification-item animate-fade-in"
                 *ngFor="let notification of notifications; trackBy: trackById"
                 [ngClass]="[notification.priority, notification.type]">

              <div class="notification-icon">
                <i [class]="notification.icon || getDefaultIcon(notification.type)"></i>
              </div>

              <div class="notification-content">
                <div class="notification-header">
                  <h4 class="notification-title">{{ notification.title }}</h4>
                  <div class="notification-meta">
                    <span class="notification-priority" [ngClass]="notification.priority">
                      {{ getPriorityLabel(notification.priority) }}
                    </span>
                    <span class="notification-time">
                      {{ notification.timestamp | date:'shortTime' }}
                    </span>
                  </div>
                </div>

                <p class="notification-message">{{ notification.message }}</p>

                <div class="notification-category" *ngIf="notification.category">
                  <small>{{ getCategoryLabel(notification.category) }}</small>
                </div>
              </div>

              <div class="notification-actions">
                <button class="btn-action"
                        *ngIf="notification.actionable && notification.actionLabel"
                        (click)="executeAction(notification)"
                        [ngClass]="notification.priority">
                  {{ notification.actionLabel }}
                </button>

                <button class="btn-dismiss"
                        *ngIf="notification.dismissible"
                        (click)="dismissNotification(notification.id)">
                  <i class="icon-x"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="center-footer" *ngIf="notifications.length > 0">
          <button class="btn-secondary" (click)="markAllAsRead()">
            <i class="icon-check"></i>
            Tout marquer comme lu
          </button>
        </div>
      </div>
    </div>

    <!-- Floating Notification Button -->
    <div class="notification-toggle" (click)="openCenter()" *ngIf="!isVisible">
      <div class="toggle-icon">
        <i class="icon-bell"></i>
        <div class="notification-badge" *ngIf="unreadCount > 0">
          {{ unreadCount }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-center-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: fadeIn 0.2s ease-out;
    }

    .notification-center {
      background: var(--bg-primary);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease-out;
    }

    .center-header {
      padding: var(--space-6);
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .center-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .notification-count {
      background: var(--primary-500);
      color: white;
      border-radius: var(--radius-full);
      padding: 0.125rem var(--space-2);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      gap: var(--space-2);
    }

    .btn-close, .btn-ghost {
      background: transparent;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      padding: var(--space-2);
      border-radius: var(--radius-md);
      transition: all var(--transition-fast);
    }

    .btn-close:hover, .btn-ghost:hover {
      background: var(--bg-accent);
      color: var(--text-primary);
    }

    .center-content {
      flex: 1;
      overflow-y: auto;
      max-height: 60vh;
    }

    .empty-state {
      text-align: center;
      padding: var(--space-12);
      color: var(--text-secondary);
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: var(--space-4);
      opacity: 0.5;
    }

    .empty-state h3 {
      margin: var(--space-2) 0;
      font-weight: 500;
    }

    .notifications-list {
      padding: var(--space-4);
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-4);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);
      margin-bottom: var(--space-3);
      transition: all var(--transition-fast);
      position: relative;
    }

    .notification-item:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .notification-item.urgent {
      border-left: 4px solid var(--error);
      background: rgba(239, 68, 68, 0.05);
    }

    .notification-item.high {
      border-left: 4px solid var(--warning);
      background: rgba(245, 158, 11, 0.05);
    }

    .notification-item.achievement {
      border-left: 4px solid var(--success);
      background: rgba(16, 185, 129, 0.05);
    }

    .notification-icon {
      width: 2.5rem;
      height: 2.5rem;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 1.125rem;
    }

    .notification-item.urgent .notification-icon { background: rgba(239, 68, 68, 0.2); color: var(--error); }
    .notification-item.deadline .notification-icon { background: rgba(245, 158, 11, 0.2); color: var(--warning); }
    .notification-item.achievement .notification-icon { background: rgba(16, 185, 129, 0.2); color: var(--success); }
    .notification-item.suggestion .notification-icon { background: rgba(14, 165, 233, 0.2); color: var(--primary-500); }
    .notification-item.break .notification-icon { background: rgba(139, 92, 246, 0.2); color: var(--accent-purple); }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-1);
    }

    .notification-title {
      font-size: 0.875rem;
      font-weight: 600;
      margin: 0;
      flex: 1;
    }

    .notification-meta {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      flex-shrink: 0;
      margin-left: var(--space-2);
    }

    .notification-priority {
      padding: 0.125rem var(--space-2);
      border-radius: var(--radius-full);
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .notification-priority.urgent { background: var(--error); color: white; }
    .notification-priority.high { background: var(--warning); color: white; }
    .notification-priority.medium { background: var(--primary-500); color: white; }
    .notification-priority.low { background: var(--text-muted); color: white; }

    .notification-time {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .notification-message {
      font-size: 0.8125rem;
      color: var(--text-secondary);
      line-height: 1.4;
      margin: var(--space-1) 0;
    }

    .notification-category {
      margin-top: var(--space-1);
    }

    .notification-category small {
      color: var(--text-muted);
      text-transform: capitalize;
    }

    .notification-actions {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      flex-shrink: 0;
    }

    .btn-action {
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      font-size: 0.75rem;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
      border: none;
    }

    .btn-action.urgent { background: var(--error); color: white; }
    .btn-action.high { background: var(--warning); color: white; }
    .btn-action.medium { background: var(--primary-500); color: white; }
    .btn-action.low { background: var(--text-secondary); color: white; }

    .btn-action:hover {
      transform: translateY(-1px);
      opacity: 0.9;
    }

    .btn-dismiss {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: var(--space-1);
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
    }

    .btn-dismiss:hover {
      background: rgba(0, 0, 0, 0.1);
      color: var(--text-secondary);
    }

    .center-footer {
      padding: var(--space-4) var(--space-6);
      border-top: 1px solid var(--border-color);
      display: flex;
      justify-content: center;
    }

    .btn-secondary {
      background: var(--bg-accent);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      padding: var(--space-2) var(--space-4);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .btn-secondary:hover {
      background: var(--bg-tertiary);
    }

    .notification-toggle {
      position: fixed;
      bottom: var(--space-6);
      right: var(--space-6);
      width: 3.5rem;
      height: 3.5rem;
      background: var(--glass-bg);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: var(--shadow-lg);
      transition: all var(--transition-normal);
      z-index: 1000;
    }

    .notification-toggle:hover {
      transform: scale(1.1);
      box-shadow: var(--shadow-xl);
    }

    .toggle-icon {
      position: relative;
    }

    .notification-badge {
      position: absolute;
      top: -8px;
      right: -8px;
      background: var(--error);
      color: white;
      border-radius: var(--radius-full);
      width: 1.25rem;
      height: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.625rem;
      font-weight: 600;
      border: 2px solid var(--bg-primary);
    }

    /* Animations */
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .notification-center {
        width: 95%;
        max-height: 90vh;
      }

      .notification-center-overlay {
        padding: var(--space-4);
      }

      .notification-toggle {
        bottom: var(--space-4);
        right: var(--space-4);
      }
    }
  `]
})
export class NotificationCenterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isVisible = false;
  notifications: SmartNotification[] = [];
  unreadCount = 0;

  constructor(private notificationService: SmartNotificationService) {}

  ngOnInit(): void {
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
        this.unreadCount = notifications.length;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackById(index: number, item: SmartNotification): string {
    return item.id;
  }

  openCenter(): void {
    this.isVisible = true;
  }

  closeCenter(): void {
    this.isVisible = false;
  }

  dismissNotification(notificationId: string): void {
    this.notificationService.dismissNotification(notificationId);
  }

  executeAction(notification: SmartNotification): void {
    switch (notification.type) {
      case 'break':
        this.notificationService.markBreakTaken();
        break;
      case 'deadline':
        // Could navigate to task details
        break;
      default:
        this.notificationService.executeNotificationAction(notification.id);
    }
  }

  clearAll(): void {
    this.notificationService.clearAllNotifications();
  }

  markAllAsRead(): void {
    // Mark all as read - could implement persistence
    this.notifications = [];
    this.unreadCount = 0;
  }

  getDefaultIcon(type: string): string {
    const icons = {
      deadline: 'icon-clock',
      reminder: 'icon-bell',
      achievement: 'icon-trophy',
      suggestion: 'icon-lightbulb',
      break: 'icon-coffee',
      overdue: 'icon-alert-circle'
    };
    return icons[type as keyof typeof icons] || 'icon-info';
  }

  getPriorityLabel(priority: string): string {
    const labels = {
      urgent: 'Urgent',
      high: 'Élevé',
      medium: 'Moyen',
      low: 'Faible'
    };
    return labels[priority as keyof typeof labels] || priority;
  }

  getCategoryLabel(category: string): string {
    const labels = {
      deadline: 'Échéance',
      wellness: 'Bien-être',
      achievement: 'Accomplissement',
      motivation: 'Motivation',
      planning: 'Planification',
      overdue: 'En retard',
      ai: 'IA'
    };
    return labels[category as keyof typeof labels] || category;
  }
}