import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { NotificationService } from './notification.service';
import { GamificationService } from './gamification.service';
import { IntegrationsService } from './integrations.service';
import { OfflineService, PendingOperation } from './offline.service';
import { LocalStorageService } from './local-storage.service';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type Category = 'work' | 'personal' | 'shopping' | 'health' | 'education' | 'other';

export interface Task {
  _id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: Priority;
  category: Category;
  dueDate?: string;
  tags: string[];
  owner: string;
  createdAt: string;
  updatedAt: string;
  subtasks?: Subtask[];
  comments?: Comment[];
  attachments?: Attachment[];
}

export interface Subtask {
  _id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface Comment {
  _id: string;
  text: string;
  author: { _id: string; name: string; email: string };
  createdAt: string;
}

export interface Attachment {
  _id: string;
  filename: string;
  url: string;
  size?: number;
  mimetype?: string;
  uploadedAt: string;
}

export interface CreateTaskDTO {
  title: string;
  description: string;
  priority?: Priority;
  category?: Category;
  dueDate?: string;
  tags?: string[];
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: Priority;
  category?: Category;
  dueDate?: string;
  tags?: string[];
}

export interface TaskFilters {
  completed?: boolean;
  priority?: Priority;
  category?: Category;
  search?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  tags?: string[];
}

export interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  byPriority: { [key in Priority]: number };
  byCategory: { [key in Category]: number };
  completionRate: number;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly base = '/api';

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private gamificationService: GamificationService,
    private integrationsService: IntegrationsService,
    private offlineService: OfflineService,
    private localStorageService: LocalStorageService
  ) {}

  getOverdueTasks(): Observable<Task[]> {
    // This is a simplified implementation. In a real app, you'd likely have a specific API endpoint.
    return this.getTasks().pipe(
      map(tasks => tasks.filter(task => !task.completed && task.dueDate && new Date(task.dueDate) < new Date()))
    );
  }

  getTasks(filters?: TaskFilters): Observable<Task[]> {
    if (!this.offlineService.canMakeRequest()) {
      // Return local data when offline
      const localTasks = this.localStorageService.getTasks().map(localTask =>
        this.convertFromLocalTask(localTask)
      );
      let filteredTasks = localTasks;

      // Apply filters locally
      if (filters) {
        filteredTasks = this.applyLocalFilters(filteredTasks, filters);
      }

      return of(filteredTasks);
    }

    // Online mode - fetch from server
    let params = new HttpParams();

    if (filters) {
      if (filters.completed !== undefined) params = params.set('completed', filters.completed.toString());
      if (filters.priority) params = params.set('priority', filters.priority);
      if (filters.category) params = params.set('category', filters.category);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.dueDateFrom) params = params.set('dueDateFrom', filters.dueDateFrom);
      if (filters.dueDateTo) params = params.set('dueDateTo', filters.dueDateTo);
      if (filters.tags && filters.tags.length > 0) {
        filters.tags.forEach(tag => {
          params = params.append('tags', tag);
        });
      }
    }

    return this.http.get<Task[]>(`${this.base}/tasks`, { params }).pipe(
      tap(tasks => {
        // Cache tasks locally for offline use
        this.localStorageService.saveTasks(tasks.map(task => this.convertToLocalTask(task)));
      }),
      catchError(this.handleError)
    );
  }

  getTask(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.base}/tasks/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  createTask(task: CreateTaskDTO): Observable<Task> {
    console.log('📝 TaskService.createTask appelée avec:', task);
    // Set defaults if not provided
    const taskData = {
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'medium',
      category: task.category || 'other',
      dueDate: task.dueDate || null,
      tags: task.tags || []
    };

    console.log('📤 Envoi de la requête HTTP POST avec:', taskData);

    return this.http.post<Task>(`${this.base}/tasks`, taskData).pipe(
      tap(createdTask => {
        console.log('✅ Tâche créée côté backend:', createdTask);
        this.notificationService.notifyTaskCreated(createdTask.title);
        // Update gamification for task creation
        this.gamificationService.taskCreated(createdTask).subscribe();
        // Auto-sync with connected integrations
        this.integrationsService.autoSyncNewTask(createdTask);
      }),
      catchError(error => {
        console.error('❌ Erreur lors de la création de tâche:', error);
        return this.handleError(error);
      })
    );
  }

  updateTask(id: string, updates: UpdateTaskDTO): Observable<Task> {
    return this.http.put<Task>(`${this.base}/tasks/${id}`, updates).pipe(
      catchError(this.handleError)
    );
  }

  toggleTaskCompleted(id: string): Observable<Task> {
    return this.getTask(id).pipe(
      switchMap((task: Task) => this.updateTask(id, { completed: !task.completed })),
      tap(updatedTask => {
        if (updatedTask.completed) {
          this.notificationService.notifyTaskCompleted(updatedTask.title);
          // Update gamification for task completion
          this.gamificationService.taskCompleted(updatedTask).subscribe();
          // Auto-sync with connected integrations
          this.integrationsService.autoSyncCompletedTask(updatedTask);
        }
      }),
      catchError(this.handleError)
    );
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/tasks/${id}`).pipe(
      tap(() => {
        // Since we can't get the task title after deletion, we'll use a generic message
        this.notificationService.notifyTaskDeleted('Task');
      }),
      catchError(this.handleError)
    );
  }

  getTaskStats(): Observable<TaskStats> {
    return this.http.get<TaskStats>(`${this.base}/tasks/stats`).pipe(
      catchError(this.handleError)
    );
  }

  exportTasks(filters?: TaskFilters): Observable<Blob> {
    let params = new HttpParams();

    if (filters) {
      if (filters.completed !== undefined) params = params.set('completed', filters.completed.toString());
      if (filters.priority) params = params.set('priority', filters.priority);
      if (filters.category) params = params.set('category', filters.category);
      if (filters.search) params = params.set('search', filters.search);
      if (filters.dueDateFrom) params = params.set('dueDateFrom', filters.dueDateFrom);
      if (filters.dueDateTo) params = params.set('dueDateTo', filters.dueDateTo);
      if (filters.tags && filters.tags.length > 0) {
        filters.tags.forEach(tag => {
          params = params.append('tags', tag);
        });
      }
    }

    return this.http.get(`${this.base}/tasks/export`, {
      params,
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Subtasks
  addSubtask(taskId: string, title: string): Observable<Task> {
    return this.http.post<Task>(`${this.base}/tasks/${taskId}/subtasks`, { title }).pipe(
      catchError(this.handleError)
    );
  }

  updateSubtask(taskId: string, subtaskId: string, data: { title?: string; completed?: boolean }): Observable<Task> {
    return this.http.put<Task>(`${this.base}/tasks/${taskId}/subtasks/${subtaskId}`, data).pipe(
      catchError(this.handleError)
    );
  }

  deleteSubtask(taskId: string, subtaskId: string): Observable<Task> {
    return this.http.delete<Task>(`${this.base}/tasks/${taskId}/subtasks/${subtaskId}`).pipe(
      catchError(this.handleError)
    );
  }

  // Comments
  addComment(taskId: string, text: string): Observable<Task> {
    return this.http.post<Task>(`${this.base}/tasks/${taskId}/comments`, { text }).pipe(
      catchError(this.handleError)
    );
  }

  deleteComment(taskId: string, commentId: string): Observable<Task> {
    return this.http.delete<Task>(`${this.base}/tasks/${taskId}/comments/${commentId}`).pipe(
      catchError(this.handleError)
    );
  }

  // Attachments
  addAttachment(taskId: string, attachment: { filename: string; url: string; size?: number; mimetype?: string }): Observable<Task> {
    return this.http.post<Task>(`${this.base}/tasks/${taskId}/attachments`, attachment).pipe(
      catchError(this.handleError)
    );
  }

  deleteAttachment(taskId: string, attachmentId: string): Observable<Task> {
    return this.http.delete<Task>(`${this.base}/tasks/${taskId}/attachments/${attachmentId}`).pipe(
      catchError(this.handleError)
    );
  }

  getCategories(): Category[] {
    return ['work', 'personal', 'shopping', 'health', 'education', 'other'];
  }

  getPriorities(): Priority[] {
    return ['low', 'medium', 'high', 'urgent'];
  }

  getPriorityColor(priority: Priority): string {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      urgent: '#dc3545'
    };
    return colors[priority];
  }

  getCategoryIcon(category: Category): string {
    const icons = {
      work: '💼',
      personal: '👤',
      shopping: '🛒',
      health: '🏥',
      education: '📚',
      other: '📌'
    };
    return icons[category];
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.completed) return false;
    return new Date(task.dueDate) < new Date();
  }

  getDaysUntilDue(task: Task): number | null {
    if (!task.dueDate || task.completed) return null;
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private applyLocalFilters(tasks: Task[], filters: TaskFilters): Task[] {
    return tasks.filter(task => {
      if (filters.completed !== undefined && task.completed !== filters.completed) {
        return false;
      }
      if (filters.priority && task.priority !== filters.priority) {
        return false;
      }
      if (filters.category && task.category !== filters.category) {
        return false;
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (!task.title.toLowerCase().includes(searchLower) &&
            !(task.description && task.description.toLowerCase().includes(searchLower))) {
          return false;
        }
      }
      if (filters.dueDateFrom) {
        const dueDate = new Date(task.dueDate || '');
        const fromDate = new Date(filters.dueDateFrom);
        if (dueDate < fromDate) {
          return false;
        }
      }
      if (filters.dueDateTo) {
        const dueDate = new Date(task.dueDate || '');
        const toDate = new Date(filters.dueDateTo);
        if (dueDate > toDate) {
          return false;
        }
      }
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(tag =>
          task.tags.some(taskTag => taskTag.toLowerCase().includes(tag.toLowerCase()))
        );
        if (!hasMatchingTag) {
          return false;
        }
      }
      return true;
    });
  }

  private convertToLocalTask(task: Task): any {
    return {
      id: task._id,
      title: task.title,
      description: task.description,
      completed: task.completed,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      tags: task.tags,
      createdAt: new Date(task.createdAt),
      updatedAt: new Date(task.updatedAt),
      userId: task.owner
    };
  }

  private convertFromLocalTask(localTask: any): Task {
    return {
      _id: localTask.id,
      title: localTask.title,
      description: localTask.description || '',
      completed: localTask.completed,
      priority: localTask.priority,
      category: localTask.category,
      dueDate: localTask.dueDate ? localTask.dueDate.toISOString() : undefined,
      tags: localTask.tags,
      owner: localTask.userId || '',
      createdAt: localTask.createdAt.toISOString(),
      updatedAt: localTask.updatedAt.toISOString()
    };
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = error.error.message;
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error('TaskService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
