import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  TaskPriority,
  TimeEstimation,
  DailySchedule,
  SchedulingPreferences,
  SmartSuggestion
} from '../models/team.model';

@Injectable({
  providedIn: 'root'
})
export class SmartSchedulingService {
  private apiUrl = '/api/scheduling';

  // Observable streams
  private prioritiesSubject = new BehaviorSubject<TaskPriority[]>([]);
  private scheduleSubject = new BehaviorSubject<DailySchedule | null>(null);
  private suggestionsSubject = new BehaviorSubject<SmartSuggestion[]>([]);

  public priorities$ = this.prioritiesSubject.asObservable();
  public schedule$ = this.scheduleSubject.asObservable();
  public suggestions$ = this.suggestionsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadSmartSuggestions();
  }

  // AI-powered task prioritization
  prioritizeTasks(taskIds: string[]): Observable<TaskPriority[]> {
    return this.http.post<TaskPriority[]>(`${this.apiUrl}/prioritize`, { taskIds })
      .pipe(
        tap(priorities => this.prioritiesSubject.next(priorities))
      );
  }

  // Time estimation for individual tasks
  estimateTaskTime(taskId: string): Observable<TimeEstimation> {
    return this.http.post<TimeEstimation>(`${this.apiUrl}/estimate/${taskId}`, {});
  }

  // Generate optimal daily schedule
  generateSchedule(date: Date, preferences?: Partial<SchedulingPreferences>): Observable<DailySchedule> {
    return this.http.post<DailySchedule>(`${this.apiUrl}/schedule`, {
      date: date.toISOString(),
      preferences
    }).pipe(
      tap(schedule => this.scheduleSubject.next(schedule))
    );
  }

  // Get smart suggestions
  loadSmartSuggestions(): Observable<SmartSuggestion[]> {
    return this.http.get<SmartSuggestion[]>(`${this.apiUrl}/suggestions`)
      .pipe(
        tap(suggestions => this.suggestionsSubject.next(suggestions))
      );
  }

  // Apply a suggestion
  applySuggestion(suggestionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/suggestions/${suggestionId}/apply`, {});
  }

  // Dismiss a suggestion
  dismissSuggestion(suggestionId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/suggestions/${suggestionId}/dismiss`, {});
  }

  // Get current priorities
  getCurrentPriorities(): TaskPriority[] {
    return this.prioritiesSubject.value;
  }

  // Get current schedule
  getCurrentSchedule(): DailySchedule | null {
    return this.scheduleSubject.value;
  }

  // Get current suggestions
  getCurrentSuggestions(): SmartSuggestion[] {
    return this.suggestionsSubject.value;
  }

  // Utility methods
  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  }

  getPriorityIcon(priority: string): string {
    switch (priority) {
      case 'urgent': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  }

  formatTimeEstimate(hours: number): string {
    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    } else if (hours === 1) {
      return '1 heure';
    } else if (hours < 24) {
      return `${Math.round(hours * 10) / 10} heures`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = Math.round(hours % 24 * 10) / 10;
      return `${days}j ${remainingHours}h`;
    }
  }

  getConfidenceColor(confidence: number): string {
    if (confidence >= 0.8) return '#28a745';
    if (confidence >= 0.6) return '#ffc107';
    if (confidence >= 0.4) return '#fd7e14';
    return '#dc3545';
  }

  getConfidenceLabel(confidence: number): string {
    if (confidence >= 0.8) return 'Très fiable';
    if (confidence >= 0.6) return 'Fiable';
    if (confidence >= 0.4) return 'Moyennement fiable';
    return 'Peu fiable';
  }

  // Calculate productivity score based on completed tasks vs planned
  calculateProductivityScore(schedule: DailySchedule): number {
    if (!schedule.slots.length) return 0;

    const completedSlots = schedule.slots.filter(slot =>
      slot.taskId && slot.type === 'work'
    ).length;

    const totalWorkSlots = schedule.slots.filter(slot =>
      slot.type === 'work'
    ).length;

    return totalWorkSlots > 0 ? Math.round((completedSlots / totalWorkSlots) * 100) : 0;
  }

  // Suggest optimal work times based on user patterns
  suggestOptimalTimes(): { startTime: string; endTime: string; breaks: string[] } {
    // This would analyze user's historical productivity patterns
    // For now, return sensible defaults
    return {
      startTime: '09:00',
      endTime: '17:00',
      breaks: ['12:00-13:00', '15:00-15:15']
    };
  }
}