import { Component, OnInit } from '@angular/core';
import { ProjectService, Project } from '../../services/project.service';
import { TaskService, Task, CreateTaskDTO } from '../../services/task.service';
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
  
  filterStatus = 'all';
  searchTerm = '';
  
  // User management
  allUsers: any[] = [];
  isAdmin = false;
  
  // Task management
  projectTasks: Task[] = [];
  showCreateTaskModal = false;
  
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

  newTask: CreateTaskDTO = {
    title: '',
    description: '',
    priority: 'medium',
    category: 'work'
  };

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
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
        
        // Load project tasks
        this.loadProjectTasks(fullProject._id);
      },
      error: (err) => {
        console.error('Erreur chargement projet:', err);
        this.loading = false;
      }
    });
  }

  loadProjectTasks(projectId: string): void {
    this.taskService.getTasksByProject(projectId).subscribe({
      next: (tasks) => {
        this.projectTasks = tasks;
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur chargement tâches:', err);
        this.loading = false;
      }
    });
  }

  updateProjectStatus(status: string, project?: Project): void {
    const projectToUpdate = project || this.selectedProject;
    if (!projectToUpdate) return;
    
    this.projectService.updateProject(projectToUpdate._id, { status: status as any }).subscribe({
      next: (updated) => {
        if (this.selectedProject && this.selectedProject._id === updated._id) {
          this.selectedProject.status = updated.status;
        }
        const index = this.projects.findIndex(p => p._id === updated._id);
        if (index !== -1) {
          this.projects[index] = updated;
          this.applyFilters();
        }
        // Show success message
        const statusLabels = {
          'planning': 'Planification',
          'active': 'Actif', 
          'on-hold': 'En pause',
          'completed': 'Terminé',
          'archived': 'Archivé'
        };
        alert(`✅ Projet "${projectToUpdate.name}" marqué comme ${statusLabels[status as keyof typeof statusLabels] || status}`);
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

  // Task management methods
  openCreateTaskModal(): void {
    this.newTask = {
      title: '',
      description: '',
      priority: 'medium',
      category: 'work'
    };
    this.showCreateTaskModal = true;
  }

  closeCreateTaskModal(): void {
    this.showCreateTaskModal = false;
  }

  createTaskInProject(): void {
    if (!this.selectedProject || !this.newTask.title.trim()) return;

    const taskData: CreateTaskDTO = {
      ...this.newTask,
      project: this.selectedProject._id
    };

    this.taskService.createTask(taskData).subscribe({
      next: (createdTask) => {
        this.projectTasks.unshift(createdTask); // Add to beginning of list
        this.closeCreateTaskModal();
        // Optionally reload project to get updated task count
        this.loadProjects();
      },
      error: (err) => {
        console.error('Erreur création tâche:', err);
      }
    });
  }

  toggleTaskCompletion(task: Task): void {
    this.taskService.toggleTaskCompleted(task._id).subscribe({
      next: (updatedTask) => {
        const index = this.projectTasks.findIndex(t => t._id === task._id);
        if (index !== -1) {
          this.projectTasks[index] = updatedTask;
        }
      },
      error: (err) => console.error('Erreur toggle tâche:', err)
    });
  }

  // Utility methods for task styling
  getTaskPriorityColor(priority: string): string {
    switch (priority) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      case 'urgent': return '#dc2626';
      default: return '#6b7280';
    }
  }
}
