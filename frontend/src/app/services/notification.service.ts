import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'motivation' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority?: 'low' | 'medium' | 'high';
  category?: 'task' | 'productivity' | 'motivation' | 'reminder';
  action?: {
    label: string;
    callback: () => void;
  };
  autoHide?: boolean;
  persistent?: boolean;
}

export interface SmartNotificationSettings {
  enableOverdueReminders: boolean;
  enableDueSoonReminders: boolean;
  enableMotivationalMessages: boolean;
  enableProductivityTips: boolean;
  enableContextualReminders: boolean;
  enablePomodoroReminders: boolean;
  reminderFrequency: 'low' | 'medium' | 'high'; // Fréquence des rappels
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  private notificationId = 0;

  // Paramètres de notifications intelligentes
  private settings: SmartNotificationSettings = {
    enableOverdueReminders: true,
    enableDueSoonReminders: true,
    enableMotivationalMessages: true,
    enableProductivityTips: false,
    enableContextualReminders: true,
    enablePomodoroReminders: true,
    reminderFrequency: 'medium',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  };

  // État interne pour éviter les notifications répétées
  private lastMotivationalMessage = 0;
  private lastProductivityTip = 0;
  private notifiedTasks = new Set<string>();

  constructor() {
    // Ne pas initialiser automatiquement - sera fait après connexion
  }

  // Méthode pour initialiser les notifications intelligentes après connexion
  initializeSmartNotifications(): void {
    this.loadSettings();
    this.startSmartNotifications();
  }

  getNotifications(): Observable<Notification[]> {
    return this.notifications.asObservable();
  }

  getUnreadCount(): Observable<number> {
    return this.notifications.pipe(
      map(notifications => notifications.filter(n => !n.read).length)
    );
  }

  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    // Vérifier les heures calmes
    if (this.isQuietHour() && notification.priority !== 'high') {
      return; // Ne pas afficher les notifications non prioritaires pendant les heures calmes
    }

    const newNotification: Notification = {
      id: (++this.notificationId).toString(),
      timestamp: new Date(),
      read: false,
      ...notification,
      priority: notification.priority || 'medium',
      category: notification.category || 'task',
      autoHide: notification.autoHide !== false, // Par défaut true
      persistent: notification.persistent || false
    };

    const currentNotifications = this.notifications.getValue();
    this.notifications.next([newNotification, ...currentNotifications]);

    // Auto-remove selon le type et les paramètres
    if (newNotification.autoHide && !newNotification.persistent) {
      const delay = this.getAutoHideDelay(newNotification.type);
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, delay);
    }
  }

  private getAutoHideDelay(type: Notification['type']): number {
    switch (type) {
      case 'success':
        return 5000; // 5 secondes
      case 'motivation':
      case 'reminder':
        return 10000; // 10 secondes
      case 'info':
        return 8000; // 8 secondes
      case 'warning':
      case 'error':
        return 0; // Ne pas auto-cacher les warnings/errors
      default:
        return 7000; // 7 secondes par défaut
    }
  }

  markAsRead(id: string): void {
    const current = this.notifications.value;
    const updated = current.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    this.notifications.next(updated);
  }

  markAllAsRead(): void {
    const current = this.notifications.value;
    const updated = current.map(n => ({ ...n, read: true }));
    this.notifications.next(updated);
  }

  removeNotification(id: string): void {
    const current = this.notifications.value;
    this.notifications.next(current.filter(n => n.id !== id));
  }

  clearAll(): void {
    this.notifications.next([]);
  }

  // Méthodes spécifiques pour les tâches
  notifyTaskCreated(title: string): void {
    this.addNotification({
      type: 'success',
      title: 'Tâche créée',
      message: `La tâche "${title}" a été créée avec succès.`
    });
  }

  notifyTaskCompleted(title: string): void {
    this.addNotification({
      type: 'success',
      title: 'Tâche terminée',
      message: `Félicitations ! Vous avez terminé "${title}".`
    });
  }

  notifyTaskDeleted(title: string): void {
    this.addNotification({
      type: 'info',
      title: 'Tâche supprimée',
      message: `La tâche "${title}" a été supprimée.`
    });
  }

  notifyTaskOverdue(title: string, dueDate: string): void {
    this.addNotification({
      type: 'warning',
      title: 'Tâche en retard',
      message: `La tâche "${title}" était due le ${dueDate}.`,
      action: {
        label: 'Marquer comme faite',
        callback: () => {
          // Cette callback sera définie dans le composant
          console.log('Marquer tâche comme faite:', title);
        }
      }
    });
  }

  notifyTaskDueSoon(title: string, dueDate: string): void {
    this.addNotification({
      type: 'info',
      title: 'Échéance proche',
      message: `La tâche "${title}" est due le ${dueDate}.`
    });
  }

  // Method to check for overdue tasks - called from outside to avoid circular dependency
  checkOverdueTasks(tasks: any[]): void {
    try {
      const now = new Date();
      const overdueTasks = tasks.filter((task: any) =>
        task.dueDate && new Date(task.dueDate) < now && !task.completed
      );

      overdueTasks.forEach((task: any) => {
        // Vérifier si on n'a pas déjà notifié pour cette tâche récemment
        const existingNotification = this.notifications.value.find(n =>
          n.title === 'Tâche en retard' &&
          n.message.includes(task.title) &&
          // Ne pas renotifier dans l'heure
          new Date().getTime() - new Date(n.timestamp).getTime() < 3600000
        );

        if (!existingNotification) {
          this.notifyTaskOverdue(task.title, task.dueDate!);
        }
      });
    } catch (error) {
      console.error('Erreur lors de la vérification des tâches en retard:', error);
    }
  }

  // Method to start overdue task monitoring - to be called from a component
  startOverdueTaskMonitoring(taskService: any): void {
    timer(0, 60000).pipe(
      switchMap(() => {
        // Vérifier si l'utilisateur est toujours connecté avant de faire l'appel
        const token = localStorage.getItem('pfa_token');
        if (!token) {
          console.log('Pas de token, arrêt du monitoring des tâches');
          return [];
        }
        return taskService.getTasks({ completed: false });
      })
    ).subscribe(
      (tasks: any) => {
        if (Array.isArray(tasks)) {
          this.checkOverdueTasks(tasks);
        }
      },
      (error: any) => {
        console.error('Erreur lors de la vérification des tâches en retard:', error);
      }
    );
  }

  // === NOUVELLES MÉTHODES POUR LES NOTIFICATIONS INTELLIGENTES ===

  // Gestion des paramètres
  getSettings(): SmartNotificationSettings {
    return { ...this.settings };
  }

  updateSettings(newSettings: Partial<SmartNotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('notification_settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres de notification:', error);
    }
  }

  private saveSettings(): void {
    try {
      localStorage.setItem('notification_settings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres de notification:', error);
    }
  }

  // Démarrage des notifications intelligentes
  private startSmartNotifications(): void {
    // Vérifications horaires pour les messages contextuels
    timer(0, 3600000).subscribe(() => { // Toutes les heures
      if (this.settings.enableContextualReminders && !this.isQuietHour()) {
        this.sendContextualReminder();
      }
    });

    // Messages de motivation quotidiens
    timer(0, 86400000).subscribe(() => { // Tous les jours
      if (this.settings.enableMotivationalMessages && !this.isQuietHour()) {
        this.sendMotivationalMessage();
      }
    });

    // Conseils de productivité hebdomadaires
    timer(0, 604800000).subscribe(() => { // Toutes les semaines
      if (this.settings.enableProductivityTips && !this.isQuietHour()) {
        this.sendProductivityTip();
      }
    });
  }

  // Vérifier si c'est l'heure calme
  private isQuietHour(): boolean {
    if (!this.settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const [startHour, startMin] = this.settings.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.settings.quietHours.end.split(':').map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Cas où l'heure calme traverse minuit
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Messages contextuels selon l'heure
  private sendContextualReminder(): void {
    const hour = new Date().getHours();
    let message = '';

    if (hour >= 6 && hour < 12) {
      message = 'Bonjour ! C\'est le moment idéal pour planifier votre journée et attaquer vos tâches prioritaires.';
    } else if (hour >= 12 && hour < 14) {
      message = 'Pause déjeuner ! Profitez-en pour recharger vos batteries avant de continuer.';
    } else if (hour >= 14 && hour < 18) {
      message = 'L\'après-midi bat son plein ! Continuez sur votre lancée avec les tâches restantes.';
    } else if (hour >= 18 && hour < 22) {
      message = 'Soirée productive ! Vérifiez vos tâches pour demain et célébrez vos accomplissements.';
    } else if (hour >= 22 || hour < 6) {
      message = 'Il se fait tard. Pensez à vous reposer pour être en forme demain !';
    }

    if (message) {
      this.addNotification({
        type: 'reminder',
        category: 'reminder',
        priority: 'low',
        title: 'Rappel Contextuel',
        message,
        autoHide: true
      });
    }
  }

  // Messages d'accès administrateur
  showAccessDeniedMessage(): void {
    this.addNotification({
      type: 'warning',
      title: '🛡️ Accès Restreint',
      message: 'Vous n\'avez pas les privilèges administrateur nécessaires pour accéder à cette section.',
      category: 'task',
      priority: 'high',
      persistent: true
    });
  }

  showProfessionalAccessMessage(): void {
    this.addNotification({
      type: 'info',
      title: '👑 Autorisation Administrateur Requise',
      message: 'Cette fonctionnalité est réservée aux utilisateurs disposant de privilèges administrateur. Contactez votre administrateur système si vous pensez qu\'il s\'agit d\'une erreur.',
      category: 'task',
      priority: 'high',
      persistent: true,
      action: {
        label: 'Contacter Admin',
        callback: () => window.location.href = 'mailto:admin@taskflow.com?subject=Demande accès administrateur'
      }
    });
  }

  // Messages de motivation
  private sendMotivationalMessage(): void {
    const now = Date.now();
    if (now - this.lastMotivationalMessage < 86400000) return; // Max 1 par jour

    const messages = [
      'Chaque petite victoire compte ! Continuez comme ça ! 💪',
      'Vous êtes capable de grandes choses. Croyez en vous ! 🌟',
      'La persévérance est la clé du succès. Vous y êtes presque ! 🎯',
      'Chaque tâche complétée vous rapproche de vos objectifs ! 🚀',
      'Vous avez le pouvoir de changer votre journée. Commencez maintenant ! ⚡',
      'Petit pas par petit pas, vous avancez vers le succès ! 👣',
      'Votre effort d\'aujourd\'hui sera votre succès de demain ! 📈'
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    this.addNotification({
      type: 'motivation',
      category: 'motivation',
      priority: 'medium',
      title: 'Motivation du Jour',
      message: randomMessage,
      autoHide: true
    });

    this.lastMotivationalMessage = now;
  }

  // Conseils de productivité
  private sendProductivityTip(): void {
    const now = Date.now();
    if (now - this.lastProductivityTip < 604800000) return; // Max 1 par semaine

    const tips = [
      'Essayez la technique Pomodoro : 25 minutes de travail intense suivi d\'une pause de 5 minutes.',
      'Priorisez vos tâches avec la matrice Eisenhower : Urgent/Important, Important/Non urgent, etc.',
      'Regroupez les tâches similaires pour maintenir votre focus et réduire le changement de contexte.',
      'Commencez votre journée par votre tâche la plus importante (la "grenouille").',
      'Prenez 10 minutes chaque soir pour planifier le lendemain.',
      'Utilisez la règle des 2 minutes : si une tâche prend moins de 2 minutes, faites-la immédiatement.',
      'Fixez-vous des objectifs SMART : Spécifiques, Mesurables, Atteignables, Réalistes, Temporels.'
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    this.addNotification({
      type: 'info',
      category: 'productivity',
      priority: 'medium',
      title: 'Conseil de Productivité',
      message: randomTip,
      autoHide: false
    });

    this.lastProductivityTip = now;
  }

  // Notifications pour les tâches importantes
  notifyImportantTask(task: any): void {
    if (!this.settings.enableDueSoonReminders) return;

    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilDue > 0 && hoursUntilDue <= 24 && task.priority === 'urgent') {
      this.addNotification({
        type: 'warning',
        category: 'task',
        priority: 'high',
        title: 'Tâche Prioritaire Urgente',
        message: `"${task.title}" doit être terminée dans les ${Math.ceil(hoursUntilDue)} prochaines heures.`,
        action: {
          label: 'Voir la tâche',
          callback: () => {
            // Callback à définir dans le composant
            console.log('Voir tâche importante:', task.title);
          }
        }
      });
    }
  }

  // Rappels Pomodoro
  notifyPomodoroBreak(): void {
    if (!this.settings.enablePomodoroReminders) return;

    this.addNotification({
      type: 'reminder',
      category: 'reminder',
      priority: 'medium',
      title: 'Pause Pomodoro',
      message: 'Il est temps de prendre une pause de 5 minutes ! Étirez-vous et détendez-vous. 🧘‍♀️',
      autoHide: true
    });
  }

  notifyPomodoroResume(): void {
    if (!this.settings.enablePomodoroReminders) return;

    this.addNotification({
      type: 'reminder',
      category: 'reminder',
      priority: 'medium',
      title: 'Reprise du Travail',
      message: 'Pause terminée ! Retour au travail avec énergie ! 💪',
      autoHide: true
    });
  }

  // Notification de série (streak)
  notifyStreakAchieved(streakDays: number): void {
    if (streakDays >= 3) { // Notifier seulement pour les séries de 3 jours ou plus
      this.addNotification({
        type: 'motivation',
        category: 'motivation',
        priority: 'high',
        title: 'Série Impressionnante ! 🔥',
        message: `Félicitations ! Vous maintenez une série de ${streakDays} jours consécutifs. Continuez comme ça !`,
        autoHide: false
      });
    }
  }

  // Notification de productivité exceptionnelle
  notifyProductivityMilestone(tasksCompleted: number, period: string): void {
    this.addNotification({
      type: 'motivation',
      category: 'productivity',
      priority: 'high',
      title: 'Jalon de Productivité Atteint ! 🏆',
      message: `Bravo ! Vous avez complété ${tasksCompleted} tâches cette ${period}. Vous êtes unstoppable !`,
      autoHide: false
    });
  }

  // Vérification intelligente des tâches
  checkSmartTaskNotifications(tasks: any[]): void {
    if (!Array.isArray(tasks)) return;

    const now = new Date();

    tasks.forEach(task => {
      const taskId = task._id || task.id;
      if (this.notifiedTasks.has(taskId)) return;

      // Tâches en retard
      if (task.dueDate && new Date(task.dueDate) < now && !task.completed) {
        if (this.settings.enableOverdueReminders) {
          this.notifyTaskOverdue(task.title, task.dueDate);
          this.notifiedTasks.add(taskId);
        }
      }

      // Tâches arrivant à échéance bientôt
      else if (task.dueDate && !task.completed) {
        const dueDate = new Date(task.dueDate);
        const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
          if (this.settings.enableDueSoonReminders) {
            this.notifyTaskDueSoon(task.title, task.dueDate);
            this.notifiedTasks.add(taskId);
          }
        }
      }

      // Tâches importantes
      if (task.priority === 'urgent' || task.priority === 'high') {
        this.notifyImportantTask(task);
      }
    });
  }

  // Nettoyer les tâches notifiées (appelée périodiquement)
  clearNotifiedTasks(): void {
    // Garder seulement les tâches notifiées dans les dernières 24h
    // Cette méthode pourrait être étendue pour nettoyer les anciennes notifications
  }
}