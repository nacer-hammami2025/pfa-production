import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NotificationApiService, Notification, NotificationPreferences } from '../../services/notification-api.service';

@Component({
  selector: 'app-advanced-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="advanced-notifications-wrapper">
      <!-- Header -->
      <div class="notifications-header glass-card">
        <div class="header-content">
          <h2 class="header-title">
            <i class="header-icon">🔔</i>
            Notifications Center
          </h2>
          <div class="header-actions">
            <button
              class="settings-btn"
              (click)="showSettings = !showSettings"
              [class.active]="showSettings"
            >
              <i class="settings-icon">⚙️</i>
              Settings
            </button>
            <button
              class="mark-all-read-btn"
              (click)="markAllAsRead()"
              [disabled]="unreadCount === 0"
            >
              <i class="mark-read-icon">✓</i>
              Mark All Read
            </button>
          </div>
        </div>

        <!-- Unread Counter -->
        <div class="unread-counter" *ngIf="unreadCount > 0">
          <span class="counter-badge">{{ unreadCount }}</span>
          <span class="counter-text">unread</span>
        </div>
      </div>

      <!-- Settings Panel -->
      <div class="settings-panel glass-card" *ngIf="showSettings">
        <h3 class="settings-title">Notification Preferences</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">
              <input
                type="checkbox"
                [(ngModel)]="preferences.notifications.email"
                (change)="updatePreferences()"
              />
              <span class="checkmark"></span>
              Email Notifications
            </label>
          </div>
          <div class="setting-item">
            <label class="setting-label">
              <input
                type="checkbox"
                [(ngModel)]="preferences.notifications.push"
                (change)="updatePreferences()"
              />
              <span class="checkmark"></span>
              Push Notifications
            </label>
          </div>
          <div class="setting-item">
            <label class="setting-label">
              <input
                type="checkbox"
                [(ngModel)]="preferences.notifications.taskDue"
                (change)="updatePreferences()"
              />
              <span class="checkmark"></span>
              Task Due Reminders
            </label>
          </div>
          <div class="setting-item">
            <label class="setting-label">
              <input
                type="checkbox"
                [(ngModel)]="preferences.notifications.teamActivity"
                (change)="updatePreferences()"
              />
              <span class="checkmark"></span>
              Team Activity
            </label>
          </div>
          <div class="setting-item">
            <label class="setting-label">
              <input
                type="checkbox"
                [(ngModel)]="preferences.notifications.achievements"
                (change)="updatePreferences()"
              />
              <span class="checkmark"></span>
              Achievement Unlocks
            </label>
          </div>
          <div class="setting-item">
            <label class="setting-label">
              <input
                type="checkbox"
                [(ngModel)]="preferences.notifications.reminders"
                (change)="updatePreferences()"
              />
              <span class="checkmark"></span>
              Smart Reminders
            </label>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="filter-tabs">
          <button
            class="filter-tab"
            [class.active]="activeFilter === 'all'"
            (click)="setFilter('all')"
          >
            All ({{ totalCount }})
          </button>
          <button
            class="filter-tab"
            [class.active]="activeFilter === 'unread'"
            (click)="setFilter('unread')"
          >
            Unread ({{ unreadCount }})
          </button>
        </div>
        <div class="filter-actions">
          <button class="test-notification-btn" (click)="createTestNotification()">
            <i class="test-icon">🧪</i>
            Test Notification
          </button>
        </div>
      </div>

      <!-- Notifications List -->
      <div class="notifications-list" *ngIf="notifications.length > 0; else noNotifications">
        <div
          *ngFor="let notification of notifications; trackBy: trackById"
          class="notification-card glass-card"
          [class.unread]="!notification.read"
          [class]="notification.data.priority || 'medium'"
        >
          <!-- Notification Header -->
          <div class="notification-header">
            <div class="notification-icon">
              <span class="icon-emoji">{{ getNotificationIcon(notification.type) }}</span>
            </div>
            <div class="notification-meta">
              <span class="notification-type">{{ getTypeLabel(notification.type) }}</span>
              <span class="notification-time">{{ formatRelativeTime(notification.createdAt) }}</span>
            </div>
            <div class="notification-actions">
              <button
                class="mark-read-btn"
                (click)="markAsRead(notification._id)"
                *ngIf="!notification.read"
                title="Mark as read"
              >
                ✓
              </button>
              <button
                class="delete-btn"
                (click)="deleteNotification(notification._id)"
                title="Delete notification"
              >
                🗑️
              </button>
            </div>
          </div>

          <!-- Notification Content -->
          <div class="notification-content">
            <h4 class="notification-title">{{ notification.title }}</h4>
            <p class="notification-message">{{ notification.message }}</p>

            <!-- Action Data -->
            <div class="notification-data" *ngIf="notification.data">
              <div class="data-item" *ngIf="notification.data.dueDate">
                <i class="data-icon">📅</i>
                <span>Due: {{ notification.data.dueDate | date:'short' }}</span>
              </div>
              <div class="data-item" *ngIf="notification.data.priority">
                <i class="data-icon">⚡</i>
                <span class="priority-badge" [style.color]="getPriorityColor(notification.data.priority)">
                  {{ notification.data.priority | titlecase }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="notification-actions-bar" *ngIf="!notification.read">
            <button class="action-btn primary" (click)="markAsRead(notification._id)">
              Mark as Read
            </button>
            <button class="action-btn secondary" (click)="deleteNotification(notification._id)">
              Dismiss
            </button>
          </div>
        </div>
      </div>

      <!-- No Notifications State -->
      <ng-template #noNotifications>
        <div class="no-notifications glass-card">
          <div class="empty-state">
            <div class="empty-icon">🔔</div>
            <h3 class="empty-title">No notifications yet</h3>
            <p class="empty-message">
              {{ activeFilter === 'unread' ? 'You have no unread notifications.' : 'Your notifications will appear here.' }}
            </p>
            <button class="test-btn" (click)="createTestNotification()">
              Create Test Notification
            </button>
          </div>
        </div>
      </ng-template>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="isLoading">
        <div class="loading-spinner"></div>
        <span>Loading notifications...</span>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="totalPages > 1">
        <button
          class="page-btn"
          (click)="changePage(currentPage - 1)"
          [disabled]="currentPage === 1"
        >
          ← Previous
        </button>

        <span class="page-info">
          Page {{ currentPage }} of {{ totalPages }}
        </span>

        <button
          class="page-btn"
          (click)="changePage(currentPage + 1)"
          [disabled]="currentPage === totalPages"
        >
          Next →
        </button>
      </div>
    </div>
  `,
  styles: [`
    .advanced-notifications-wrapper {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      min-height: 100vh;
    }

    /* Header */
    .notifications-header {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 15px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      font-size: 1.8rem;
      font-weight: 700;
      color: #2c3e50;
      margin: 0;
    }

    .header-icon {
      font-size: 2rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .settings-btn, .mark-all-read-btn {
      padding: 0.8rem 1.2rem;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .settings-btn {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
    }

    .settings-btn:hover, .settings-btn.active {
      background: #667eea;
      color: white;
    }

    .mark-all-read-btn {
      background: rgba(39, 174, 96, 0.1);
      color: #27ae60;
    }

    .mark-all-read-btn:hover:not(:disabled) {
      background: #27ae60;
      color: white;
    }

    .mark-all-read-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .unread-counter {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .counter-badge {
      background: #e74c3c;
      color: white;
      padding: 0.2rem 0.6rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .counter-text {
      color: #6c757d;
      font-size: 0.9rem;
    }

    /* Settings Panel */
    .settings-panel {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 15px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .settings-title {
      margin: 0 0 1.5rem 0;
      color: #2c3e50;
      font-size: 1.3rem;
      font-weight: 600;
    }

    .settings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .setting-item {
      padding: 0.8rem;
      background: rgba(248, 249, 250, 0.8);
      border-radius: 10px;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .setting-label {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      cursor: pointer;
      font-weight: 500;
      color: #495057;
    }

    .setting-label input[type="checkbox"] {
      display: none;
    }

    .checkmark {
      width: 20px;
      height: 20px;
      border: 2px solid #dee2e6;
      border-radius: 4px;
      position: relative;
      transition: all 0.3s ease;
    }

    .setting-label input[type="checkbox"]:checked + .checkmark {
      background: linear-gradient(45deg, #667eea, #764ba2);
      border-color: #667eea;
    }

    .setting-label input[type="checkbox"]:checked + .checkmark::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 12px;
      font-weight: bold;
    }

    /* Filters */
    .filters-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding: 1rem;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(15px);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .filter-tabs {
      display: flex;
      gap: 0.5rem;
    }

    .filter-tab {
      padding: 0.6rem 1.2rem;
      border: none;
      background: rgba(248, 249, 250, 0.8);
      color: #6c757d;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .filter-tab:hover, .filter-tab.active {
      background: #667eea;
      color: white;
    }

    .test-notification-btn {
      padding: 0.6rem 1.2rem;
      background: rgba(52, 152, 219, 0.1);
      color: #3498db;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
    }

    .test-notification-btn:hover {
      background: #3498db;
      color: white;
    }

    /* Notifications List */
    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .notification-card {
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 15px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
      position: relative;
    }

    .notification-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }

    .notification-card.unread {
      border-left: 4px solid #667eea;
      background: rgba(102, 126, 234, 0.02);
    }

    .notification-card.urgent {
      border-left-color: #e74c3c;
      background: rgba(231, 76, 60, 0.02);
    }

    .notification-card.high {
      border-left-color: #e67e22;
      background: rgba(230, 126, 34, 0.02);
    }

    .notification-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .notification-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(45deg, #667eea, #764ba2);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .notification-meta {
      flex: 1;
    }

    .notification-type {
      display: block;
      font-size: 0.8rem;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-weight: 600;
    }

    .notification-time {
      font-size: 0.9rem;
      color: #adb5bd;
    }

    .notification-actions {
      display: flex;
      gap: 0.5rem;
    }

    .mark-read-btn, .delete-btn {
      width: 30px;
      height: 30px;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }

    .mark-read-btn {
      background: rgba(39, 174, 96, 0.1);
      color: #27ae60;
    }

    .mark-read-btn:hover {
      background: #27ae60;
      color: white;
    }

    .delete-btn {
      background: rgba(231, 76, 60, 0.1);
      color: #e74c3c;
    }

    .delete-btn:hover {
      background: #e74c3c;
      color: white;
    }

    .notification-content {
      margin-bottom: 1rem;
    }

    .notification-title {
      font-size: 1.2rem;
      font-weight: 600;
      color: #2c3e50;
      margin: 0 0 0.5rem 0;
    }

    .notification-message {
      color: #495057;
      line-height: 1.5;
      margin: 0 0 1rem 0;
    }

    .notification-data {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .data-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #6c757d;
    }

    .priority-badge {
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.8rem;
    }

    .notification-actions-bar {
      display: flex;
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
    }

    .action-btn {
      flex: 1;
      padding: 0.8rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .action-btn.primary {
      background: #667eea;
      color: white;
    }

    .action-btn.primary:hover {
      background: #5a6fd8;
    }

    .action-btn.secondary {
      background: rgba(108, 117, 125, 0.1);
      color: #6c757d;
    }

    .action-btn.secondary:hover {
      background: #6c757d;
      color: white;
    }

    /* Empty State */
    .no-notifications {
      padding: 3rem;
      text-align: center;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 15px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .empty-state {
      max-width: 400px;
      margin: 0 auto;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    .empty-title {
      color: #2c3e50;
      margin: 0 0 0.5rem 0;
      font-size: 1.5rem;
    }

    .empty-message {
      color: #6c757d;
      margin: 0 0 2rem 0;
      line-height: 1.5;
    }

    .test-btn {
      padding: 0.8rem 1.5rem;
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .test-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 2rem;
      color: #6c757d;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid rgba(102, 126, 234, 0.1);
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Pagination */
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 2rem;
      margin-top: 2rem;
      padding: 1rem;
    }

    .page-btn {
      padding: 0.8rem 1.5rem;
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .page-btn:hover:not(:disabled) {
      background: #667eea;
      color: white;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      color: #6c757d;
      font-weight: 500;
    }

    /* Glass Card Utility */
    .glass-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 15px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .advanced-notifications-wrapper {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .header-actions {
        width: 100%;
        justify-content: space-between;
      }

      .filters-bar {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .filter-tabs {
        justify-content: center;
      }

      .notification-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.8rem;
      }

      .notification-actions {
        align-self: flex-end;
      }

      .notification-actions-bar {
        flex-direction: column;
        gap: 0.5rem;
      }

      .action-btn {
        width: 100%;
      }

      .pagination {
        flex-direction: column;
        gap: 1rem;
      }

      .page-btn {
        width: 100%;
      }
    }
  `]
})
export class AdvancedNotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  preferences: NotificationPreferences = {
    notifications: {
      email: true,
      push: true,
      reminders: true,
      taskDue: true,
      teamActivity: true,
      achievements: true
    },
    timezone: 'UTC',
    language: 'en'
  };

  unreadCount = 0;
  totalCount = 0;
  totalPages = 1;
  currentPage = 1;
  activeFilter: 'all' | 'unread' = 'all';
  showSettings = false;
  isLoading = false;

  private subscriptions: Subscription[] = [];

  constructor(private notificationApiService: NotificationApiService) {}

  ngOnInit(): void {
    this.loadPreferences();
    this.loadNotifications();
    this.subscribeToUnreadCount();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.notificationApiService
      .getNotifications(this.currentPage, 20, this.activeFilter === 'unread')
      .subscribe({
        next: (response) => {
          this.notifications = response.notifications;
          this.totalCount = response.pagination.total;
          this.totalPages = response.pagination.pages;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading notifications:', error);
          this.isLoading = false;
        }
      });
  }

  loadPreferences(): void {
    this.notificationApiService.getPreferences().subscribe({
      next: (preferences) => {
        this.preferences = preferences;
      },
      error: (error) => {
        console.error('Error loading preferences:', error);
      }
    });
  }

  subscribeToUnreadCount(): void {
    const sub = this.notificationApiService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    this.subscriptions.push(sub);
  }

  markAsRead(notificationId: string): void {
    this.notificationApiService.markAsRead(notificationId).subscribe({
      next: () => {
        const notification = this.notifications.find(n => n._id === notificationId);
        if (notification) {
          notification.read = true;
        }
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  markAllAsRead(): void {
    this.notificationApiService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.read = true);
      },
      error: (error) => {
        console.error('Error marking all notifications as read:', error);
      }
    });
  }

  deleteNotification(notificationId: string): void {
    this.notificationApiService.deleteNotification(notificationId).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n._id !== notificationId);
        this.totalCount--;
      },
      error: (error) => {
        console.error('Error deleting notification:', error);
      }
    });
  }

  updatePreferences(): void {
    this.notificationApiService.updatePreferences(this.preferences).subscribe({
      next: () => {
        // Preferences updated successfully
      },
      error: (error) => {
        console.error('Error updating preferences:', error);
      }
    });
  }

  setFilter(filter: 'all' | 'unread'): void {
    this.activeFilter = filter;
    this.currentPage = 1;
    this.loadNotifications();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadNotifications();
    }
  }

  createTestNotification(): void {
    this.notificationApiService.createTestNotification().subscribe({
      next: (response) => {
        console.log('Test notification created:', response);
        this.loadNotifications(); // Reload to show the new notification
      },
      error: (error) => {
        console.error('Error creating test notification:', error);
      }
    });
  }

  // Utility methods
  getNotificationIcon(type: string): string {
    return this.notificationApiService.getNotificationIcon(type);
  }

  getPriorityColor(priority: string): string {
    return this.notificationApiService.getPriorityColor(priority);
  }

  formatRelativeTime(date: Date): string {
    return this.notificationApiService.formatRelativeTime(date);
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'task_due': 'Task Due',
      'task_overdue': 'Overdue',
      'task_assigned': 'Assigned',
      'task_completed': 'Completed',
      'team_invitation': 'Team Invite',
      'team_activity': 'Team Activity',
      'achievement_unlocked': 'Achievement',
      'reminder': 'Reminder',
      'system_update': 'System',
      'deadline_approaching': 'Deadline'
    };
    return labels[type] || 'Notification';
  }

  trackById(index: number, item: Notification): string {
    return item._id;
  }
}