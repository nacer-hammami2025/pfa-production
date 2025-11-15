import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TimeTrackingService, TimeEntry, ProductivityStats, ActiveTimeEntry } from '../../services/time-tracking.service';
import { TaskService, Task } from '../../services/task.service';

@Component({
  selector: 'app-time-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './time-tracking.component.html',
  styleUrls: ['./time-tracking.component.css']
})
export class TimeTrackingComponent implements OnInit, OnDestroy {
  activeEntry: ActiveTimeEntry | null = null;
  selectedTaskId: string = '';
  description: string = '';
  tasks: Task[] = [];
  timeEntries: TimeEntry[] = [];
  productivityStats: ProductivityStats | null = null;
  isLoading = false;
  selectedPeriod: 'day' | 'week' | 'month' = 'day';

  // Manual entry form
  showManualEntry = false;
  manualTaskId: string = '';
  manualStartTime: string = '';
  manualEndTime: string = '';
  manualDescription: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private timeTrackingService: TimeTrackingService,
    private taskService: TaskService
  ) {}

  ngOnInit(): void {
    this.loadTasks();
    this.loadActiveEntry();
    this.loadTimeEntries();
    this.loadProductivityStats();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadTasks(): void {
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
      }
    });
  }

  loadActiveEntry(): void {
    const sub = this.timeTrackingService.activeEntry$.subscribe({
      next: (entry) => {
        this.activeEntry = entry;
      },
      error: (error) => {
        console.error('Error loading active entry:', error);
      }
    });
    this.subscriptions.push(sub);
  }

  loadTimeEntries(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days

    this.timeTrackingService.getTimeEntries(startDate, endDate).subscribe({
      next: (response) => {
        this.timeEntries = response.entries;
      },
      error: (error) => {
        console.error('Error loading time entries:', error);
      }
    });
  }

  loadProductivityStats(): void {
    this.timeTrackingService.getProductivityStats(new Date(), this.selectedPeriod).subscribe({
      next: (response) => {
        this.productivityStats = response.stats;
      },
      error: (error) => {
        console.error('Error loading productivity stats:', error);
      }
    });
  }

  startTracking(): void {
    if (!this.selectedTaskId) {
      alert('Veuillez sélectionner une tâche');
      return;
    }

    this.isLoading = true;
    this.timeTrackingService.startTracking(this.selectedTaskId, this.description).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.description = '';
        this.selectedTaskId = '';
        // Active entry will be updated via subscription
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error starting time tracking:', error);
        alert('Erreur lors du démarrage du suivi du temps');
      }
    });
  }

  stopTracking(): void {
    if (!this.activeEntry) return;

    this.isLoading = true;
    this.timeTrackingService.stopTracking(this.activeEntry.id).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.loadTimeEntries(); // Refresh entries
        this.loadProductivityStats(); // Refresh stats
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error stopping time tracking:', error);
        alert('Erreur lors de l\'arrêt du suivi du temps');
      }
    });
  }

  createManualEntry(): void {
    if (!this.manualTaskId || !this.manualStartTime || !this.manualEndTime) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    const startTime = new Date(this.manualStartTime);
    const endTime = new Date(this.manualEndTime);

    if (startTime >= endTime) {
      alert('L\'heure de fin doit être après l\'heure de début');
      return;
    }

    this.isLoading = true;
    this.timeTrackingService.createManualEntry(
      this.manualTaskId,
      startTime,
      endTime,
      this.manualDescription
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.showManualEntry = false;
        this.resetManualEntryForm();
        this.loadTimeEntries();
        this.loadProductivityStats();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error creating manual entry:', error);
        alert('Erreur lors de la création de l\'entrée manuelle');
      }
    });
  }

  resetManualEntryForm(): void {
    this.manualTaskId = '';
    this.manualStartTime = '';
    this.manualEndTime = '';
    this.manualDescription = '';
  }

  onPeriodChange(): void {
    this.loadProductivityStats();
  }

  getProductivityInsights(): string[] {
    return this.productivityStats ?
      this.timeTrackingService.getProductivityInsights(this.productivityStats) : [];
  }

  formatElapsedTime(seconds: number): string {
    return this.timeTrackingService.formatElapsedTime(seconds);
  }

  formatDuration(minutes: number): string {
    return this.timeTrackingService.formatDuration(minutes);
  }

  getTaskTitle(taskId: string): string {
    const task = this.tasks.find(t => t._id === taskId);
    return task ? task.title : 'Tâche inconnue';
  }
}
