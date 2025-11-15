import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { AIService, AISuggestion, ProductivityMetrics, ProductivityInsight } from '../../services/ai.service';
import { TaskService, Task } from '../../services/task.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-ai-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="ai-dashboard animate-fade-in">
      <!-- Header -->
      <div class="dashboard-header glass card">
        <div class="header-content">
          <h1 class="dashboard-title">
            <i class="icon-brain"></i>
            Tableau de Bord IA
          </h1>
          <p class="dashboard-subtitle">Suggestions intelligentes et analyse de productivité</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-ghost" (click)="refreshInsights()">
            <i class="icon-refresh"></i>
            Actualiser
          </button>
        </div>
      </div>

      <!-- Productivity Metrics -->
      <div class="metrics-grid" *ngIf="productivityMetrics">
        <div class="metric-card card" *ngFor="let metric of metricsList">
          <div class="metric-icon" [ngClass]="metric.iconClass">
            <i [class]="metric.icon"></i>
          </div>
          <div class="metric-content">
            <h3 class="metric-value">{{ metric.value }}</h3>
            <p class="metric-label">{{ metric.label }}</p>
            <div class="metric-trend" *ngIf="metric.trend">
              <i [class]="metric.trendIcon" [ngClass]="metric.trendClass"></i>
              <span>{{ metric.trend }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Suggestions -->
      <div class="suggestions-section">
        <h2 class="section-title">
          <i class="icon-lightbulb"></i>
          Suggestions IA
        </h2>
        <div class="suggestions-grid">
          <div class="suggestion-card card"
               *ngFor="let suggestion of aiSuggestions"
               [ngClass]="{'high-priority': suggestion.priority === 'high'}">
            <div class="suggestion-header">
              <div class="suggestion-type" [ngClass]="suggestion.type">
                <i [class]="getSuggestionIcon(suggestion.type)"></i>
                {{ getSuggestionTypeLabel(suggestion.type) }}
              </div>
              <div class="suggestion-confidence">
                <div class="confidence-bar" [style.width.%]="suggestion.confidence * 100"></div>
              </div>
            </div>
            <h3 class="suggestion-title">{{ suggestion.title }}</h3>
            <p class="suggestion-description">{{ suggestion.description }}</p>
            <div class="suggestion-meta" *ngIf="suggestion.reasoning">
              <small class="reasoning">{{ suggestion.reasoning }}</small>
            </div>
            <div class="suggestion-actions" *ngIf="suggestion.actionable">
              <button class="btn btn-primary btn-sm" (click)="executeSuggestion(suggestion)">
                Appliquer
              </button>
              <button class="btn btn-ghost btn-sm" (click)="dismissSuggestion(suggestion)">
                Ignorer
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Productivity Insights -->
      <div class="insights-section" *ngIf="productivityInsights.length > 0">
        <h2 class="section-title">
          <i class="icon-trending-up"></i>
          Insights de Productivité
        </h2>
        <div class="insights-list">
          <div class="insight-item card"
               *ngFor="let insight of productivityInsights"
               [ngClass]="insight.impact">
            <div class="insight-icon">
              <i [class]="getInsightIcon(insight.type)"></i>
            </div>
            <div class="insight-content">
              <h4 class="insight-title">{{ insight.title }}</h4>
              <p class="insight-description">{{ insight.description }}</p>
              <div class="insight-meta">
                <small class="timestamp">{{ insight.timestamp | date:'short' }}</small>
                <span class="impact-badge" [ngClass]="insight.impact">
                  {{ getImpactLabel(insight.impact) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Settings -->
      <div class="settings-section card glass">
        <h3 class="settings-title">
          <i class="icon-settings"></i>
          Paramètres IA
        </h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" [(ngModel)]="aiEnabled" (ngModelChange)="toggleAI()">
              Activer les suggestions IA
            </label>
            <p class="setting-description">Recevoir des suggestions intelligentes basées sur vos habitudes</p>
          </div>
          <div class="setting-item">
            <label class="setting-label">
              <input type="checkbox" [(ngModel)]="analyticsEnabled" (ngModelChange)="toggleAnalytics()">
              Analyse de productivité
            </label>
            <p class="setting-description">Analyser vos patterns de travail pour optimiser votre efficacité</p>
          </div>
          <div class="setting-item">
            <label class="setting-label">
              Notifications IA
              <select [(ngModel)]="notificationFrequency" (ngModelChange)="saveAISettings()">
                <option value="realtime">Temps réel</option>
                <option value="daily">Quotidien</option>
                <option value="weekly">Hebdomadaire</option>
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-dashboard {
      padding: var(--space-6);
      max-width: var(--max-width);
      margin: 0 auto;
      space-y: var(--space-8);
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-8);
      padding: var(--space-6);
    }

    .dashboard-title {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
    }

    .dashboard-subtitle {
      color: var(--text-secondary);
      margin: var(--space-2) 0 0 0;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-6);
      margin-bottom: var(--space-8);
    }

    .metric-card {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      padding: var(--space-6);
      transition: all var(--transition-normal);
    }

    .metric-card:hover {
      transform: translateY(-2px);
    }

    .metric-icon {
      width: 3rem;
      height: 3rem;
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .metric-icon.tasks { background: linear-gradient(135deg, var(--accent-blue), #3b82f6); color: white; }
    .metric-icon.time { background: linear-gradient(135deg, var(--accent-green), #10b981); color: white; }
    .metric-icon.score { background: linear-gradient(135deg, var(--accent-purple), #8b5cf6); color: white; }
    .metric-icon.streak { background: linear-gradient(135deg, var(--accent-orange), #f97316); color: white; }

    .metric-content h3 {
      font-size: 2rem;
      font-weight: 700;
      margin: 0;
    }

    .metric-label {
      color: var(--text-secondary);
      margin: var(--space-1) 0 0 0;
      font-size: 0.875rem;
    }

    .metric-trend {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: 0.75rem;
      margin-top: var(--space-1);
    }

    .metric-trend.up { color: var(--success); }
    .metric-trend.down { color: var(--error); }

    .section-title {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: var(--space-6);
    }

    .suggestions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: var(--space-6);
    }

    .suggestion-card {
      position: relative;
      overflow: hidden;
    }

    .suggestion-card.high-priority {
      border-left: 4px solid var(--accent-red);
    }

    .suggestion-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-3);
    }

    .suggestion-type {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .suggestion-type.task { background: rgba(59, 130, 246, 0.1); color: var(--primary-600); }
    .suggestion-type.improvement { background: rgba(16, 185, 129, 0.1); color: var(--accent-green); }
    .suggestion-type.reminder { background: rgba(245, 158, 11, 0.1); color: var(--accent-orange); }
    .suggestion-type.optimization { background: rgba(139, 92, 246, 0.1); color: var(--accent-purple); }

    .suggestion-confidence {
      width: 60px;
      height: 4px;
      background: var(--border-color);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .confidence-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
      border-radius: var(--radius-full);
      transition: width var(--transition-normal);
    }

    .suggestion-title {
      font-size: 1.125rem;
      font-weight: 600;
      margin: var(--space-3) 0;
    }

    .suggestion-description {
      color: var(--text-secondary);
      line-height: 1.6;
      margin-bottom: var(--space-3);
    }

    .reasoning {
      color: var(--text-muted);
      font-style: italic;
    }

    .suggestion-actions {
      display: flex;
      gap: var(--space-3);
      margin-top: var(--space-4);
    }

    .btn-sm {
      padding: var(--space-2) var(--space-4);
      font-size: 0.875rem;
    }

    .insights-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-4);
    }

    .insight-item {
      display: flex;
      align-items: flex-start;
      gap: var(--space-4);
      padding: var(--space-4);
    }

    .insight-item.positive { border-left: 4px solid var(--success); }
    .insight-item.negative { border-left: 4px solid var(--error); }
    .insight-item.neutral { border-left: 4px solid var(--warning); }

    .insight-icon {
      width: 2rem;
      height: 2rem;
      border-radius: var(--radius-full);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .insight-content {
      flex: 1;
    }

    .insight-title {
      font-weight: 600;
      margin-bottom: var(--space-1);
    }

    .insight-description {
      color: var(--text-secondary);
      margin-bottom: var(--space-2);
    }

    .insight-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .timestamp {
      color: var(--text-muted);
    }

    .impact-badge {
      padding: var(--space-1) var(--space-2);
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .impact-badge.positive { background: rgba(16, 185, 129, 0.1); color: var(--success); }
    .impact-badge.negative { background: rgba(239, 68, 68, 0.1); color: var(--error); }
    .impact-badge.neutral { background: rgba(245, 158, 11, 0.1); color: var(--warning); }

    .settings-section {
      margin-top: var(--space-8);
    }

    .settings-title {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: var(--space-6);
    }

    .settings-grid {
      display: grid;
      gap: var(--space-6);
    }

    .setting-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .setting-label {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-weight: 500;
      cursor: pointer;
    }

    .setting-description {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin-left: calc(var(--space-3) + 1.5rem);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .ai-dashboard {
        padding: var(--space-4);
      }

      .dashboard-header {
        flex-direction: column;
        gap: var(--space-4);
        text-align: center;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .suggestions-grid {
        grid-template-columns: 1fr;
      }

      .suggestion-actions {
        flex-direction: column;
      }
    }
  `]
})
export class AiDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  productivityMetrics: ProductivityMetrics | null = null;
  aiSuggestions: AISuggestion[] = [];
  productivityInsights: ProductivityInsight[] = [];

  aiEnabled = true;
  analyticsEnabled = true;
  notificationFrequency = 'realtime';

  metricsList: any[] = [];

  constructor(
    private aiService: AIService,
    private taskService: TaskService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.loadAISettings();
    this.initializeAIDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeAIDashboard(): void {
    // Load tasks and generate AI insights
    combineLatest([
      this.taskService.getTasks(),
      this.aiService.suggestions$,
      this.aiService.insights$
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(([tasks, suggestions, insights]) => {
      if (this.analyticsEnabled) {
        this.aiService.analyzeProductivity(tasks).subscribe(metrics => {
          this.productivityMetrics = metrics;
          this.updateMetricsList();
        });
      }

      if (this.aiEnabled) {
        this.aiService.generateTaskSuggestions(tasks).subscribe();
      }

      this.aiSuggestions = suggestions;
      this.productivityInsights = insights;
    });
  }

  private updateMetricsList(): void {
    if (!this.productivityMetrics) return;

    this.metricsList = [
      {
        icon: 'icon-check-circle',
        iconClass: 'tasks',
        value: this.productivityMetrics.tasksCompleted,
        label: 'Tâches cette semaine',
        trend: '+12%',
        trendIcon: 'icon-trending-up',
        trendClass: 'up'
      },
      {
        icon: 'icon-clock',
        iconClass: 'time',
        value: `${this.productivityMetrics.averageCompletionTime}h`,
        label: 'Temps moyen',
        trend: '-8%',
        trendIcon: 'icon-trending-down',
        trendClass: 'up'
      },
      {
        icon: 'icon-target',
        iconClass: 'score',
        value: this.productivityMetrics.productivityScore,
        label: 'Score productivité',
        trend: '+5%',
        trendIcon: 'icon-trending-up',
        trendClass: 'up'
      },
      {
        icon: 'icon-flame',
        iconClass: 'streak',
        value: this.productivityMetrics.streakDays,
        label: 'Série active',
        trend: null,
        trendIcon: '',
        trendClass: ''
      }
    ];
  }

  getSuggestionIcon(type: string): string {
    const icons = {
      task: 'icon-plus-circle',
      improvement: 'icon-trending-up',
      reminder: 'icon-bell',
      optimization: 'icon-settings'
    };
    return icons[type as keyof typeof icons] || 'icon-lightbulb';
  }

  getSuggestionTypeLabel(type: string): string {
    const labels = {
      task: 'Tâche',
      improvement: 'Amélioration',
      reminder: 'Rappel',
      optimization: 'Optimisation'
    };
    return labels[type as keyof typeof labels] || type;
  }

  getInsightIcon(type: string): string {
    const icons = {
      pattern: 'icon-bar-chart',
      trend: 'icon-trending-up',
      achievement: 'icon-trophy',
      warning: 'icon-alert-triangle'
    };
    return icons[type as keyof typeof icons] || 'icon-info';
  }

  getImpactLabel(impact: string): string {
    const labels = {
      positive: 'Positif',
      negative: 'Négatif',
      neutral: 'Neutre'
    };
    return labels[impact as keyof typeof labels] || impact;
  }

  executeSuggestion(suggestion: AISuggestion): void {
    // Implementation depends on suggestion type
    switch (suggestion.type) {
      case 'task':
        if (suggestion.title.includes('Créer')) {
          const taskTitle = suggestion.title.replace('Créer "', '').replace('"', '');
          this.taskService.createTask({
            title: taskTitle,
            description: suggestion.description,
            priority: suggestion.priority,
            category: 'other'
          }).subscribe();
        }
        break;
      case 'reminder':
        // Handle reminder actions
        break;
      case 'improvement':
        // Handle improvement actions
        break;
    }

    // Remove executed suggestion
    this.aiSuggestions = this.aiSuggestions.filter(s => s.id !== suggestion.id);
  }

  dismissSuggestion(suggestion: AISuggestion): void {
    this.aiSuggestions = this.aiSuggestions.filter(s => s.id !== suggestion.id);
  }

  refreshInsights(): void {
    this.taskService.getTasks().subscribe(tasks => {
      if (this.analyticsEnabled) {
        this.aiService.analyzeProductivity(tasks).subscribe(metrics => {
          this.productivityMetrics = metrics;
          this.updateMetricsList();
        });
      }

      if (this.aiEnabled) {
        this.aiService.generateTaskSuggestions(tasks).subscribe();
      }
    });
  }

  toggleAI(): void {
    this.saveAISettings();
    if (this.aiEnabled) {
      this.refreshInsights();
    }
  }

  toggleAnalytics(): void {
    this.saveAISettings();
    if (this.analyticsEnabled) {
      this.refreshInsights();
    }
  }

  private loadAISettings(): void {
    this.aiEnabled = localStorage.getItem('ai-enabled') !== 'false';
    this.analyticsEnabled = localStorage.getItem('analytics-enabled') !== 'false';
    this.notificationFrequency = localStorage.getItem('notification-frequency') || 'realtime';
  }

  saveAISettings(): void {
    localStorage.setItem('ai-enabled', this.aiEnabled.toString());
    localStorage.setItem('analytics-enabled', this.analyticsEnabled.toString());
    localStorage.setItem('notification-frequency', this.notificationFrequency);
  }
}