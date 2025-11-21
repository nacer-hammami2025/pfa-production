import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TeamCollaborationService } from '../../services/team-collaboration.service';
import { NotificationService } from '../../services/notification.service';
import { TeamCreationRequestService } from '../../services/team-creation-request.service';
import { AuthService } from '../../services/auth.service';
import {
  Team,
  TeamMember,
  SharedTask,
  TaskComment,
  TeamActivity,
  TeamInvitation
} from '../../models/team.model';

@Component({
  selector: 'app-team-collaboration',
  templateUrl: './team-collaboration.component.html',
  styleUrls: ['./team-collaboration.component.css']
})
export class TeamCollaborationComponent implements OnInit, OnDestroy {
  // Data
  teams: Team[] = [];
  currentTeam: Team | null = null;
  teamTasks: SharedTask[] = [];
  teamActivities: TeamActivity[] = [];
  currentUser: any = null;

  // UI State
  isLoading = false;
  activeTab: 'overview' | 'tasks' | 'members' | 'activities' = 'overview';
  showCreateTeamModal = false;
  showInviteMemberModal = false;
  showTaskModal = false;
  selectedTask: SharedTask | null = null;

  // Forms
  createTeamForm: FormGroup;
  inviteMemberForm: FormGroup;
  createTaskForm: FormGroup;

  // Filters
  taskFilters = {
    status: '',
    assignedTo: '',
    priority: ''
  };

  private subscriptions: Subscription[] = [];

  constructor(
    public teamService: TeamCollaborationService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private teamCreationRequestService: TeamCreationRequestService,
    private fb: FormBuilder
  ) {
    this.createTeamForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      description: ['']
    });

    this.inviteMemberForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      role: ['member', Validators.required]
    });

    this.createTaskForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: [''],
      priority: ['medium', Validators.required],
      assignedTo: [''],
      dueDate: [''],
      estimatedHours: ['']
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadTeams();

    // Subscribe to team changes
    this.subscriptions.push(
      this.teamService.getCurrentTeam().subscribe(team => {
        this.currentTeam = team;
        if (team) {
          this.loadTeamTasks();
          this.loadTeamActivities();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  // Modal Management
  openCreateTeamModal(): void {
    this.showCreateTeamModal = true;
  }

  closeCreateTeamModal(): void {
    this.showCreateTeamModal = false;
    this.createTeamForm.reset();
  }

  openInviteMemberModal(): void {
    this.showInviteMemberModal = true;
  }

  closeInviteMemberModal(): void {
    this.showInviteMemberModal = false;
    this.inviteMemberForm.reset();
  }

  openTaskModal(task?: SharedTask): void {
    this.selectedTask = task || null;
    if (task) {
      this.createTaskForm.patchValue({
        title: task.title,
        description: task.description,
        assignedTo: task.assignedTo,
        priority: task.priority,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
      });
    } else {
      this.createTaskForm.reset();
    }
    this.showTaskModal = true;
  }

  closeTaskModal(): void {
    this.showTaskModal = false;
    this.selectedTask = null;
    this.createTaskForm.reset();
  }

  // Computed properties for template
  get completedTasksCount(): number {
    return this.teamTasks.filter(t => t.status === 'completed').length;
  }

  get inProgressTasksCount(): number {
    return this.teamTasks.filter(t => t.status === 'in_progress').length;
  }

  get pendingTasksCount(): number {
    return this.teamTasks.filter(t => t.status === 'pending').length;
  }

  get filteredTasks(): SharedTask[] {
    return this.teamTasks.filter(task => {
      if (this.taskFilters.status && task.status !== this.taskFilters.status) return false;
      if (this.taskFilters.assignedTo && task.assignedTo !== this.taskFilters.assignedTo) return false;
      if (this.taskFilters.priority && task.priority !== this.taskFilters.priority) return false;
      return true;
    });
  }

  // Navigation
  backToTeams(): void {
    this.teamService.setCurrentTeam(null);
  }

  // Team Management
  loadTeams(): void {
    this.isLoading = true;
    this.subscriptions.push(
      this.teamService.getTeams().subscribe({
        next: (teams) => {
          this.teams = teams;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading teams:', error);
          this.notificationService.addNotification({
            type: 'error',
            title: 'Erreur',
            message: 'Impossible de charger les équipes.'
          });
          this.isLoading = false;
        }
      })
    );
  }

  createTeam(): void {
    if (this.createTeamForm.valid) {
      this.isLoading = true;
      const formValue = this.createTeamForm.value;
      
      console.log('🚀 Tentative création équipe:', formValue);

      const requestData = {
        teamName: formValue.name,
        teamDescription: formValue.description
      };

      this.teamCreationRequestService.createRequest(requestData).subscribe({
        next: (response: any) => {
          console.log('✅ Réponse serveur:', response);
          this.notificationService.addNotification({
            type: 'success',
            title: '🎉 Demande soumise avec succès',
            message: `Votre demande de création d'équipe "${formValue.name}" a été soumise et est en attente d'approbation par un administrateur.`,
            category: 'admin',
            priority: 'high',
            persistent: true
          });
          this.createTeamForm.reset();
          this.showCreateTeamModal = false;
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('❌ Erreur détaillée:', error);
          this.notificationService.addNotification({
            type: 'error',
            title: '❌ Erreur de connexion',
            message: error.status === 0 ? '🔌 Backend non disponible. Vérifiez la connexion serveur.' : 
                     error.status === 401 ? '🔐 Session expirée. Reconnectez-vous.' :
                     error.status === 403 ? '❌ Permissions insuffisantes.' :
                     `❌ Erreur ${error.status}: ${error.error?.message || error.message}`,
            category: 'admin',
            priority: 'high'
          });
          this.isLoading = false;
        }
      });
    } else {
      console.log('❌ Formulaire invalide:', this.createTeamForm.errors);
    }
  }

  selectTeam(team: Team): void {
    this.teamService.setCurrentTeam(team);
    this.activeTab = 'overview';
  }

  leaveTeam(): void {
    if (confirm('Êtes-vous sûr de vouloir quitter cette équipe ?')) {
      if (this.currentTeam) {
        // For now, just deselect the team
        this.teamService.setCurrentTeam(null);
        this.notificationService.addNotification({
          type: 'info',
          title: 'Équipe quittée',
          message: 'Vous avez quitté l\'équipe.'
        });
      }
    }
  }

  // Member Management
  inviteMember(): void {
    if (this.inviteMemberForm.valid && this.currentTeam) {
      this.isLoading = true;
      const { email, role } = this.inviteMemberForm.value;

      this.teamService.inviteMember(this.currentTeam.id, email, role).subscribe({
        next: (invitation) => {
          this.notificationService.addNotification({
            type: 'success',
            title: 'Invitation envoyée',
            message: `Une invitation a été envoyée à ${email}.`
          });
          this.inviteMemberForm.reset();
          this.showInviteMemberModal = false;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error inviting member:', error);
          this.notificationService.addNotification({
            type: 'error',
            title: 'Erreur',
            message: 'Impossible d\'envoyer l\'invitation.'
          });
          this.isLoading = false;
        }
      });
    }
  }

  removeMember(memberId: string): void {
    if (this.currentTeam && confirm('Êtes-vous sûr de vouloir retirer ce membre ?')) {
      this.teamService.removeMember(this.currentTeam.id, memberId).subscribe({
        next: () => {
          this.notificationService.addNotification({
            type: 'success',
            title: 'Membre retiré',
            message: 'Le membre a été retiré de l\'équipe.'
          });
        },
        error: (error) => {
          console.error('Error removing member:', error);
          this.notificationService.addNotification({
            type: 'error',
            title: 'Erreur',
            message: 'Impossible de retirer le membre.'
          });
        }
      });
    }
  }

  // Task Management
  loadTeamTasks(): void {
    if (this.currentTeam) {
      this.teamService.getTeamTasks(this.currentTeam.id, this.taskFilters).subscribe({
        next: (tasks) => {
          this.teamTasks = tasks;
        },
        error: (error) => {
          console.error('Error loading team tasks:', error);
        }
      });
    }
  }

  createTask(): void {
    if (this.createTaskForm.valid && this.currentTeam) {
      this.isLoading = true;
      const formValue = this.createTaskForm.value;

      // Convert form values
      const taskData = {
        ...formValue,
        teamId: this.currentTeam.id,
        tags: [],
        dueDate: formValue.dueDate ? new Date(formValue.dueDate) : undefined,
        estimatedHours: formValue.estimatedHours ? parseFloat(formValue.estimatedHours) : undefined
      };

      this.teamService.createSharedTask(this.currentTeam.id, taskData).subscribe({
        next: (task) => {
          this.notificationService.addNotification({
            type: 'success',
            title: 'Tâche créée',
            message: `La tâche "${task.title}" a été créée.`
          });
          this.createTaskForm.reset();
          this.showTaskModal = false;
          this.loadTeamTasks();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error creating task:', error);
          this.notificationService.addNotification({
            type: 'error',
            title: 'Erreur',
            message: 'Impossible de créer la tâche.'
          });
          this.isLoading = false;
        }
      });
    }
  }

  updateTaskStatus(task: SharedTask, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as 'pending' | 'in_progress' | 'completed' | 'cancelled';
    if (this.currentTeam) {
      this.teamService.updateSharedTask(this.currentTeam.id, task.id, { status }).subscribe({
        next: (updatedTask: SharedTask) => {
          this.loadTeamTasks();
          this.notificationService.addNotification({
            type: 'success',
            title: 'Statut mis à jour',
            message: `La tâche "${updatedTask.title}" est maintenant ${status}.`
          });
        },
        error: (error: any) => {
          console.error('Error updating task:', error);
        }
      });
    }
  }

  assignTask(task: SharedTask, event: Event): void {
    const memberId = (event.target as HTMLSelectElement).value;
    if (this.currentTeam) {
      this.teamService.assignTask(this.currentTeam.id, task.id, memberId).subscribe({
        next: (updatedTask) => {
          this.loadTeamTasks();
          this.notificationService.addNotification({
            type: 'success',
            title: 'Tâche assignée',
            message: `La tâche "${updatedTask.title}" a été assignée.`
          });
        },
        error: (error) => {
          console.error('Error assigning task:', error);
        }
      });
    }
  }

  deleteTask(task: SharedTask): void {
    if (this.currentTeam && confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
      this.teamService.deleteSharedTask(this.currentTeam.id, task.id).subscribe({
        next: () => {
          this.loadTeamTasks();
          this.notificationService.addNotification({
            type: 'success',
            title: 'Tâche supprimée',
            message: `La tâche "${task.title}" a été supprimée.`
          });
        },
        error: (error) => {
          console.error('Error deleting task:', error);
        }
      });
    }
  }

  // Activities
  loadTeamActivities(): void {
    if (this.currentTeam) {
      this.subscriptions.push(
        this.teamService.getTeamActivities().subscribe({
          next: (activities) => {
            this.teamActivities = activities;
          },
          error: (error) => {
            console.error('Error loading team activities:', error);
          }
        })
      );
    }
  }

  // Utility methods
  getMemberName(memberId: string): string {
    if (!this.currentTeam) return 'Inconnu';
    const member = this.currentTeam.members.find(m => m.userId === memberId);
    return member ? member.name : 'Inconnu';
  }

  getMemberById(memberId: string): TeamMember | undefined {
    return this.currentTeam?.members.find(m => m.userId === memberId);
  }

  canManageTeam(): boolean {
    if (!this.currentTeam || !this.currentUser) return false;
    return this.teamService.canManageTeam(this.currentTeam, this.currentUser.id);
  }

  canManageTask(task: SharedTask): boolean {
    if (!this.currentTeam || !this.currentUser) return false;
    return this.teamService.canManageTask(task, this.currentTeam, this.currentUser.id);
  }

  isAssignedToCurrentUser(task: SharedTask): boolean {
    return this.currentUser && task.assignedTo === this.currentUser.id;
  }

  private loadCurrentUser(): void {
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );
  }

  // UI helpers
  getStatusColor(status: string): string {
    const colors = {
      pending: '#ffc107',
      in_progress: '#007bff',
      completed: '#28a745',
      cancelled: '#dc3545'
    };
    return colors[status as keyof typeof colors] || '#6c757d';
  }

  getPriorityColor(priority: string): string {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#fd7e14',
      urgent: '#dc3545'
    };
    return colors[priority as keyof typeof colors] || '#6c757d';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
}