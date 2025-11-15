import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { TaskService } from '../../services/task.service';
import { ProjectService } from '../../services/project.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics-dashboard',
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.css']
})
export class AnalyticsDashboardComponent implements OnInit, OnDestroy {
  @ViewChild('burndownChart') burndownCanvas?: ElementRef;
  @ViewChild('velocityChart') velocityCanvas?: ElementRef;
  @ViewChild('timeChart') timeCanvas?: ElementRef;
  @ViewChild('categoryChart') categoryCanvas?: ElementRef;

  loading = false;
  selectedPeriod = 30;
  
  // Stats
  totalTasks = 0;
  completedTasks = 0;
  pendingTasks = 0;
  overdueTasks = 0;
  
  totalProjects = 0;
  activeProjects = 0;
  
  totalHoursEstimated = 0;
  totalHoursActual = 0;
  efficiency = 100;
  
  avgCompletionDays = 0;
  productivityScore = 0;
  
  // Charts
  charts: Chart[] = [];

  constructor(
    private taskService: TaskService,
    private projectService: ProjectService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    
    // Load tasks
    this.taskService.getTasks().subscribe({
      next: (tasks: any[]) => {
        this.calculateTaskStats(tasks);
        
        // Load projects
        this.projectService.getProjects().subscribe({
          next: (projects: any[]) => {
            this.calculateProjectStats(projects);
            setTimeout(() => this.initCharts(tasks, projects), 100);
            this.loading = false;
          },
          error: (err) => {
            console.error('Erreur projets:', err);
            setTimeout(() => this.initCharts(tasks, []), 100);
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Erreur tâches:', err);
        this.loading = false;
      }
    });
  }

  calculateTaskStats(tasks: any[]): void {
    this.totalTasks = tasks.length;
    this.completedTasks = tasks.filter(t => t.completed).length;
    this.pendingTasks = this.totalTasks - this.completedTasks;
    
    // Overdue tasks
    const now = new Date();
    this.overdueTasks = tasks.filter(t => 
      !t.completed && t.dueDate && new Date(t.dueDate) < now
    ).length;
    
    // Time tracking
    this.totalHoursEstimated = tasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    this.totalHoursActual = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
    
    if (this.totalHoursActual > 0) {
      this.efficiency = Math.round((this.totalHoursEstimated / this.totalHoursActual) * 100);
    }
    
    // Average completion time
    const completedTasks = tasks.filter(t => t.completed && t.createdAt && t.updatedAt);
    if (completedTasks.length > 0) {
      const totalDays = completedTasks.reduce((sum, t) => {
        const created = new Date(t.createdAt).getTime();
        const updated = new Date(t.updatedAt).getTime();
        return sum + (updated - created) / (1000 * 60 * 60 * 24);
      }, 0);
      this.avgCompletionDays = Math.round(totalDays / completedTasks.length);
    }
    
    // Productivity score
    const completionRate = this.totalTasks > 0 ? (this.completedTasks / this.totalTasks) * 100 : 0;
    this.productivityScore = Math.round((completionRate + this.efficiency) / 2);
  }

  calculateProjectStats(projects: any[]): void {
    this.totalProjects = projects.length;
    this.activeProjects = projects.filter(p => p.status === 'active').length;
  }

  initCharts(tasks: any[], projects: any[]): void {
    this.createBurndownChart(tasks);
    this.createVelocityChart(tasks);
    this.createTimeChart(tasks);
    this.createCategoryChart(tasks);
  }

  createBurndownChart(tasks: any[]): void {
    if (!this.burndownCanvas) return;
    
    const ctx = this.burndownCanvas.nativeElement.getContext('2d');
    const days = 30;
    const labels = Array.from({ length: days }, (_, i) => `J${i + 1}`);
    
    const ideal = Array.from({ length: days }, (_, i) => 
      Math.max(0, this.totalTasks - (this.totalTasks / days) * i)
    );
    
    const actual = Array.from({ length: days }, (_, i) => 
      Math.max(0, this.totalTasks - this.completedTasks * (i / days))
    );
    
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Idéal',
            data: ideal,
            borderColor: '#a0aec0',
            borderDash: [5, 5],
            fill: false,
            tension: 0.1,
            pointRadius: 0
          },
          {
            label: 'Réel',
            data: actual,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          title: { display: true, text: '📉 Burndown Chart', font: { size: 16, weight: 'bold' } }
        },
        scales: {
          y: { 
            beginAtZero: true,
            title: { display: true, text: 'Tâches restantes' }
          }
        }
      }
    });
    
    this.charts.push(chart);
  }

  createVelocityChart(tasks: any[]): void {
    if (!this.velocityCanvas) return;
    
    const ctx = this.velocityCanvas.nativeElement.getContext('2d');
    
    // Calculate weekly velocity
    const weeks = 12;
    const labels: string[] = [];
    const created: number[] = [];
    const completed: number[] = [];
    
    for (let i = weeks - 1; i >= 0; i--) {
      labels.push(`S${weeks - i}`);
      
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const weekTasks = tasks.filter(t => {
        const created = new Date(t.createdAt);
        return created >= weekStart && created < weekEnd;
      });
      
      created.push(weekTasks.length);
      completed.push(weekTasks.filter(t => t.completed).length);
    }
    
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Créées',
            data: created,
            backgroundColor: 'rgba(237, 137, 54, 0.7)',
            borderColor: '#ed8936',
            borderWidth: 2
          },
          {
            label: 'Complétées',
            data: completed,
            backgroundColor: 'rgba(72, 187, 120, 0.7)',
            borderColor: '#48bb78',
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          title: { display: true, text: '⚡ Vélocité (12 semaines)', font: { size: 16, weight: 'bold' } }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Nombre de tâches' } }
        }
      }
    });
    
    this.charts.push(chart);
  }

  createTimeChart(tasks: any[]): void {
    if (!this.timeCanvas) return;
    
    const ctx = this.timeCanvas.nativeElement.getContext('2d');
    
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Temps estimé', 'Temps réel', 'Écart'],
        datasets: [{
          data: [
            this.totalHoursEstimated,
            this.totalHoursActual,
            Math.abs(this.totalHoursActual - this.totalHoursEstimated)
          ],
          backgroundColor: ['#4299e1', '#667eea', '#f56565'],
          borderWidth: 3,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom' },
          title: { display: true, text: '⏱️ Suivi du temps', font: { size: 16, weight: 'bold' } }
        }
      }
    });
    
    this.charts.push(chart);
  }

  createCategoryChart(tasks: any[]): void {
    if (!this.categoryCanvas) return;
    
    const ctx = this.categoryCanvas.nativeElement.getContext('2d');
    
    const categories = ['work', 'personal', 'shopping', 'health', 'education', 'other'];
    const categoryData = categories.map(cat => 
      tasks.filter(t => t.category === cat).length
    );
    
    const chart = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: ['Travail', 'Personnel', 'Shopping', 'Santé', 'Éducation', 'Autre'],
        datasets: [{
          data: categoryData,
          backgroundColor: [
            'rgba(102, 126, 234, 0.7)',
            'rgba(118, 75, 162, 0.7)',
            'rgba(237, 137, 54, 0.7)',
            'rgba(245, 101, 101, 0.7)',
            'rgba(72, 187, 120, 0.7)',
            'rgba(160, 174, 192, 0.7)'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'right' },
          title: { display: true, text: '📊 Distribution par catégorie', font: { size: 16, weight: 'bold' } }
        }
      }
    });
    
    this.charts.push(chart);
  }

  exportReport(): void {
    const report = {
      generatedAt: new Date().toISOString(),
      period: `${this.selectedPeriod} jours`,
      summary: {
        tasks: {
          total: this.totalTasks,
          completed: this.completedTasks,
          pending: this.pendingTasks,
          overdue: this.overdueTasks,
          completionRate: `${Math.round((this.completedTasks / this.totalTasks) * 100)}%`
        },
        projects: {
          total: this.totalProjects,
          active: this.activeProjects
        },
        time: {
          estimatedHours: this.totalHoursEstimated,
          actualHours: this.totalHoursActual,
          efficiency: `${this.efficiency}%`
        },
        productivity: {
          avgCompletionDays: this.avgCompletionDays,
          productivityScore: this.productivityScore
        }
      }
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }

  ngOnDestroy(): void {
    this.charts.forEach(chart => chart.destroy());
  }
}
