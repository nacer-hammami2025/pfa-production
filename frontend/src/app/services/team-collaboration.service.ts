import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import {
  Team,
  TeamMember,
  SharedTask,
  TaskComment,
  TeamActivity,
  TeamInvitation
} from '../models/team.model';

@Injectable({
  providedIn: 'root'
})
export class TeamCollaborationService {
  private base = '/api';
  private apiUrl = `${this.base}/teams`;

  // BehaviorSubjects for reactive state
  private currentTeamSubject = new BehaviorSubject<Team | null>(null);
  private teamsSubject = new BehaviorSubject<Team[]>([]);
  private teamActivitiesSubject = new BehaviorSubject<TeamActivity[]>([]);

  constructor(private http: HttpClient) {
    this.loadUserTeams();
  }

  // Observable getters
  getCurrentTeam(): Observable<Team | null> {
    return this.currentTeamSubject.asObservable();
  }

  getTeams(): Observable<Team[]> {
    return this.teamsSubject.asObservable();
  }

  getTeamActivities(): Observable<TeamActivity[]> {
    return this.teamActivitiesSubject.asObservable();
  }

  // Team Management
  createTeam(teamData: { name: string; description?: string }): Observable<Team> {
    return this.http.post<Team>(this.apiUrl, teamData).pipe(
      tap(newTeam => {
        const currentTeams = this.teamsSubject.value;
        this.teamsSubject.next([...currentTeams, newTeam]);
      })
    );
  }

  updateTeam(teamId: string, updates: Partial<Team>): Observable<Team> {
    return this.http.put<Team>(`${this.apiUrl}/${teamId}`, updates).pipe(
      tap(updatedTeam => {
        const currentTeams = this.teamsSubject.value;
        const updatedTeams = currentTeams.map(team =>
          team.id === teamId ? updatedTeam : team
        );
        this.teamsSubject.next(updatedTeams);

        if (this.currentTeamSubject.value?.id === teamId) {
          this.currentTeamSubject.next(updatedTeam);
        }
      })
    );
  }

  deleteTeam(teamId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${teamId}`).pipe(
      tap(() => {
        const currentTeams = this.teamsSubject.value;
        const filteredTeams = currentTeams.filter(team => team.id !== teamId);
        this.teamsSubject.next(filteredTeams);

        if (this.currentTeamSubject.value?.id === teamId) {
          this.currentTeamSubject.next(null);
        }
      })
    );
  }

  setCurrentTeam(team: Team | null): void {
    this.currentTeamSubject.next(team);
    if (team) {
      this.loadTeamActivities(team.id);
    } else {
      this.teamActivitiesSubject.next([]);
    }
  }

  // Team Members Management
  inviteMember(teamId: string, email: string, role: 'admin' | 'member' = 'member'): Observable<TeamInvitation> {
    return this.http.post<TeamInvitation>(`${this.apiUrl}/${teamId}/invitations`, { email, role });
  }

  acceptInvitation(invitationId: string): Observable<Team> {
    return this.http.post<Team>(`${this.apiUrl}/invitations/${invitationId}/accept`, {}).pipe(
      tap(team => {
        this.loadUserTeams(); // Reload teams to include the new one
        this.setCurrentTeam(team);
      })
    );
  }

  declineInvitation(invitationId: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/invitations/${invitationId}/decline`, {});
  }

  removeMember(teamId: string, memberId: string): Observable<Team> {
    return this.http.delete<Team>(`${this.apiUrl}/${teamId}/members/${memberId}`).pipe(
      tap(updatedTeam => {
        const currentTeams = this.teamsSubject.value;
        const updatedTeams = currentTeams.map(team =>
          team.id === teamId ? updatedTeam : team
        );
        this.teamsSubject.next(updatedTeams);

        if (this.currentTeamSubject.value?.id === teamId) {
          this.currentTeamSubject.next(updatedTeam);
        }
      })
    );
  }

  updateMemberRole(teamId: string, memberId: string, role: 'admin' | 'member'): Observable<Team> {
    return this.http.put<Team>(`${this.apiUrl}/${teamId}/members/${memberId}`, { role }).pipe(
      tap(updatedTeam => {
        const currentTeams = this.teamsSubject.value;
        const updatedTeams = currentTeams.map(team =>
          team.id === teamId ? updatedTeam : team
        );
        this.teamsSubject.next(updatedTeams);

        if (this.currentTeamSubject.value?.id === teamId) {
          this.currentTeamSubject.next(updatedTeam);
        }
      })
    );
  }

  // Shared Tasks Management
  getTeamTasks(teamId: string, filters?: {
    status?: string;
    assignedTo?: string;
    priority?: string;
  }): Observable<SharedTask[]> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params = params.set(key, value);
      });
    }

    return this.http.get<SharedTask[]>(`${this.apiUrl}/${teamId}/tasks`, { params });
  }

  createSharedTask(teamId: string, taskData: Partial<SharedTask>): Observable<SharedTask> {
    return this.http.post<SharedTask>(`${this.apiUrl}/${teamId}/tasks`, taskData);
  }

  updateSharedTask(teamId: string, taskId: string, updates: Partial<SharedTask>): Observable<SharedTask> {
    return this.http.put<SharedTask>(`${this.apiUrl}/${teamId}/tasks/${taskId}`, updates);
  }

  deleteSharedTask(teamId: string, taskId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${teamId}/tasks/${taskId}`);
  }

  assignTask(teamId: string, taskId: string, assignedTo: string): Observable<SharedTask> {
    return this.http.put<SharedTask>(`${this.apiUrl}/${teamId}/tasks/${taskId}/assign`, { assignedTo });
  }

  // Task Comments
  getTaskComments(taskId: string): Observable<TaskComment[]> {
    return this.http.get<TaskComment[]>(`${this.apiUrl}/tasks/${taskId}/comments`);
  }

  addTaskComment(taskId: string, content: string, mentions: string[] = []): Observable<TaskComment> {
    return this.http.post<TaskComment>(`${this.apiUrl}/tasks/${taskId}/comments`, { content, mentions });
  }

  updateTaskComment(taskId: string, commentId: string, content: string): Observable<TaskComment> {
    return this.http.put<TaskComment>(`${this.apiUrl}/tasks/${taskId}/comments/${commentId}`, { content });
  }

  deleteTaskComment(taskId: string, commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tasks/${taskId}/comments/${commentId}`);
  }

  // Team Activities
  private loadTeamActivities(teamId: string): void {
    this.http.get<TeamActivity[]>(`${this.apiUrl}/${teamId}/activities`)
      .subscribe(activities => {
        this.teamActivitiesSubject.next(activities);
      });
  }

  // Utility methods
  getMemberById(team: Team, userId: string): TeamMember | undefined {
    return team.members.find(member => member.userId === userId);
  }

  canManageTeam(team: Team, userId: string): boolean {
    const member = this.getMemberById(team, userId);
    return member?.role === 'owner' || member?.role === 'admin';
  }

  canManageTask(task: SharedTask, team: Team, userId: string): boolean {
    const member = this.getMemberById(team, userId);
    if (!member) return false;

    // Owners and admins can manage all tasks
    if (member.role === 'owner' || member.role === 'admin') return true;

    // Members can only manage tasks assigned to them
    return task.assignedTo === userId;
  }

  private loadUserTeams(): void {
    this.http.get<Team[]>(this.apiUrl)
      .subscribe(teams => {
        this.teamsSubject.next(teams);
      });
  }

  // Real-time updates (to be implemented with WebSockets/SSE)
  connectToTeamUpdates(teamId: string): void {
    // TODO: Implement WebSocket/SSE connection for real-time updates
    console.log(`Connecting to real-time updates for team ${teamId}`);
  }

  disconnectFromTeamUpdates(): void {
    // TODO: Disconnect from WebSocket/SSE
    console.log('Disconnecting from real-time updates');
  }
}