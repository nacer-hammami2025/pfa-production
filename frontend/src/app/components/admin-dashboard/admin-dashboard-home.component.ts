import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AdminDashboardSummary, AdminService } from '../../services/admin.service';
import { ChartConfiguration, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-admin-dashboard-home',
  templateUrl: './admin-dashboard-home.component.html',
  styleUrls: ['./admin-dashboard-home.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboardHomeComponent implements OnInit {
  summary: AdminDashboardSummary | null = null;
  isLoading = true;
  errorMessage: string | null = null;

  // Chart.js configurations
  public userChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Utilisateurs Actifs', 'Utilisateurs Inactifs'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#2f9e44', '#e9ecef'],
      borderColor: '#ffffff',
      borderWidth: 2,
      hoverBackgroundColor: ['#37b24d', '#f1f3f5']
    }]
  };
  public userChartOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
  };

  public activityChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [], // Les 7 derniers jours
    datasets: [
      {
        data: [],
        label: 'Inscriptions',
        backgroundColor: '#4c6ef5',
        borderRadius: 4,
        hoverBackgroundColor: '#364fc7'
      },
      {
        data: [],
        label: 'Tâches Créées',
        backgroundColor: '#15aabf',
        borderRadius: 4,
        hoverBackgroundColor: '#0b7285'
      }
    ]
  };
  public activityChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: '#e9ecef'
        },
        ticks: {
          stepSize: 1
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
      },
    }
  };

  constructor(private adminService: AdminService, private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.isLoading = true;
    this.errorMessage = null;
    console.log('🔄 Chargement du dashboard admin...');
    console.log('🔑 Token présent:', localStorage.getItem('pfa_token') ? 'OUI' : 'NON');

    this.adminService.getDashboardSummary().subscribe({
      next: (summary) => {
        console.log('✅ Données reçues:', summary);
        this.summary = {
          ...summary,
          recentUsers: summary.recentUsers || [],
          recentTeams: summary.recentTeams || []
        };
        this.updateCharts(this.summary);
        this.isLoading = false;
        this.cdr.markForCheck(); // Marquer pour la détection de changement
      },
      error: (err) => {
        console.error('❌ Erreur lors du chargement:', err);
        this.errorMessage = `Le serveur ne répond pas. Veuillez vérifier qu'il est bien démarré. [${err.status}]`;
        this.isLoading = false;
        this.cdr.markForCheck(); // Marquer pour la détection de changement
      }
    });
  }

  updateCharts(summary: AdminDashboardSummary): void {
    // User Doughnut Chart
    const activeUsers = summary.totals.activeUsers ?? 0;
    const totalUsers = summary.totals.users ?? 0;
    this.userChartData.datasets[0].data = [activeUsers, totalUsers - activeUsers];

    // Activity Bar Chart
    const lastSevenDays = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toLocaleDateString('fr-FR', { weekday: 'short' });
    }).reverse();

    this.activityChartData.labels = lastSevenDays;
    this.activityChartData.datasets[0].data = summary.weeklyStats.registrations;
    this.activityChartData.datasets[1].data = summary.weeklyStats.tasksCreated;
  }

  get totals() {
    return {
      users: this.summary?.totals.users ?? 0,
      admins: this.summary?.totals.admins ?? 0,
      activeUsers: this.summary?.totals.activeUsers ?? 0,
      teams: this.summary?.totals.teams ?? 0,
      teamMembers: this.summary?.totals.teamMembers ?? 0,
    };
  }

  goTo(path: string): void {
    this.router.navigate(['/admin', path]);
  }
}
