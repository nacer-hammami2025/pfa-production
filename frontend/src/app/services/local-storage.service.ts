import { Injectable } from '@angular/core';

// Simple Task interface for local storage
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'work' | 'personal' | 'shopping' | 'health' | 'education' | 'other';
  dueDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  userId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private readonly TASKS_KEY = 'offline_tasks';
  private readonly TEAMS_KEY = 'offline_teams';
  private readonly USER_DATA_KEY = 'offline_user_data';
  private readonly LAST_SYNC_KEY = 'last_sync_timestamp';

  constructor() {}

  // Tasks operations
  saveTasks(tasks: Task[]): void {
    try {
      localStorage.setItem(this.TASKS_KEY, JSON.stringify(tasks));
    } catch (error) {
      console.error('Failed to save tasks to local storage:', error);
    }
  }

  getTasks(): Task[] {
    try {
      const stored = localStorage.getItem(this.TASKS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load tasks from local storage:', error);
      return [];
    }
  }

  addTask(task: Task): void {
    const tasks = this.getTasks();
    tasks.push(task);
    this.saveTasks(tasks);
  }

  updateTask(taskId: string, updates: Partial<Task>): void {
    const tasks = this.getTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates, updatedAt: new Date() };
      this.saveTasks(tasks);
    }
  }

  deleteTask(taskId: string): void {
    const tasks = this.getTasks().filter(t => t.id !== taskId);
    this.saveTasks(tasks);
  }

  getTask(taskId: string): Task | undefined {
    return this.getTasks().find(t => t.id === taskId);
  }

  // Teams operations (basic implementation)
  saveTeams(teams: any[]): void {
    try {
      localStorage.setItem(this.TEAMS_KEY, JSON.stringify(teams));
    } catch (error) {
      console.error('Failed to save teams to local storage:', error);
    }
  }

  getTeams(): any[] {
    try {
      const stored = localStorage.getItem(this.TEAMS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load teams from local storage:', error);
      return [];
    }
  }

  // User data operations
  saveUserData(userData: any): void {
    try {
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to save user data to local storage:', error);
    }
  }

  getUserData(): any {
    try {
      const stored = localStorage.getItem(this.USER_DATA_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load user data from local storage:', error);
      return null;
    }
  }

  // Sync timestamp operations
  setLastSyncTimestamp(timestamp: Date): void {
    try {
      localStorage.setItem(this.LAST_SYNC_KEY, timestamp.toISOString());
    } catch (error) {
      console.error('Failed to save last sync timestamp:', error);
    }
  }

  getLastSyncTimestamp(): Date | null {
    try {
      const stored = localStorage.getItem(this.LAST_SYNC_KEY);
      return stored ? new Date(stored) : null;
    } catch (error) {
      console.error('Failed to load last sync timestamp:', error);
      return null;
    }
  }

  // Utility methods
  clearAllData(): void {
    localStorage.removeItem(this.TASKS_KEY);
    localStorage.removeItem(this.TEAMS_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
    localStorage.removeItem(this.LAST_SYNC_KEY);
  }

  getStorageSize(): { used: number; available: number } {
    // Estimate storage usage (rough calculation)
    const data = localStorage.getItem(this.TASKS_KEY) || '';
    const teams = localStorage.getItem(this.TEAMS_KEY) || '';
    const userData = localStorage.getItem(this.USER_DATA_KEY) || '';

    const used = (data.length + teams.length + userData.length) * 2; // Rough bytes estimate
    const available = 5 * 1024 * 1024; // Assume 5MB available (typical localStorage limit)

    return { used, available };
  }

  // Data synchronization helpers
  getUnsyncedTasks(): Task[] {
    const tasks = this.getTasks();
    const lastSync = this.getLastSyncTimestamp();

    if (!lastSync) {
      return tasks; // All tasks are unsynced if never synced
    }

    return tasks.filter(task => {
      const taskDate = new Date(task.updatedAt || task.createdAt);
      return taskDate > lastSync;
    });
  }

  markTasksAsSynced(): void {
    this.setLastSyncTimestamp(new Date());
  }

  // Conflict resolution helpers
  detectConflicts(serverTasks: Task[]): { local: Task; server: Task }[] {
    const localTasks = this.getTasks();
    const conflicts: { local: Task; server: Task }[] = [];

    for (const serverTask of serverTasks) {
      const localTask = localTasks.find(t => t.id === serverTask.id);
      if (localTask) {
        const localUpdated = new Date(localTask.updatedAt || localTask.createdAt);
        const serverUpdated = new Date(serverTask.updatedAt || serverTask.createdAt);

        // If both were modified after last sync, there's a conflict
        const lastSync = this.getLastSyncTimestamp();
        if (lastSync && localUpdated > lastSync && serverUpdated > lastSync) {
          conflicts.push({ local: localTask, server: serverTask });
        }
      }
    }

    return conflicts;
  }

  // Merge strategy for conflicts (server wins by default)
  resolveConflict(localTask: Task, serverTask: Task, strategy: 'local' | 'server' | 'merge' = 'server'): Task {
    switch (strategy) {
      case 'local':
        return localTask;
      case 'merge':
        // Simple merge: combine properties, prefer local for certain fields
        return {
          ...serverTask,
          ...localTask,
          // Keep server version for critical fields
          id: serverTask.id,
          createdAt: serverTask.createdAt,
          // Allow local changes for user-editable fields
          title: localTask.title !== serverTask.title ? localTask.title : serverTask.title,
          description: localTask.description !== serverTask.description ? localTask.description : serverTask.description,
          // Merge arrays if needed
          tags: [...new Set([...(serverTask.tags || []), ...(localTask.tags || [])])],
          // Take the most recent update
          updatedAt: new Date(Math.max(
            new Date(localTask.updatedAt || 0).getTime(),
            new Date(serverTask.updatedAt || 0).getTime()
          ))
        };
      case 'server':
      default:
        return serverTask;
    }
  }
}