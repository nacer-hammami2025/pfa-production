import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { NotificationService } from './notification.service';

export interface PomodoroSession {
  type: 'work' | 'shortBreak' | 'longBreak';
  duration: number; // in minutes
  completed: boolean;
}

export interface PomodoroStats {
  totalSessions: number;
  completedSessions: number;
  totalWorkTime: number; // in minutes
  currentStreak: number;
  longestStreak: number;
}

@Injectable({
  providedIn: 'root'
})
export class PomodoroService {
  private currentSession: PomodoroSession | null = null;
  private timeRemaining = 0; // in seconds
  private isRunning = false;
  private timerSubscription?: Subscription;
  private sessionCount = 0;

  // BehaviorSubjects for reactive state
  private currentSessionSubject = new BehaviorSubject<PomodoroSession | null>(null);
  private timeRemainingSubject = new BehaviorSubject<number>(0);
  private isRunningSubject = new BehaviorSubject<boolean>(false);
  private statsSubject = new BehaviorSubject<PomodoroStats>({
    totalSessions: 0,
    completedSessions: 0,
    totalWorkTime: 0,
    currentStreak: 0,
    longestStreak: 0
  });

  // Default durations in minutes
  private readonly WORK_DURATION = 25;
  private readonly SHORT_BREAK_DURATION = 5;
  private readonly LONG_BREAK_DURATION = 15;
  private readonly SESSIONS_BEFORE_LONG_BREAK = 4;

  constructor(private notificationService: NotificationService) {
    this.loadStats();
  }

  // Observable getters
  getCurrentSession(): Observable<PomodoroSession | null> {
    return this.currentSessionSubject.asObservable();
  }

  getTimeRemaining(): Observable<number> {
    return this.timeRemainingSubject.asObservable();
  }

  getIsRunning(): Observable<boolean> {
    return this.isRunningSubject.asObservable();
  }

  getStats(): Observable<PomodoroStats> {
    return this.statsSubject.asObservable();
  }

  // Control methods
  startWorkSession(): void {
    this.startSession('work', this.WORK_DURATION);
  }

  startShortBreak(): void {
    this.startSession('shortBreak', this.SHORT_BREAK_DURATION);
  }

  startLongBreak(): void {
    this.startSession('longBreak', this.LONG_BREAK_DURATION);
  }

  pauseTimer(): void {
    if (this.isRunning && this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.isRunning = false;
      this.isRunningSubject.next(false);
    }
  }

  resumeTimer(): void {
    if (!this.isRunning && this.currentSession && this.timeRemaining > 0) {
      this.startTimer();
    }
  }

  stopTimer(): void {
    this.pauseTimer();
    this.currentSession = null;
    this.timeRemaining = 0;
    this.currentSessionSubject.next(null);
    this.timeRemainingSubject.next(0);
  }

  resetTimer(): void {
    this.stopTimer();
    this.sessionCount = 0;
  }

  // Private methods
  private startSession(type: 'work' | 'shortBreak' | 'longBreak', duration: number): void {
    this.stopTimer(); // Stop any existing timer

    this.currentSession = {
      type,
      duration,
      completed: false
    };

    this.timeRemaining = duration * 60; // Convert to seconds
    this.currentSessionSubject.next(this.currentSession);
    this.timeRemainingSubject.next(this.timeRemaining);

    this.startTimer();
  }

  private startTimer(): void {
    this.isRunning = true;
    this.isRunningSubject.next(true);

    this.timerSubscription = interval(1000).subscribe(() => {
      this.timeRemaining--;
      this.timeRemainingSubject.next(this.timeRemaining);

      if (this.timeRemaining <= 0) {
        this.completeSession();
      }
    });
  }

  private completeSession(): void {
    if (!this.currentSession) return;

    this.pauseTimer();
    this.currentSession.completed = true;

    // Update stats
    const stats = this.statsSubject.value;
    stats.totalSessions++;

    if (this.currentSession.type === 'work') {
      stats.completedSessions++;
      stats.totalWorkTime += this.currentSession.duration;
      stats.currentStreak++;

      if (stats.currentStreak > stats.longestStreak) {
        stats.longestStreak = stats.currentStreak;
      }
    } else {
      // Reset streak on break completion
      stats.currentStreak = 0;
    }

    this.statsSubject.next(stats);
    this.saveStats();

    // Show notification
    this.showCompletionNotification();

    // Auto-start next session
    this.autoStartNextSession();
  }

  private autoStartNextSession(): void {
    if (!this.currentSession) return;

    if (this.currentSession.type === 'work') {
      this.sessionCount++;
      if (this.sessionCount % this.SESSIONS_BEFORE_LONG_BREAK === 0) {
        this.startLongBreak();
      } else {
        this.startShortBreak();
      }
    } else {
      // After break, start work session
      this.startWorkSession();
    }
  }

  private showCompletionNotification(): void {
    if (!this.currentSession) return;

    const messages = {
      work: {
        title: 'Session de travail terminée !',
        message: 'Prenez une pause bien méritée.'
      },
      shortBreak: {
        title: 'Pause courte terminée !',
        message: 'C\'est l\'heure de se remettre au travail.'
      },
      longBreak: {
        title: 'Pause longue terminée !',
        message: 'Prêt pour une nouvelle session productive.'
      }
    };

    const notification = messages[this.currentSession.type];
    this.notificationService.addNotification({
      type: 'success',
      title: notification.title,
      message: notification.message
    });
  }

  private loadStats(): void {
    const saved = localStorage.getItem('pomodoro-stats');
    if (saved) {
      try {
        const stats = JSON.parse(saved);
        this.statsSubject.next(stats);
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques Pomodoro:', error);
      }
    }
  }

  private saveStats(): void {
    const stats = this.statsSubject.value;
    localStorage.setItem('pomodoro-stats', JSON.stringify(stats));
  }

  // Utility methods
  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getNextSessionType(): 'work' | 'shortBreak' | 'longBreak' {
    if (!this.currentSession) return 'work';

    if (this.currentSession.type === 'work') {
      return (this.sessionCount + 1) % this.SESSIONS_BEFORE_LONG_BREAK === 0
        ? 'longBreak'
        : 'shortBreak';
    } else {
      return 'work';
    }
  }
}