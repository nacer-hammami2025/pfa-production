import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type ProjectStatus = 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Milestone {
  _id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  owner: { _id: string; name: string; email: string };
  members: { _id: string; name: string; email: string }[];
  tasks: any[];
  milestones: Milestone[];
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate: string;
  endDate?: string;
  progress: number;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
  members?: string[];
  startDate?: string;
  endDate?: string;
  priority?: ProjectPriority;
  color?: string;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  progress: number;
  totalMilestones: number;
  completedMilestones: number;
  members: number;
}

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly base = '/api/projects';

  constructor(private http: HttpClient) {}

  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(this.base);
  }

  getProject(id: string): Observable<Project> {
    return this.http.get<Project>(`${this.base}/${id}`);
  }

  createProject(data: CreateProjectDTO): Observable<Project> {
    return this.http.post<Project>(this.base, data);
  }

  updateProject(id: string, data: Partial<Project>): Observable<Project> {
    return this.http.put<Project>(`${this.base}/${id}`, data);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  // Milestones
  addMilestone(projectId: string, milestone: { title: string; description?: string; dueDate?: string }): Observable<Project> {
    return this.http.post<Project>(`${this.base}/${projectId}/milestones`, milestone);
  }

  updateMilestone(projectId: string, milestoneId: string, data: Partial<Milestone>): Observable<Project> {
    return this.http.put<Project>(`${this.base}/${projectId}/milestones/${milestoneId}`, data);
  }

  deleteMilestone(projectId: string, milestoneId: string): Observable<Project> {
    return this.http.delete<Project>(`${this.base}/${projectId}/milestones/${milestoneId}`);
  }

  // Tasks
  addTask(projectId: string, task: any): Observable<any> {
    return this.http.post(`${this.base}/${projectId}/tasks`, task);
  }

  // Stats
  getProjectStats(projectId: string): Observable<ProjectStats> {
    return this.http.get<ProjectStats>(`${this.base}/${projectId}/stats`);
  }

  getStatusColor(status: ProjectStatus): string {
    const colors = {
      planning: '#a0aec0',
      active: '#48bb78',
      'on-hold': '#ed8936',
      completed: '#4299e1',
      archived: '#718096'
    };
    return colors[status] || '#a0aec0';
  }

  getPriorityColor(priority: ProjectPriority): string {
    const colors = {
      low: '#48bb78',
      medium: '#ed8936',
      high: '#f56565',
      critical: '#9f1239'
    };
    return colors[priority] || '#a0aec0';
  }
}
