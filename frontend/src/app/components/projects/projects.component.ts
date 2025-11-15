import { Component, OnInit } from '@angular/core';
import { ProjectService, Project } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  loading = false;
  showCreateModal = false;
  showDetailModal = false;
  selectedProject: Project | null = null;
  
  filterStatus: string = 'all';
  searchTerm = '';
  
  // User management
  allUsers: any[] = [];
  isAdmin = false;
  
  newProject = {
    name: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    color: '#667eea',
    startDate: '',
    endDate: '',
    members: [] as string[]
  };

  newMilestone = {
    title: '',
    description: '',
    dueDate: ''
  };

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.loadProjects();
    if (this.isAdmin) {
      this.loadUsers();
    }
  }

  loadUsers(): void {
    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        this.allUsers = users.filter(u => u.role === 'user'); // Only show regular users
      },
      error: (err) => console.error('Erreur chargement users:', err)
    });
  }

  toggleMember(userId: string): void {
    const index = this.newProject.members.indexOf(userId);
    if (index > -1) {
      this.newProject.members.splice(index, 1);
    } else {
      this.newProject.members.push(userId);
    }
  }

  isMemberSelected(userId: string): boolean {
    return this.newProject.members.includes(userId);
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredProjects = this.projects.filter(project => {
      const matchesStatus = this.filterStatus === 'all' || project.status === this.filterStatus;
      const matchesSearch = !this.searchTerm || 
        project.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }

  openCreateModal(): void {
    this.showCreateModal = true;
  }

  createProject(): void {
    if (!this.newProject.name) return;
    
    this.loading = true;
    this.projectService.createProject(this.newProject).subscribe({
      next: (project) => {
        this.projects.unshift(project);
        this.applyFilters();
        this.showCreateModal = false;
        this.resetNewProject();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
      }
    });
  }

  openProject(project: Project): void {
    this.loading = true;
    this.projectService.getProject(project._id).subscribe({
      next: (fullProject) => {
        this.selectedProject = fullProject;
        this.showDetailModal = true;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur:', err);
        this.loading = false;
      }
    });
  }

  updateProjectStatus(status: string): void {
    if (!this.selectedProject) return;
    
    this.projectService.updateProject(this.selectedProject._id, { status: status as any }).subscribe({
      next: (updated) => {
        if (this.selectedProject) {
          this.selectedProject.status = updated.status;
        }
        const index = this.projects.findIndex(p => p._id === updated._id);
        if (index !== -1) {
          this.projects[index] = updated;
          this.applyFilters();
        }
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  deleteProject(): void {
    if (!this.selectedProject || !confirm('Supprimer ce projet ?')) return;
    
    this.projectService.deleteProject(this.selectedProject._id).subscribe({
      next: () => {
        this.projects = this.projects.filter(p => p._id !== this.selectedProject?._id);
        this.applyFilters();
        this.showDetailModal = false;
        this.selectedProject = null;
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  addMilestone(): void {
    if (!this.selectedProject || !this.newMilestone.title) return;
    
    this.projectService.addMilestone(this.selectedProject._id, this.newMilestone).subscribe({
      next: (updated) => {
        if (this.selectedProject) {
          this.selectedProject.milestones = updated.milestones;
        }
        this.resetNewMilestone();
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  toggleMilestone(milestoneId: string, completed: boolean): void {
    if (!this.selectedProject) return;
    
    this.projectService.updateMilestone(this.selectedProject._id, milestoneId, { completed }).subscribe({
      next: (updated) => {
        if (this.selectedProject) {
          this.selectedProject.milestones = updated.milestones;
        }
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  deleteMilestone(milestoneId: string): void {
    if (!this.selectedProject || !confirm('Supprimer ce jalon ?')) return;
    
    this.projectService.deleteMilestone(this.selectedProject._id, milestoneId).subscribe({
      next: (updated) => {
        if (this.selectedProject) {
          this.selectedProject.milestones = updated.milestones;
        }
      },
      error: (err) => console.error('Erreur:', err)
    });
  }

  getStatusColor(status: string): string {
    return this.projectService.getStatusColor(status as any);
  }

  getPriorityColor(priority: string): string {
    return this.projectService.getPriorityColor(priority as any);
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  resetNewProject(): void {
    this.newProject = {
      name: '',
      description: '',
      priority: 'medium',
      color: '#667eea',
      startDate: '',
      endDate: '',
      members: []
    };
  }

  resetNewMilestone(): void {
    this.newMilestone = {
      title: '',
      description: '',
      dueDate: ''
    };
  }
}
