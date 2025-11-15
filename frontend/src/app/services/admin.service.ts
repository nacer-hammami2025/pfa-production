import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, shareReplay, tap, catchError } from 'rxjs/operators';

export interface AdminDashboardSummary {
  totals: {
    users: number;
    admins: number;
    activeUsers: number;
    teams: number;
    teamMembers: number;
    tasks: number;
    completedTasks: number;
    pendingTasks: number;
  };
  weeklyStats: {
    registrations: number[];
    tasksCreated: number[];
  };
  weeklyActivity: {
    labels: string[];
    data: number[];
  };
  recentUsers: AdminUser[]; // Utilisation de l'interface AdminUser existante
  recentTeams: AdminTeam[]; // Utilisation de l'interface AdminTeam existante
}

export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  lastLogin?: string;
}

export interface AdminTeam {
  _id: string;
  name: string;
  description?: string;
  owner?: { _id: string; name: string; email: string; role: string } | null;
  members?: Array<{
    user?: { _id: string; name: string; email: string; role: string } | null;
    role: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface RoleCapability {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface RolePermissionConfig {
  _id: string;
  role: 'user' | 'admin';
  permissions: RoleCapability[];
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private baseUrl = '/api/admin'; // Use relative path for proxy
  
  // Cache pour optimiser les performances
  private dashboardCache$: Observable<AdminDashboardSummary> | null = null;
  private usersCache$: Observable<AdminUser[]> | null = null;
  private teamsCache$: Observable<AdminTeam[]> | null = null;
  private cacheTimeout = 60000; // 1 minute

  constructor(private http: HttpClient) {}

  getDashboardSummary(forceRefresh: boolean = false): Observable<AdminDashboardSummary> {
    if (!forceRefresh && this.dashboardCache$) {
      return this.dashboardCache$;
    }
    
    this.dashboardCache$ = this.http.get<AdminDashboardSummary>(`${this.baseUrl}/dashboard-summary`).pipe(
      map((data: any) => ({
        totals: data.totals,
        weeklyStats: {
          registrations: data.weeklyStats?.registrations || [0, 0, 0, 0, 0, 0, 0],
          tasksCreated: data.weeklyStats?.tasksCreated || [0, 0, 0, 0, 0, 0, 0]
        },
        weeklyActivity: {
          labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
          data: data.weeklyStats?.tasksCompleted || [0, 0, 0, 0, 0, 0, 0]
        },
        recentUsers: data.recentUsers || [],
        recentTeams: data.recentTeams || []
      })),
      shareReplay({ bufferSize: 1, refCount: true }),
      tap(() => {
        // Invalider le cache après le timeout
        setTimeout(() => {
          this.dashboardCache$ = null;
        }, this.cacheTimeout);
      }),
      catchError(err => {
        this.dashboardCache$ = null;
        throw err;
      })
    );
    
    return this.dashboardCache$;
  }

  getUsers(): Observable<AdminUser[]> {
    if (this.usersCache$) {
      return this.usersCache$;
    }
    
    this.usersCache$ = this.http.get<AdminUser[]>(`${this.baseUrl}/users`).pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
      tap(() => {
        setTimeout(() => {
          this.usersCache$ = null;
        }, this.cacheTimeout);
      }),
      catchError(err => {
        this.usersCache$ = null;
        throw err;
      })
    );
    
    return this.usersCache$;
  }

  getAllUsers(): Observable<AdminUser[]> {
    return this.getUsers();
  }

  createUser(payload: { name: string; email: string; password: string; role: 'user' | 'admin' }): Observable<AdminUser> {
    // Invalider le cache lors de la création
    this.usersCache$ = null;
    return this.http.post<AdminUser>(`${this.baseUrl}/users`, payload);
  }

  updateUser(id: string, payload: Partial<Pick<AdminUser, 'name' | 'email' | 'role'>>): Observable<AdminUser> {
    // Invalider le cache lors de la mise à jour
    this.usersCache$ = null;
    return this.http.patch<AdminUser>(`${this.baseUrl}/users/${id}`, payload);
  }

  deleteUser(id: string): Observable<{ message: string }> {
    // Invalider le cache lors de la suppression
    this.usersCache$ = null;
    return this.http.delete<{ message: string }>(`${this.baseUrl}/users/${id}`);
  }

  getTeams(): Observable<AdminTeam[]> {
    if (this.teamsCache$) {
      return this.teamsCache$;
    }
    
    this.teamsCache$ = this.http.get<AdminTeam[]>(`${this.baseUrl}/teams`).pipe(
      shareReplay({ bufferSize: 1, refCount: true }),
      tap(() => {
        setTimeout(() => {
          this.teamsCache$ = null;
        }, this.cacheTimeout);
      }),
      catchError(err => {
        this.teamsCache$ = null;
        throw err;
      })
    );
    
    return this.teamsCache$;
  }

  getAllTeams(): Observable<AdminTeam[]> {
    return this.getTeams();
  }

  createTeam(payload: { name: string; description?: string; ownerId?: string; memberIds?: string[] }): Observable<AdminTeam> {
    // Invalider le cache lors de la création
    this.teamsCache$ = null;
    return this.http.post<AdminTeam>(`${this.baseUrl}/teams`, payload);
  }

  updateTeam(
    id: string,
    payload: { name?: string; description?: string; ownerId?: string; memberIds?: string[] }
  ): Observable<AdminTeam> {
    // Invalider le cache lors de la mise à jour
    this.teamsCache$ = null;
    return this.http.patch<AdminTeam>(`${this.baseUrl}/teams/${id}`, payload);
  }

  deleteTeam(id: string): Observable<{ message: string }> {
    // Invalider le cache lors de la suppression
    this.teamsCache$ = null;
    return this.http.delete<{ message: string }>(`${this.baseUrl}/teams/${id}`);
  }

  addTeamMember(teamId: string, userId: string): Observable<AdminTeam> {
    // Invalider le cache lors de l'ajout d'un membre
    this.teamsCache$ = null;
    return this.http.post<AdminTeam>(`${this.baseUrl}/teams/${teamId}/members`, { userId });
  }

  removeTeamMember(teamId: string, userId: string): Observable<AdminTeam> {
    // Invalider le cache lors du retrait d'un membre
    this.teamsCache$ = null;
    return this.http.delete<AdminTeam>(`${this.baseUrl}/teams/${teamId}/members/${userId}`);
  }

  getRolePermissions(): Observable<RolePermissionConfig[]> {
    return this.http.get<RolePermissionConfig[]>(`${this.baseUrl}/permissions`);
  }

  updateRolePermissions(role: 'user' | 'admin', permissions: RoleCapability[]): Observable<RolePermissionConfig> {
    return this.http.patch<RolePermissionConfig>(`${this.baseUrl}/permissions/${role}`, { permissions });
  }
}
