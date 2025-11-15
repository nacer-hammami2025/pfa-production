import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { PomodoroService, PomodoroSession, PomodoroStats } from '../../services/pomodoro.service';

@Component({
  selector: 'app-pomodoro',
  templateUrl: './pomodoro.component.html',
  styleUrls: ['./pomodoro.component.css']
})
export class PomodoroComponent implements OnInit, OnDestroy {
  currentSession: PomodoroSession | null = null;
  timeRemaining = 0;
  isRunning = false;
  stats: PomodoroStats | null = null;

  private subscriptions: Subscription[] = [];

  constructor(private pomodoroService: PomodoroService) {}

  ngOnInit(): void {
    // Subscribe to session changes
    this.subscriptions.push(
      this.pomodoroService.getCurrentSession().subscribe(session => {
        this.currentSession = session;
      })
    );

    // Subscribe to time remaining changes
    this.subscriptions.push(
      this.pomodoroService.getTimeRemaining().subscribe(time => {
        this.timeRemaining = time;
      })
    );

    // Subscribe to running state changes
    this.subscriptions.push(
      this.pomodoroService.getIsRunning().subscribe(running => {
        this.isRunning = running;
      })
    );

    // Subscribe to stats changes
    this.subscriptions.push(
      this.pomodoroService.getStats().subscribe(stats => {
        this.stats = stats;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Control methods
  startWorkSession(): void {
    this.pomodoroService.startWorkSession();
  }

  startShortBreak(): void {
    this.pomodoroService.startShortBreak();
  }

  startLongBreak(): void {
    this.pomodoroService.startLongBreak();
  }

  pauseTimer(): void {
    this.pomodoroService.pauseTimer();
  }

  resumeTimer(): void {
    this.pomodoroService.resumeTimer();
  }

  stopTimer(): void {
    this.pomodoroService.stopTimer();
  }

  // Utility methods
  getSessionTitle(): string {
    if (!this.currentSession) return '';

    const titles = {
      work: 'Session de Travail',
      shortBreak: 'Pause Courte',
      longBreak: 'Pause Longue'
    };

    return titles[this.currentSession.type];
  }

  getSessionTypeText(): string {
    if (!this.currentSession) return '';

    const texts = {
      work: 'Travail',
      shortBreak: 'Pause',
      longBreak: 'Pause Longue'
    };

    return texts[this.currentSession.type];
  }

  getNextSessionTitle(): string {
    const nextType = this.pomodoroService.getNextSessionType();
    const titles = {
      work: 'Travail (25min)',
      shortBreak: 'Pause Courte (5min)',
      longBreak: 'Pause Longue (15min)'
    };

    return titles[nextType];
  }

  formatTime(seconds: number): string {
    return this.pomodoroService.formatTime(seconds);
  }

  getProgressDashArray(): string {
    if (!this.currentSession) return '0 565.48';

    const totalDuration = this.currentSession.duration * 60;
    const elapsed = totalDuration - this.timeRemaining;
    const progress = elapsed / totalDuration;
    const circumference = 2 * Math.PI * 90; // 90 is the radius
    const dashLength = progress * circumference;
    const gapLength = circumference - dashLength;

    return `${dashLength} ${gapLength}`;
  }
}