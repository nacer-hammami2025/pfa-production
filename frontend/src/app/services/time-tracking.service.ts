import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TimeEntry {
  id: string;
  userId: string;
  taskId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  description?: string;
  isManual: boolean;
  isActive: boolean;
  tags: string[];
  productivity?: number;
  interruptions: number;
  taskTitle?: string;
  category?: string;
}

export interface ProductivityStats {
  totalTimeTracked: number;
  activeTime: number;
  breakTime: number;
  productiveTime: number;
  tasksCompleted: number;
  tasksCreated: number;
  averageTaskCompletionTime: number;
  overallProductivity: number;
  focusScore: number;
  consistencyScore: number;
  workStartTime?: string;
  workEndTime?: string;
  peakProductivityHour?: number;
  totalInterruptions: number;
  averageSessionLength: number;
  dailyGoalMinutes: number;
  goalAchievement: number;
  date: string;
  period: string;
}

export interface ActiveTimeEntry {
  id: string;
  taskId: string;
  taskTitle: string;
  startTime: Date;
  description?: string;
  elapsedTime: number; // in seconds
}

@Injectable({
  providedIn: 'root'
})
export class TimeTrackingService implements OnDestroy {
  private base = '/api';
  private apiUrl = `${this.base}/api/time-tracking`;
  private activeEntrySubject = new BehaviorSubject<ActiveTimeEntry | null>(null);
  private timerSubscription?: Subscription;
  private currentElapsedTime = 0;

  public activeEntry$ = this.activeEntrySubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadActiveEntry();
  }

  // Start time tracking for a task
  startTracking(taskId: string, description?: string, tags?: string[]): Observable<any> {
    const body = { description, tags };
    return this.http.post(`${this.apiUrl}/start/${taskId}`, body).pipe(
      map((response: any) => {
        this.loadActiveEntry();
        return response;
      })
    );
  }

  // Stop current time tracking
  stopTracking(entryId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/stop/${entryId}`, {}).pipe(
      map((response: any) => {
        this.stopTimer();
        this.activeEntrySubject.next(null);
        return response;
      })
    );
  }

  // Get active time entry
  getActiveEntry(): Observable<{ activeEntry: ActiveTimeEntry | null }> {
    return this.http.get<{ activeEntry: ActiveTimeEntry | null }>(`${this.apiUrl}/active`);
  }

  // Load and start tracking active entry
  private loadActiveEntry(): void {
    this.getActiveEntry().subscribe({
      next: (response) => {
        if (response.activeEntry) {
          this.activeEntrySubject.next(response.activeEntry);
          this.startTimer(response.activeEntry.startTime);
        } else {
          this.stopTimer();
          this.activeEntrySubject.next(null);
        }
      },
      error: (error) => {
        console.error('Error loading active entry:', error);
        this.stopTimer();
        this.activeEntrySubject.next(null);
      }
    });
  }

  // Start timer for elapsed time calculation
  private startTimer(startTime: Date): void {
    this.stopTimer(); // Stop any existing timer

    this.currentElapsedTime = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);

    this.timerSubscription = interval(1000).subscribe(() => {
      this.currentElapsedTime++;
      const currentEntry = this.activeEntrySubject.value;
      if (currentEntry) {
        this.activeEntrySubject.next({
          ...currentEntry,
          elapsedTime: this.currentElapsedTime
        });
      }
    });
  }

  // Stop timer
  private stopTimer(): void {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
    this.currentElapsedTime = 0;
  }

  // Get time entries with optional filters
  getTimeEntries(
    startDate?: Date,
    endDate?: Date,
    taskId?: string
  ): Observable<{ entries: TimeEntry[] }> {
    let params = new HttpParams();

    if (startDate) {
      params = params.set('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString());
    }
    if (taskId) {
      params = params.set('taskId', taskId);
    }

    return this.http.get<{ entries: TimeEntry[] }>(`${this.apiUrl}/entries`, { params });
  }

  // Get productivity statistics
  getProductivityStats(date?: Date, period: 'day' | 'week' | 'month' = 'day'): Observable<{ stats: ProductivityStats }> {
    let params = new HttpParams().set('period', period);

    if (date) {
      params = params.set('date', date.toISOString());
    }

    return this.http.get<{ stats: ProductivityStats }>(`${this.apiUrl}/stats`, { params });
  }

  // Create manual time entry
  createManualEntry(
    taskId: string,
    startTime: Date,
    endTime: Date,
    description?: string,
    tags?: string[]
  ): Observable<any> {
    const body = {
      taskId,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      description,
      tags
    };

    return this.http.post(`${this.apiUrl}/manual`, body);
  }

  // Utility methods
  formatElapsedTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  }

  // Get productivity insights
  getProductivityInsights(stats: ProductivityStats): string[] {
    const insights: string[] = [];

    if (stats.overallProductivity >= 80) {
      insights.push("Excellent productivité ! Continuez comme ça !");
    } else if (stats.overallProductivity >= 60) {
      insights.push("Bonne productivité. Quelques optimisations possibles.");
    } else {
      insights.push("Productivité à améliorer. Essayez de réduire les interruptions.");
    }

    if (stats.averageSessionLength > 90) {
      insights.push("Excellentes sessions de travail longues !");
    } else if (stats.averageSessionLength < 25) {
      insights.push("Sessions courtes détectées. Essayez la technique Pomodoro.");
    }

    if (stats.totalInterruptions > 10) {
      insights.push("Nombreuses interruptions. Pensez à activer le mode 'Ne pas déranger'.");
    }

    if (stats.goalAchievement >= 100) {
      insights.push("Objectif quotidien atteint ! Félicitations !");
    } else if (stats.goalAchievement < 50) {
      insights.push(`Objectif à ${stats.goalAchievement.toFixed(0)}%. Continuez vos efforts !`);
    }

    return insights;
  }

  // Cleanup on service destroy
  ngOnDestroy(): void {
    this.stopTimer();
  }
}