import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer, map } from 'rxjs';
import { TaskService, Task } from './task.service';
import { AIService } from './ai.service';

export interface SmartNotification {
  id: string;
  type: 'deadline' | 'reminder' | 'achievement' | 'suggestion' | 'break' | 'overdue';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timestamp: Date;
  actionable: boolean;
  actionLabel?: string;
  actionCallback?: () => void;
  dismissible: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  icon?: string;
  category?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SmartNotificationService {
  private notificationsSubject = new BehaviorSubject<SmartNotification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private notificationQueue: SmartNotification[] = [];
  private maxNotifications = 5;

  constructor(
    private taskService: TaskService,
    private aiService: AIService
  ) {
    this.initializeSmartNotifications();
  }

  private initializeSmartNotifications(): void {
    // Check for notifications every minute
    timer(0, 60000).subscribe(() => {
      this.checkForNotifications();
    });

    // Listen for task changes
    this.taskService.getTasks().subscribe(tasks => {
      this.analyzeTasksForNotifications(tasks);
    });
  }

  private checkForNotifications(): void {
    const now = new Date();

    // Deadline reminders (24h, 1h, 15min before)
    this.checkDeadlineReminders(now);

    // Break reminders (every 2 hours of continuous work)
    this.checkBreakReminders(now);

    // Achievement notifications
    this.checkAchievements();

    // Overdue task alerts
    this.checkOverdueTasks(now);

    // Smart suggestions based on time patterns
    this.checkTimeBasedSuggestions(now);
  }

  private checkDeadlineReminders(now: Date): void {
    this.taskService.getTasks().subscribe(tasks => {
      const pendingTasks = tasks.filter(t => !t.completed);

      pendingTasks.forEach(task => {
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          const timeDiff = dueDate.getTime() - now.getTime();
          const hoursDiff = timeDiff / (1000 * 60 * 60);

          let notification: SmartNotification | null = null;

          if (hoursDiff <= 24 && hoursDiff > 23) {
            // 24 hours reminder
            notification = {
              id: `deadline-24h-${task._id}`,
              type: 'deadline',
              title: 'Échéance dans 24h',
              message: `"${task.title}" arrive à échéance demain`,
              priority: 'medium',
              timestamp: now,
              actionable: true,
              actionLabel: 'Voir la tâche',
              dismissible: true,
              icon: 'icon-clock',
              category: 'deadline'
            };
          } else if (hoursDiff <= 1 && hoursDiff > 0) {
            // 1 hour reminder
            notification = {
              id: `deadline-1h-${task._id}`,
              type: 'deadline',
              title: 'Échéance imminente',
              message: `"${task.title}" arrive à échéance dans moins d'une heure`,
              priority: 'high',
              timestamp: now,
              actionable: true,
              actionLabel: 'Marquer comme fait',
              dismissible: true,
              icon: 'icon-alert-triangle',
              category: 'deadline'
            };
          } else if (hoursDiff <= 0.25 && hoursDiff > 0) {
            // 15 minutes reminder
            notification = {
              id: `deadline-15m-${task._id}`,
              type: 'deadline',
              title: 'Échéance critique',
              message: `"${task.title}" arrive à échéance dans 15 minutes !`,
              priority: 'urgent',
              timestamp: now,
              actionable: true,
              actionLabel: 'Marquer comme fait',
              dismissible: false,
              autoHide: false,
              icon: 'icon-alert-circle',
              category: 'deadline'
            };
          }

          if (notification && !this.notificationExists(notification.id)) {
            this.addNotification(notification);
          }
        }
      });
    });
  }

  private checkBreakReminders(now: Date): void {
    // Track work sessions and suggest breaks
    const lastBreakTime = localStorage.getItem('last-break-time');
    if (lastBreakTime) {
      const lastBreak = new Date(lastBreakTime);
      const hoursSinceBreak = (now.getTime() - lastBreak.getTime()) / (1000 * 60 * 60);

      if (hoursSinceBreak >= 2) {
        const notification: SmartNotification = {
          id: 'break-reminder',
          type: 'break',
          title: 'Pause recommandée',
          message: `Cela fait ${Math.round(hoursSinceBreak)}h que vous travaillez. Prenez une pause de 5-10 minutes.`,
          priority: 'medium',
          timestamp: now,
          actionable: true,
          actionLabel: 'Marquer pause',
          dismissible: true,
          autoHide: true,
          autoHideDelay: 300000, // 5 minutes
          icon: 'icon-coffee',
          category: 'wellness'
        };

        if (!this.notificationExists(notification.id)) {
          this.addNotification(notification);
        }
      }
    }
  }

  private checkAchievements(): void {
    this.taskService.getTasks().subscribe(tasks => {
      const completedToday = tasks.filter(t =>
        t.completed && this.isToday(new Date(t.updatedAt))
      ).length;

      // Daily achievement
      if (completedToday === 5) {
        this.addAchievementNotification('Première tâche du jour !', 'Vous avez complété votre 5ème tâche aujourd\'hui.');
      } else if (completedToday === 10) {
        this.addAchievementNotification('Demi-douzaine !', '10 tâches complétées aujourd\'hui. Excellent travail !');
      } else if (completedToday === 15) {
        this.addAchievementNotification('Champion du jour !', '15 tâches complétées ! Vous êtes unstoppable.');
      }

      // Streak achievements
      const streak = this.calculateStreak(tasks);
      if (streak === 7) {
        this.addAchievementNotification('Semaine parfaite !', '7 jours consécutifs de productivité !');
      } else if (streak === 30) {
        this.addAchievementNotification('Mois légendaire !', '30 jours consécutifs ! Vous êtes une légende.');
      }
    });
  }

  private checkOverdueTasks(now: Date): void {
    this.taskService.getTasks().subscribe(tasks => {
      const overdueTasks = tasks.filter(t =>
        !t.completed && t.dueDate && new Date(t.dueDate) < now
      );

      if (overdueTasks.length > 0) {
        const notification: SmartNotification = {
          id: 'overdue-alert',
          type: 'overdue',
          title: `${overdueTasks.length} tâche(s) en retard`,
          message: `Vous avez ${overdueTasks.length} tâche(s) dépassée(s). Priorisez-les maintenant.`,
          priority: 'urgent',
          timestamp: now,
          actionable: true,
          actionLabel: 'Voir les tâches',
          dismissible: false,
          icon: 'icon-alert-circle',
          category: 'overdue'
        };

        if (!this.notificationExists(notification.id)) {
          this.addNotification(notification);
        }
      }
    });
  }

  private checkTimeBasedSuggestions(now: Date): void {
    const hour = now.getHours();

    // Morning productivity boost
    if (hour === 9) {
      const notification: SmartNotification = {
        id: 'morning-boost',
        type: 'suggestion',
        title: 'Boost matinal',
        message: 'C\'est le moment idéal pour attaquer vos tâches prioritaires !',
        priority: 'low',
        timestamp: now,
        actionable: false,
        dismissible: true,
        autoHide: true,
        autoHideDelay: 1800000, // 30 minutes
        icon: 'icon-sun',
        category: 'motivation'
      };

      if (!this.notificationExists(notification.id)) {
        this.addNotification(notification);
      }
    }

    // End of day review
    if (hour === 17) {
      const notification: SmartNotification = {
        id: 'end-of-day-review',
        type: 'suggestion',
        title: 'Revue de fin de journée',
        message: 'Prenez 5 minutes pour planifier demain et célébrer vos accomplissements.',
        priority: 'low',
        timestamp: now,
        actionable: true,
        actionLabel: 'Planifier demain',
        dismissible: true,
        icon: 'icon-calendar',
        category: 'planning'
      };

      if (!this.notificationExists(notification.id)) {
        this.addNotification(notification);
      }
    }
  }

  private analyzeTasksForNotifications(tasks: Task[]): void {
    // AI-powered notifications based on task analysis
    this.aiService.generateTaskSuggestions(tasks).subscribe(suggestions => {
      suggestions.forEach(suggestion => {
        if (suggestion.confidence > 0.8) {
          const notification: SmartNotification = {
            id: `ai-suggestion-${suggestion.id}`,
            type: 'suggestion',
            title: suggestion.title,
            message: suggestion.description,
            priority: suggestion.priority,
            timestamp: new Date(),
            actionable: suggestion.actionable,
            actionLabel: 'Appliquer',
            dismissible: true,
            icon: this.getSuggestionIcon(suggestion.type),
            category: 'ai'
          };

          if (!this.notificationExists(notification.id)) {
            this.addNotification(notification);
          }
        }
      });
    });
  }

  private addAchievementNotification(title: string, message: string): void {
    const notification: SmartNotification = {
      id: `achievement-${Date.now()}`,
      type: 'achievement',
      title,
      message,
      priority: 'low',
      timestamp: new Date(),
      actionable: false,
      dismissible: true,
      autoHide: true,
      autoHideDelay: 10000, // 10 seconds
      icon: 'icon-trophy',
      category: 'achievement'
    };

    this.addNotification(notification);
  }

  private addNotification(notification: SmartNotification): void {
    this.notificationQueue.unshift(notification);

    // Keep only the most recent notifications
    if (this.notificationQueue.length > this.maxNotifications) {
      this.notificationQueue = this.notificationQueue.slice(0, this.maxNotifications);
    }

    this.notificationsSubject.next([...this.notificationQueue]);

    // Auto-hide if configured
    if (notification.autoHide && notification.autoHideDelay) {
      setTimeout(() => {
        this.dismissNotification(notification.id);
      }, notification.autoHideDelay);
    }
  }

  dismissNotification(notificationId: string): void {
    this.notificationQueue = this.notificationQueue.filter(n => n.id !== notificationId);
    this.notificationsSubject.next([...this.notificationQueue]);
  }

  executeNotificationAction(notificationId: string): void {
    const notification = this.notificationQueue.find(n => n.id === notificationId);
    if (notification?.actionCallback) {
      notification.actionCallback();
      this.dismissNotification(notificationId);
    }
  }

  clearAllNotifications(): void {
    this.notificationQueue = [];
    this.notificationsSubject.next([]);
  }

  getNotificationCount(): Observable<number> {
    return this.notifications$.pipe(
      // Use map instead of pluck for newer RxJS
      map(notifications => notifications.length)
    );
  }

  private notificationExists(id: string): boolean {
    return this.notificationQueue.some(n => n.id === id);
  }

  private calculateStreak(tasks: Task[]): number {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const completedOnDate = tasks.some(t =>
        t.completed && this.isSameDay(new Date(t.updatedAt), date)
      );

      if (completedOnDate) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }

  private getSuggestionIcon(type: string): string {
    const icons = {
      task: 'icon-plus-circle',
      improvement: 'icon-trending-up',
      reminder: 'icon-bell',
      optimization: 'icon-settings'
    };
    return icons[type as keyof typeof icons] || 'icon-lightbulb';
  }

  // Public methods for external interaction
  markBreakTaken(): void {
    localStorage.setItem('last-break-time', new Date().toISOString());
    this.dismissNotification('break-reminder');
  }

  scheduleReminder(title: string, message: string, delayMinutes: number): void {
    setTimeout(() => {
      const notification: SmartNotification = {
        id: `scheduled-${Date.now()}`,
        type: 'reminder',
        title,
        message,
        priority: 'medium',
        timestamp: new Date(),
        actionable: false,
        dismissible: true,
        icon: 'icon-bell',
        category: 'scheduled'
      };
      this.addNotification(notification);
    }, delayMinutes * 60 * 1000);
  }
}