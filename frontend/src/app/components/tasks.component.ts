import { Component, OnInit } from '@angular/core';
import { TaskService, Task, Priority, Category, CreateTaskDTO, UpdateTaskDTO, TaskStats } from '../services/task.service';

@Component({
  selector: 'app-tasks',
  template: `
    <div class="tasks-dashboard">
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-content">
          <h1 class="page-title">📋 Task Management Dashboard</h1>
          <p class="page-subtitle">Organize, prioritize, and conquer your tasks</p>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-section">
        <div class="stat-card total">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.total }}</div>
            <div class="stat-label">Total Tasks</div>
          </div>
        </div>
        <div class="stat-card completed">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.completed }}</div>
            <div class="stat-label">Completed</div>
          </div>
        </div>
        <div class="stat-card pending">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.pending }}</div>
            <div class="stat-label">Pending</div>
          </div>
        </div>
        <div class="stat-card progress">
          <div class="stat-icon">🎯</div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.completionRate }}%</div>
            <div class="stat-label">Completion Rate</div>
          </div>
        </div>
      </div>

      <!-- Add Task Section -->
      <div class="add-task-section">
        <div class="section-header">
          <h2>➕ Create New Task</h2>
        </div>
        <form (ngSubmit)="addTask()" #taskForm="ngForm" class="task-form">
          <div class="form-row">
            <div class="form-group">
              <label>Task Title *</label>
              <input
                type="text"
                [(ngModel)]="newTask.title"
                name="title"
                required
                class="form-input"
                placeholder="Enter task title..."
              />
            </div>
            <div class="form-group">
              <label>Priority</label>
              <select [(ngModel)]="newTask.priority" name="priority" class="form-input">
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🔴 High</option>
                <option value="urgent">🟣 Urgent</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Category</label>
              <select [(ngModel)]="newTask.category" name="category" class="form-input">
                <option value="work">💼 Work</option>
                <option value="personal">👤 Personal</option>
                <option value="shopping">🛒 Shopping</option>
                <option value="health">🏥 Health</option>
                <option value="education">📚 Education</option>
                <option value="other">📌 Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Due Date</label>
              <input
                type="date"
                [(ngModel)]="newTask.dueDate"
                name="dueDate"
                class="form-input"
              />
            </div>
          </div>

          <div class="form-group full">
            <label>Description</label>
            <textarea
              [(ngModel)]="newTask.description"
              name="description"
              class="form-input"
              placeholder="Add task description..."
              rows="3"
            ></textarea>
          </div>

          <button type="submit" class="btn btn-primary" [disabled]="!taskForm.valid || isAdding">
            {{ isAdding ? '⏳ Adding...' : '✨ Add Task' }}
          </button>
        </form>
      </div>

      <!-- Filters and View Options -->
      <div class="filters-section">
        <div class="section-header">
          <h2>🔍 Tasks</h2>
          <div class="filter-controls">
            <select [(ngModel)]="filterPriority" (change)="filterTasks()" class="filter-select">
              <option value="">All Priorities</option>
              <option value="urgent">🟣 Urgent</option>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>

            <select [(ngModel)]="filterCategory" (change)="filterTasks()" class="filter-select">
              <option value="">All Categories</option>
              <option value="work">💼 Work</option>
              <option value="personal">👤 Personal</option>
              <option value="shopping">🛒 Shopping</option>
              <option value="health">🏥 Health</option>
              <option value="education">📚 Education</option>
              <option value="other">📌 Other</option>
            </select>

            <select [(ngModel)]="viewMode" class="filter-select">
              <option value="list">📋 List View</option>
              <option value="grid">🔲 Grid View</option>
            </select>
          </div>
        </div>

        <!-- Task Count -->
        <div class="task-count">
          Showing {{ filteredTasks.length }} of {{ tasks.length }} tasks
        </div>
      </div>

      <!-- Tasks List/Grid -->
      <div [ngSwitch]="viewMode" class="tasks-container">
        <!-- List View -->
        <div *ngSwitchCase="'list'" class="tasks-list">
          <div *ngIf="filteredTasks.length === 0" class="empty-state">
            <div class="empty-icon">🎯</div>
            <h3>No tasks found</h3>
            <p>Create your first task to get started!</p>
          </div>

          <div *ngFor="let task of filteredTasks" class="task-item" [class.completed]="task.completed">
            <div class="task-checkbox">
              <input
                type="checkbox"
                [(ngModel)]="task.completed"
                (change)="updateTask(task)"
                class="checkbox"
              />
            </div>
            <div class="task-content">
              <div class="task-header">
                <h3 class="task-title" [class.done]="task.completed">{{ task.title }}</h3>
                <span class="priority-badge" [class]="task.priority">
                  {{ getPriorityEmoji(task.priority) }}
                </span>
              </div>
              <p class="task-description" *ngIf="task.description">{{ task.description }}</p>
              <div class="task-meta">
                <span class="meta-item">
                  {{ taskService.getCategoryIcon(task.category) }} {{ task.category }}
                </span>
                <span class="meta-item" *ngIf="task.dueDate">
                  📅 {{ task.dueDate | date: 'MMM dd, yyyy' }}
                </span>
              </div>
            </div>
            <div class="task-actions">
              <button (click)="deleteTask(task._id)" class="btn btn-delete" title="Delete">
                🗑️
              </button>
            </div>
          </div>
        </div>

        <!-- Grid View -->
        <div *ngSwitchCase="'grid'" class="tasks-grid">
          <div *ngIf="filteredTasks.length === 0" class="empty-state">
            <div class="empty-icon">🎯</div>
            <h3>No tasks found</h3>
            <p>Create your first task to get started!</p>
          </div>

          <div *ngFor="let task of filteredTasks" class="task-card" [class.completed]="task.completed">
            <div class="card-header">
              <input
                type="checkbox"
                [(ngModel)]="task.completed"
                (change)="updateTask(task)"
                class="checkbox"
              />
              <span class="priority-badge" [class]="task.priority">
                {{ getPriorityEmoji(task.priority) }}
              </span>
            </div>
            <h3 class="card-title" [class.done]="task.completed">{{ task.title }}</h3>
            <p class="card-description" *ngIf="task.description">{{ task.description }}</p>
            <div class="card-meta">
              <span class="meta-item">
                {{ taskService.getCategoryIcon(task.category) }} {{ task.category }}
              </span>
              <span class="meta-item" *ngIf="task.dueDate">
                📅 {{ task.dueDate | date: 'MMM dd' }}
              </span>
            </div>
            <button (click)="deleteTask(task._id)" class="btn btn-delete-card">🗑️ Delete</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tasks-dashboard {
      min-height: 100vh;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 2rem;
    }

    .hero-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem 2rem;
      border-radius: 20px;
      margin-bottom: 3rem;
      text-align: center;
      box-shadow: 0 10px 40px rgba(102, 126, 234, 0.3);
    }

    .page-title {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
    }

    .page-subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
      margin: 0;
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .stat-card {
      background: white;
      border-radius: 15px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: #2c3e50;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #6c757d;
      margin-top: 0.3rem;
    }

    .stat-card.total { border-left: 4px solid #667eea; }
    .stat-card.completed { border-left: 4px solid #27ae60; }
    .stat-card.pending { border-left: 4px solid #f39c12; }
    .stat-card.progress { border-left: 4px solid #e74c3c; }

    .add-task-section {
      background: white;
      border-radius: 15px;
      padding: 2rem;
      margin-bottom: 3rem;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .section-header h2 {
      font-size: 1.3rem;
      color: #2c3e50;
      margin: 0;
    }

    .task-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
    }

    .form-group.full {
      grid-column: 1 / -1;
    }

    .form-group label {
      font-size: 0.9rem;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .form-input {
      padding: 0.8rem;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s ease;
      font-family: inherit;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    textarea.form-input {
      resize: vertical;
      min-height: 80px;
    }

    .btn {
      padding: 0.8rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: linear-gradient(45deg, #667eea, #764ba2);
      color: white;
      width: 100%;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-delete {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      font-size: 1.2rem;
      transition: transform 0.2s ease;
    }

    .btn-delete:hover {
      transform: scale(1.2);
    }

    .btn-delete-card {
      background: #e74c3c;
      color: white;
      width: 100%;
      margin-top: 1rem;
    }

    .btn-delete-card:hover {
      background: #c0392b;
    }

    .filters-section {
      background: white;
      border-radius: 15px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
    }

    .filter-controls {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .filter-select {
      padding: 0.6rem 1rem;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      background: white;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }

    .filter-select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .task-count {
      color: #6c757d;
      font-size: 0.9rem;
      margin-top: 1rem;
    }

    .tasks-container {
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .task-item {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      border-left: 4px solid #667eea;
    }

    .task-item:hover {
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
      transform: translateX(5px);
    }

    .task-item.completed {
      opacity: 0.7;
      background: #f8f9fa;
      border-left-color: #27ae60;
    }

    .task-checkbox {
      margin-top: 0.2rem;
    }

    .checkbox {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }

    .task-content {
      flex: 1;
    }

    .task-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .task-title {
      margin: 0;
      color: #2c3e50;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .task-title.done {
      text-decoration: line-through;
      color: #6c757d;
    }

    .task-description {
      color: #6c757d;
      margin: 0.5rem 0;
      font-size: 0.95rem;
    }

    .priority-badge {
      padding: 0.3rem 0.8rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .priority-badge.high {
      background: #e74c3c;
      color: white;
    }

    .priority-badge.medium {
      background: #f39c12;
      color: white;
    }

    .priority-badge.low {
      background: #27ae60;
      color: white;
    }

    .priority-badge.urgent {
      background: #8e44ad;
      color: white;
    }

    .task-meta {
      display: flex;
      gap: 1rem;
      margin-top: 0.8rem;
      font-size: 0.9rem;
      color: #6c757d;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    .tasks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
    }

    .task-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      display: flex;
      flex-direction: column;
    }

    .task-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.15);
    }

    .task-card.completed {
      opacity: 0.7;
      background: #f8f9fa;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .card-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #2c3e50;
      margin: 0 0 0.5rem 0;
      line-height: 1.3;
    }

    .card-title.done {
      text-decoration: line-through;
      color: #6c757d;
    }

    .card-description {
      color: #6c757d;
      font-size: 0.9rem;
      margin: 0 0 1rem 0;
      flex: 1;
    }

    .card-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      margin-bottom: 1rem;
      font-size: 0.85rem;
      color: #6c757d;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
    }

    .empty-state p {
      margin: 0;
      color: #6c757d;
    }

    @media (max-width: 768px) {
      .tasks-dashboard {
        padding: 1rem;
      }

      .page-title {
        font-size: 1.8rem;
      }

      .stats-section {
        grid-template-columns: 1fr 1fr;
      }

      .tasks-grid {
        grid-template-columns: 1fr;
      }

      .filter-controls {
        flex-direction: column;
      }

      .filter-select {
        width: 100%;
      }
    }
  `]
})
export class TasksComponent implements OnInit {
  tasks: Task[] = [];
  filteredTasks: Task[] = [];
  stats: TaskStats = {
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
    byCategory: { work: 0, personal: 0, shopping: 0, health: 0, education: 0, other: 0 },
    completionRate: 0
  };
  filterPriority = '';
  filterCategory = '';
  viewMode = 'list';
  isAdding = false;

  newTask: CreateTaskDTO = {
    title: '',
    description: '',
    priority: 'medium' as Priority,
    category: 'other' as Category,
    dueDate: '',
    tags: []
  };

  constructor(public taskService: TaskService) {}

  ngOnInit() {
    this.loadTasks();
    this.loadStats();
  }

  loadTasks() {
    this.taskService.getTasks().subscribe(
      (data: Task[]) => {
        this.tasks = data;
        this.filterTasks();
      },
      (error: any) => console.error('Error loading tasks:', error)
    );
  }

  loadStats() {
    this.taskService.getTaskStats().subscribe(
      (data: TaskStats) => {
        this.stats = data;
      },
      (error: any) => console.error('Error loading stats:', error)
    );
  }

  addTask() {
    if (!this.newTask.title.trim()) return;

    this.isAdding = true;
    this.taskService.createTask(this.newTask).subscribe(
      () => {
        this.resetForm();
        this.loadTasks();
        this.loadStats();
        this.isAdding = false;
      },
      (error: any) => {
        console.error('Error adding task:', error);
        this.isAdding = false;
      }
    );
  }

  updateTask(task: Task) {
    const updates: UpdateTaskDTO = { completed: task.completed };
    this.taskService.updateTask(task._id, updates).subscribe(
      () => {
        this.loadStats();
      },
      (error: any) => console.error('Error updating task:', error)
    );
  }

  deleteTask(id: string) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    this.taskService.deleteTask(id).subscribe(
      () => {
        this.loadTasks();
        this.loadStats();
      },
      (error: any) => {
        console.error('Error deleting task:', error);
        alert('Failed to delete task. Please try again.');
      }
    );
  }

  filterTasks() {
    this.filteredTasks = this.tasks.filter(task => {
      const priorityMatch = !this.filterPriority || task.priority === this.filterPriority;
      const categoryMatch = !this.filterCategory || task.category === this.filterCategory;
      return priorityMatch && categoryMatch;
    });
  }

  resetForm() {
    this.newTask = {
      title: '',
      description: '',
      priority: 'medium' as Priority,
      category: 'other' as Category,
      dueDate: '',
      tags: []
    };
  }

  getPriorityEmoji(priority: Priority): string {
    const emojis: { [key in Priority]: string } = {
      high: '',
      medium: '',
      low: '',
      urgent: ''
    };
    return emojis[priority] || '';
  }
}
