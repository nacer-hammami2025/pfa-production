import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TeamCreationRequestService, TeamCreationRequest, ReviewTeamRequestData } from '../../../services/team-creation-request.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  selector: 'app-team-requests',
  templateUrl: './team-requests.component.html',
  styleUrls: ['./team-requests.component.css']
})
export class TeamRequestsComponent implements OnInit, OnDestroy {
  requests: TeamCreationRequest[] = [];
  filteredRequests: TeamCreationRequest[] = [];
  loading = false;
  selectedRequest: TeamCreationRequest | null = null;
  showReviewModal = false;

  // Filters
  statusFilter = 'all';
  searchTerm = '';

  // Review form
  reviewForm: FormGroup;
  reviewing = false;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalRequests = 0;
  pageSize = 10;

  private subscriptions: Subscription[] = [];

  constructor(
    private teamRequestService: TeamCreationRequestService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {
    this.reviewForm = this.fb.group({
      action: ['approve', Validators.required],
      reviewComment: ['']
    });
  }

  ngOnInit(): void {
    this.loadRequests();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadRequests(page: number = 1): void {
    this.loading = true;
    this.currentPage = page;

    const status = this.statusFilter === 'all' ? undefined : this.statusFilter;

    this.subscriptions.push(
      this.teamRequestService.getRequests(status, page, this.pageSize).subscribe({
        next: (response) => {
          this.requests = response.requests;
          this.filteredRequests = [...this.requests];
          this.totalPages = response.pagination.pages;
          this.totalRequests = response.pagination.total;
          this.loading = false;
          this.applySearchFilter();
        },
        error: (error) => {
          console.error('Error loading team requests:', error);
          this.notificationService.addNotification({
            type: 'error',
            title: 'Erreur',
            message: 'Impossible de charger les demandes d\'équipes.',
            category: 'admin',
            autoHide: true
          });
          this.loading = false;
        }
      })
    );
  }

  applySearchFilter(): void {
    if (!this.searchTerm.trim()) {
      this.filteredRequests = [...this.requests];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredRequests = this.requests.filter(request =>
      request.teamName.toLowerCase().includes(term) ||
      request.requester.username.toLowerCase().includes(term) ||
      request.requester.email.toLowerCase().includes(term) ||
      (request.teamDescription && request.teamDescription.toLowerCase().includes(term))
    );
  }

  onStatusFilterChange(): void {
    this.loadRequests(1);
  }

  onSearchChange(): void {
    this.applySearchFilter();
  }

  openReviewModal(request: TeamCreationRequest): void {
    this.selectedRequest = request;
    this.reviewForm.reset({
      action: 'approve',
      reviewComment: ''
    });
    this.showReviewModal = true;
  }

  closeReviewModal(): void {
    this.showReviewModal = false;
    this.selectedRequest = null;
    this.reviewForm.reset();
  }

  submitReview(): void {
    if (!this.selectedRequest || !this.reviewForm.valid) return;

    this.reviewing = true;
    const reviewData: ReviewTeamRequestData = this.reviewForm.value;

    this.teamRequestService.reviewRequest(this.selectedRequest._id, reviewData).subscribe({
      next: (response) => {
        this.notificationService.addNotification({
          type: 'success',
          title: 'Demande traitée',
          message: response.message,
          category: 'admin',
          autoHide: true
        });

        this.closeReviewModal();
        this.loadRequests(this.currentPage); // Refresh the list
        this.reviewing = false;
      },
      error: (error) => {
        console.error('Error reviewing team request:', error);
        this.notificationService.addNotification({
          type: 'error',
          title: 'Erreur',
          message: 'Impossible de traiter la demande.',
          category: 'admin',
          autoHide: true
        });
        this.reviewing = false;
      }
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending': return 'badge-warning';
      case 'approved': return 'badge-success';
      case 'rejected': return 'badge-danger';
      default: return 'badge-secondary';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvée';
      case 'rejected': return 'Rejetée';
      default: return status;
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPendingRequestsCount(): number {
    return this.requests.filter(r => r.status === 'pending').length;
  }
}