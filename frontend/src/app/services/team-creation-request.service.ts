import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export interface TeamCreationRequest {
  _id: string;
  requester: {
    _id: string;
    username: string;
    email: string;
  };
  teamName: string;
  teamDescription?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: {
    _id: string;
    username: string;
    email: string;
  };
  reviewComment?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamRequestData {
  teamName: string;
  teamDescription?: string;
}

export interface ReviewTeamRequestData {
  action: 'approve' | 'reject';
  reviewComment?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TeamCreationRequestService {
  private apiUrl = '/api/team-creation-requests';
  private requestsSubject = new BehaviorSubject<TeamCreationRequest[]>([]);
  public requests$ = this.requestsSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Create a new team creation request
  createRequest(requestData: CreateTeamRequestData): Observable<{ message: string; request: TeamCreationRequest }> {
    return this.http.post<{ message: string; request: TeamCreationRequest }>(`${this.apiUrl}/request`, requestData)
      .pipe(
        tap(response => {
          console.log('✅ Demande créée:', response);
        }),
        catchError(error => {
          console.error('❌ Erreur création demande:', error);
          return throwError(() => error);
        })
      );
  }

  // Get all team creation requests (admin only)
  getRequests(status?: string, page: number = 1, limit: number = 10): Observable<{
    requests: TeamCreationRequest[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    }
  }> {
    const params: any = { page, limit };
    if (status) params.status = status;

    return this.http.get<{
      requests: TeamCreationRequest[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      }
    }>(`${this.apiUrl}/requests`, { params }).pipe(
      tap(response => this.requestsSubject.next(response.requests))
    );
  }

  // Get user's own team creation requests
  getMyRequests(): Observable<TeamCreationRequest[]> {
    return this.http.get<TeamCreationRequest[]>(`${this.apiUrl}/my-requests`);
  }

  // Get a specific team creation request
  getRequest(id: string): Observable<TeamCreationRequest> {
    return this.http.get<TeamCreationRequest>(`${this.apiUrl}/requests/${id}`);
  }

  // Approve or reject a team creation request (admin only)
  reviewRequest(id: string, reviewData: ReviewTeamRequestData): Observable<{
    message: string;
    request: TeamCreationRequest;
    team?: any;
  }> {
    return this.http.put<{
      message: string;
      request: TeamCreationRequest;
      team?: any;
    }>(`${this.apiUrl}/requests/${id}`, reviewData).pipe(
      tap(() => {
        // Refresh the requests list after review
        this.refreshRequests();
      })
    );
  }

  // Refresh the requests list
  private refreshRequests(): void {
    this.getRequests().subscribe();
  }

  // Get pending requests count (for admin dashboard)
  getPendingRequestsCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/requests/count?status=pending`);
  }
}