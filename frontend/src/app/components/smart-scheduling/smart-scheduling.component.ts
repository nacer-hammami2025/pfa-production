import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SmartSchedulingService } from '../../services/smart-scheduling.service';
import { TaskService } from '../../services/task.service';
import { NotificationService } from '../../services/notification.service';
import {
  TaskPriority,
  DailySchedule,
  SmartSuggestion,
  SchedulingPreferences
} from '../../models/team.model';

@Component({
  selector: 'app-smart-scheduling',
  templateUrl: './smart-scheduling.component.html',
  styleUrls: ['./smart-scheduling.component.css']
})
export class SmartSchedulingComponent implements OnInit, OnDestroy {
  // UI State
  activeTab: 'priorities' | 'schedule' | 'suggestions' | 'analytics' = 'priorities';
  selectedDate: Date = new Date();
  isLoading = false;

  // Data
  taskPriorities: TaskPriority[] = [];
  currentSchedule: DailySchedule | null = null;
  smartSuggestions: SmartSuggestion[] = [];
  userTasks: any[] = [];

  // Forms
  preferencesForm: FormGroup;

  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private schedulingService: SmartSchedulingService,
    private taskService: TaskService,
    private notificationService: NotificationService
  ) {
    this.preferencesForm = this.fb.group({
      workStartTime: ['09:00'],
      workEndTime: ['17:00'],
      preferredBreakDuration: [15],
      maxDailyWorkHours: [8],
      preferredTaskDuration: [60]
    });
  }

  ngOnInit(): void {
    this.loadUserTasks();
    this.loadSmartSuggestions();

    // Subscribe to service observables
    this.subscriptions.push(
      this.schedulingService.priorities$.subscribe(priorities => {
        this.taskPriorities = priorities;
      }),
      this.schedulingService.schedule$.subscribe(schedule => {
        this.currentSchedule = schedule;
      }),
      this.schedulingService.suggestions$.subscribe(suggestions => {
        this.smartSuggestions = suggestions;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Tab Management
  setActiveTab(tab: 'priorities' | 'schedule' | 'suggestions' | 'analytics'): void {
    this.activeTab = tab;
  }

  // Data Loading
  loadUserTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.userTasks = tasks;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
      }
    });
  }

  loadSmartSuggestions(): void {
    this.schedulingService.loadSmartSuggestions().subscribe({
      next: (suggestions) => {
        this.smartSuggestions = suggestions;
      },
      error: (error) => {
        console.error('Error loading suggestions:', error);
      }
    });
  }

  // AI Features
  prioritizeAllTasks(): void {
    if (this.userTasks.length === 0) {
      this.notificationService.addNotification({
        type: 'warning',
        title: 'Aucune tâche',
        message: 'Vous n\'avez aucune tâche à prioriser.'
      });
      return;
    }

    this.isLoading = true;
    const taskIds = this.userTasks.map(task => task.id);

    this.schedulingService.prioritizeTasks(taskIds).subscribe({
      next: (priorities) => {
        this.taskPriorities = priorities;
        this.isLoading = false;
        this.notificationService.addNotification({
          type: 'success',
          title: 'Priorisation terminée',
          message: `${priorities.length} tâches ont été analysées et priorisées.`
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de prioriser les tâches.'
        });
      }
    });
  }

  generateSchedule(): void {
    this.isLoading = true;
    const preferences = this.preferencesForm.value;

    this.schedulingService.generateSchedule(this.selectedDate, preferences).subscribe({
      next: (schedule) => {
        this.currentSchedule = schedule;
        this.isLoading = false;
        this.notificationService.addNotification({
          type: 'success',
          title: 'Planning généré',
          message: `Planning optimisé créé pour le ${this.selectedDate.toLocaleDateString('fr-FR')}.`
        });
      },
      error: (error) => {
        this.isLoading = false;
        this.notificationService.addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de générer le planning.'
        });
      }
    });
  }

  refreshSuggestions(): void {
    this.loadSmartSuggestions();
  }

  // Event Handlers
  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedDate = new Date(input.value);
  }

  // Suggestion Actions
  applySuggestion(suggestion: SmartSuggestion): void {
    this.schedulingService.applySuggestion(suggestion.id).subscribe({
      next: () => {
        // Remove from local array
        this.smartSuggestions = this.smartSuggestions.filter(s => s.id !== suggestion.id);
        this.notificationService.addNotification({
          type: 'success',
          title: 'Suggestion appliquée',
          message: 'La suggestion a été appliquée avec succès.'
        });
      },
      error: (error) => {
        this.notificationService.addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible d\'appliquer la suggestion.'
        });
      }
    });
  }

  dismissSuggestion(suggestion: SmartSuggestion): void {
    this.schedulingService.dismissSuggestion(suggestion.id).subscribe({
      next: () => {
        // Remove from local array
        this.smartSuggestions = this.smartSuggestions.filter(s => s.id !== suggestion.id);
        this.notificationService.addNotification({
          type: 'info',
          title: 'Suggestion ignorée',
          message: 'La suggestion a été ignorée.'
        });
      },
      error: (error) => {
        this.notificationService.addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible d\'ignorer la suggestion.'
        });
      }
    });
  }

  // Utility Methods
  getTaskTitle(taskId: string): string {
    const task = this.userTasks.find(t => t.id === taskId);
    return task ? task.title : 'Tâche inconnue';
  }

  getPriorityClass(priority: string): string {
    return `priority-${priority}`;
  }

  getPriorityColor(priority: string): string {
    return this.schedulingService.getPriorityColor(priority);
  }

  getPriorityIcon(priority: string): string {
    return this.schedulingService.getPriorityIcon(priority);
  }

  getSlotClass(slot: any): string {
    return `slot-${slot.type}`;
  }

  getSlotTypeLabel(type: string): string {
    switch (type) {
      case 'work': return 'Travail';
      case 'break': return 'Pause';
      case 'meeting': return 'Réunion';
      case 'personal': return 'Personnel';
      default: return type;
    }
  }

  getSuggestionClass(suggestion: SmartSuggestion): string {
    return `suggestion-${suggestion.type}`;
  }

  getSuggestionIcon(type: string): string {
    switch (type) {
      case 'reschedule': return '📅';
      case 'prioritize': return '⭐';
      case 'break': return '☕';
      case 'focus_time': return '🎯';
      default: return '💡';
    }
  }

  getConfidenceColor(confidence: number): string {
    return this.schedulingService.getConfidenceColor(confidence);
  }

  getConfidenceLabel(confidence: number): string {
    return this.schedulingService.getConfidenceLabel(confidence);
  }

  calculateProductivityScore(schedule: DailySchedule): number {
    return this.schedulingService.calculateProductivityScore(schedule);
  }

  // Utility methods for date/time formatting
  getDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  getFormattedDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('fr-FR', options);
  }

  formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  }
}