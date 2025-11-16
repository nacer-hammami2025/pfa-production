import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Chart, ChartOptions, ChartData, registerables } from 'chart.js';
import { AdminService } from 'src/app/services/admin.service';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard-home',
  templateUrl: './admin-dashboard-home.component.html',
  styleUrls: ['./admin-dashboard-home.component.css']
})
export class AdminDashboardHomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('performanceChart') performanceChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('userActivityChart') userActivityChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('projectsChart') projectsChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('priorityChart') priorityChartRef!: ElementRef<HTMLCanvasElement>;

  summary: any = null;
  isLoading = true;
  
  // Stats avec animations
  stats = {
    totalUsers: 0,
    totalTasks: 0,
    totalProjects: 0,
    totalTeams: 0,
    completedTasks: 0,
    pendingTasks: 0,
    activeIntegrations: 0,
    avgCompletionRate: 0
  };

  // Top performers
  topUsers: any[] = [];
  topTeams: any[] = [];
  recentActivities: any[] = [];

  // Charts
  private performanceChart: Chart | null = null;
  private userActivityChart: Chart | null = null;
  private projectsChart: Chart | null = null;
  private priorityChart: Chart | null = null;

  // Weekly Activity Chart
  weeklyActivityData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Tâches Complétées',
        fill: true,
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        borderColor: '#667eea',
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#667eea',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      },
      {
        data: [],
        label: 'Tâches Créées',
        fill: true,
        backgroundColor: 'rgba(245, 101, 101, 0.1)',
        borderColor: '#f56565',
        tension: 0.4,
        borderWidth: 3,
        pointBackgroundColor: '#f56565',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7
      }
    ]
  };

  weeklyActivityOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: 500
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        borderColor: '#667eea',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          }
        },
        grid: {
          display: false
        }
      }
    }
  };

  // Task Status Chart
  taskStatusData: ChartData<'doughnut'> = {
    labels: ['En Attente', 'En Cours', 'Complétées', 'En Retard'],
    datasets: [{
      data: [0, 0, 0, 0],
      backgroundColor: [
        '#fbbf24',
        '#3b82f6',
        '#10b981',
        '#ef4444'
      ],
      borderWidth: 0,
      hoverOffset: 10
    }]
  };

  taskStatusOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12,
            weight: 500
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        }
      }
    },
    cutout: '65%'
  };

  constructor(private adminService: AdminService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Les graphiques seront créés après le chargement des données
  }

  loadDashboardData(forceRefresh = false): void {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    // Détruire les anciens graphiques
    this.destroyCharts();
    
    this.adminService.getDashboardSummary(forceRefresh).subscribe({
      next: (data) => {
        this.summary = data;
        this.animateStats(data);
        this.updateCharts();
        this.generateMockData(); // Générer données de démonstration
        
        // Recréer les graphiques après un court délai
        setTimeout(() => {
          this.createAdvancedCharts();
        }, 100);
        
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading admin dashboard summary:', err);
        this.generateMockData(); // Fallback sur données mock
        
        setTimeout(() => {
          this.createAdvancedCharts();
        }, 100);
        
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private animateStats(data: any): void {
    // Animation progressive des chiffres
    const duration = 1500;
    const steps = 60;
    const interval = duration / steps;

    const animate = (target: number, current: number, key: keyof typeof this.stats) => {
      const increment = target / steps;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        current += increment;
        this.stats[key] = Math.min(Math.round(current), target);
        this.cdr.detectChanges();

        if (step >= steps) {
          clearInterval(timer);
          this.stats[key] = target;
          this.cdr.detectChanges();
        }
      }, interval);
    };

    animate(data.totalUsers || 0, 0, 'totalUsers');
    animate(data.totalTasks || 0, 0, 'totalTasks');
    animate(data.totalProjects || 0, 0, 'totalProjects');
    animate(data.totalTeams || 0, 0, 'totalTeams');
    animate(data.totals?.completedTasks || 0, 0, 'completedTasks');
    animate(data.totals?.pendingTasks || 0, 0, 'pendingTasks');
    animate(data.activeIntegrations || 0, 0, 'activeIntegrations');
    
    const completionRate = data.totals?.completedTasks && data.totalTasks 
      ? Math.round((data.totals.completedTasks / data.totalTasks) * 100) 
      : 0;
    animate(completionRate, 0, 'avgCompletionRate');
  }

  private updateCharts(): void {
    if (!this.summary) return;

    // Weekly Activity
    if (this.summary.weeklyActivity) {
      this.weeklyActivityData.labels = this.summary.weeklyActivity.labels;
      this.weeklyActivityData.datasets[0].data = this.summary.weeklyActivity.data;
      
      // Ajouter données pour tâches créées (simulées)
      this.weeklyActivityData.datasets[1].data = this.summary.weeklyActivity.data.map(
        (val: number) => val + Math.floor(Math.random() * 5)
      );
    }

    // Task Status
    if (this.summary.totals) {
      this.taskStatusData.datasets[0].data = [
        this.summary.totals.pendingTasks || 0,
        Math.floor((this.summary.totals.pendingTasks || 0) * 0.3),
        this.summary.totals.completedTasks || 0,
        Math.floor((this.summary.totals.pendingTasks || 0) * 0.15)
      ];
    }
  }

  private generateMockData(): void {
    // Top Users
    this.topUsers = [
      { name: 'Alice Martin', tasksCompleted: 45, avatar: '👩‍💼', efficiency: 95 },
      { name: 'Bob Dupont', tasksCompleted: 38, avatar: '👨‍💻', efficiency: 88 },
      { name: 'Clara Bernard', tasksCompleted: 32, avatar: '👩‍🔬', efficiency: 92 },
      { name: 'David Leclerc', tasksCompleted: 28, avatar: '👨‍🎨', efficiency: 85 },
      { name: 'Emma Rousseau', tasksCompleted: 25, avatar: '👩‍⚕️', efficiency: 90 }
    ];

    // Top Teams
    this.topTeams = [
      { name: 'Équipe Frontend', members: 8, tasksCompleted: 156, icon: '💻', progress: 92 },
      { name: 'Équipe Backend', members: 6, tasksCompleted: 134, icon: '⚙️', progress: 87 },
      { name: 'Équipe Design', members: 5, tasksCompleted: 98, icon: '🎨', progress: 78 },
      { name: 'Équipe Marketing', members: 7, tasksCompleted: 87, icon: '📢', progress: 85 }
    ];

    // Recent Activities
    this.recentActivities = [
      { user: 'Alice Martin', action: 'a complété la tâche', target: 'Refonte Homepage', time: 'Il y a 5 min', icon: '✅' },
      { user: 'Bob Dupont', action: 'a créé un projet', target: 'API Gateway v2', time: 'Il y a 12 min', icon: '📁' },
      { user: 'Clara Bernard', action: 'a rejoint l\'équipe', target: 'Équipe Backend', time: 'Il y a 23 min', icon: '👥' },
      { user: 'David Leclerc', action: 'a commenté', target: 'Design System Update', time: 'Il y a 45 min', icon: '💬' },
      { user: 'Emma Rousseau', action: 'a partagé un fichier', target: 'Documentation.pdf', time: 'Il y a 1h', icon: '📎' }
    ];
  }

  private createAdvancedCharts(): void {
    setTimeout(() => {
      this.createPerformanceChart();
      this.createUserActivityChart();
      this.createProjectsChart();
      this.createPriorityChart();
    }, 100);
  }

  private createPerformanceChart(): void {
    if (!this.performanceChartRef) return;

    const ctx = this.performanceChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.performanceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [
          {
            label: 'Productivité',
            data: [85, 78, 90, 88, 92, 65, 70],
            backgroundColor: 'rgba(102, 126, 234, 0.8)',
            borderColor: '#667eea',
            borderWidth: 2,
            borderRadius: 8
          },
          {
            label: 'Efficacité',
            data: [78, 82, 85, 90, 87, 60, 65],
            backgroundColor: 'rgba(72, 187, 120, 0.8)',
            borderColor: '#48bb78',
            borderWidth: 2,
            borderRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value) => value + '%'
            }
          }
        }
      }
    });
  }

  private createUserActivityChart(): void {
    if (!this.userActivityChartRef) return;

    const ctx = this.userActivityChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.userActivityChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
        datasets: [{
          label: 'Utilisateurs Actifs',
          data: [45, 52, 48, 65, 72, 80],
          fill: true,
          backgroundColor: 'rgba(236, 72, 153, 0.1)',
          borderColor: '#ec4899',
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 6,
          pointBackgroundColor: '#ec4899',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  private createProjectsChart(): void {
    if (!this.projectsChartRef) return;

    const ctx = this.projectsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.projectsChart = new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: ['En Cours', 'Terminés', 'En Attente', 'Annulés'],
        datasets: [{
          data: [12, 35, 8, 3],
          backgroundColor: [
            'rgba(59, 130, 246, 0.7)',
            'rgba(16, 185, 129, 0.7)',
            'rgba(251, 191, 36, 0.7)',
            'rgba(239, 68, 68, 0.7)'
          ],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 15,
              usePointStyle: true
            }
          }
        }
      }
    });
  }

  private createPriorityChart(): void {
    if (!this.priorityChartRef) return;

    const ctx = this.priorityChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.priorityChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Urgent', 'Haute', 'Moyenne', 'Basse', 'En Attente'],
        datasets: [{
          label: 'Tâches par Priorité',
          data: [15, 28, 45, 32, 12],
          fill: true,
          backgroundColor: 'rgba(139, 92, 246, 0.2)',
          borderColor: '#8b5cf6',
          borderWidth: 2,
          pointBackgroundColor: '#8b5cf6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            ticks: {
              stepSize: 10
            }
          }
        }
      }
    });
  }

  private destroyCharts(): void {
    if (this.performanceChart) {
      this.performanceChart.destroy();
      this.performanceChart = null;
    }
    if (this.userActivityChart) {
      this.userActivityChart.destroy();
      this.userActivityChart = null;
    }
    if (this.projectsChart) {
      this.projectsChart.destroy();
      this.projectsChart = null;
    }
    if (this.priorityChart) {
      this.priorityChart.destroy();
      this.priorityChart = null;
    }
  }

  ngOnDestroy(): void {
    // Nettoyer les graphiques
    this.destroyCharts();
  }
}
