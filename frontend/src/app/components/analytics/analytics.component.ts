import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, combineLatest } from 'rxjs';
import { TaskService, Task, TaskStats } from '../../services/task.service';
import { GamificationService } from '../../services/gamification.service';

interface ProductivityMetrics {
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  averageTasksPerDay: number;
  completionRate: number;
  streakDays: number;
  mostProductiveDay: string;
  mostProductiveHour: number;
}

interface CategoryStats {
  category: string;
  total: number;
  completed: number;
  completionRate: number;
  averageCompletionTime: number;
}

interface TrendData {
  date: string;
  completed: number;
  created: number;
  productivity: number;
}

@Component({
  selector: 'app-analytics',
  template: `
    <div class="analytics-dashboard">
      <div class="analytics-header">
        <h1>📊 Analyses Avancées</h1>
        <p class="analytics-subtitle">Insights sur votre productivité et tendances</p>
      </div>

      <!-- Key Metrics Cards -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-icon">✅</div>
          <div class="metric-content">
            <h3>{{ productivityMetrics.tasksCompletedToday }}</h3>
            <p>Tâches complétées aujourd'hui</p>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">📈</div>
          <div class="metric-content">
            <h3>{{ productivityMetrics.completionRate.toFixed(1) }}%</h3>
            <p>Taux de completion</p>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">🔥</div>
          <div class="metric-content">
            <h3>{{ productivityMetrics.streakDays }}</h3>
            <p>Jours consécutifs</p>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">⏰</div>
          <div class="metric-content">
            <h3>{{ productivityMetrics.mostProductiveHour }}h</h3>
            <p>Heure la plus productive</p>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-container">
          <h2>📊 Tendances sur 7 jours</h2>
          <div class="trend-chart">
            <div class="chart-placeholder">
              <div class="trend-bars" *ngFor="let day of trendData; let i = index">
                <div class="bar completed" [style.height.%]="(day.completed / maxCompletedTasks) * 100">
                  <span class="bar-value">{{ day.completed }}</span>
                </div>
                <div class="bar created" [style.height.%]="(day.created / maxCreatedTasks) * 100">
                  <span class="bar-value">{{ day.created }}</span>
                </div>
                <div class="bar-label">{{ getDayLabel(i) }}</div>
              </div>
            </div>
            <div class="chart-legend">
              <div class="legend-item">
                <div class="legend-color completed"></div>
                <span>Complétées</span>
              </div>
              <div class="legend-item">
                <div class="legend-color created"></div>
                <span>Créées</span>
              </div>
            </div>
          </div>
        </div>

        <div class="chart-container">
          <h2>📂 Statistiques par Catégorie</h2>
          <div class="category-stats">
            <div class="category-item" *ngFor="let cat of categoryStats">
              <div class="category-header">
                <span class="category-name">{{ cat.category }}</span>
                <span class="category-count">{{ cat.total }} tâches</span>
              </div>
              <div class="category-progress">
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="cat.completionRate"></div>
                </div>
                <span class="progress-text">{{ cat.completionRate.toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Insights Section -->
      <div class="insights-section">
        <h2>💡 Insights & Recommandations</h2>
        <div class="insights-grid">
          <div class="insight-card" *ngFor="let insight of insights">
            <div class="insight-icon">{{ insight.icon }}</div>
            <div class="insight-content">
              <h4>{{ insight.title }}</h4>
              <p>{{ insight.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Productivity Tips -->
      <div class="tips-section">
        <h2>🚀 Conseils de Productivité</h2>
        <div class="tips-list">
          <div class="tip-item" *ngFor="let tip of productivityTips">
            <div class="tip-number">{{ tip.id }}</div>
            <div class="tip-content">
              <h4>{{ tip.title }}</h4>
              <p>{{ tip.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-dashboard {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .analytics-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .analytics-header h1 {
      color: #2c3e50;
      font-size: 2.5rem;
      margin-bottom: 10px;
    }

    .analytics-subtitle {
      color: #7f8c8d;
      font-size: 1.1rem;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .metric-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 15px;
      transition: transform 0.2s ease;
    }

    .metric-card:hover {
      transform: translateY(-2px);
    }

    .metric-icon {
      font-size: 2rem;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
    }

    .metric-content h3 {
      font-size: 2rem;
      font-weight: bold;
      color: #2c3e50;
      margin: 0 0 5px 0;
    }

    .metric-content p {
      color: #7f8c8d;
      margin: 0;
      font-size: 0.9rem;
    }

    .charts-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 30px;
      margin-bottom: 40px;
    }

    .chart-container {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .chart-container h2 {
      color: #2c3e50;
      margin-bottom: 20px;
      font-size: 1.5rem;
    }

    .trend-chart {
      margin-top: 20px;
    }

    .trend-bars {
      display: flex;
      align-items: end;
      justify-content: space-between;
      height: 200px;
      margin-bottom: 20px;
    }

    .bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 40px;
      position: relative;
    }

    .bar.completed {
      background: linear-gradient(to top, #27ae60, #2ecc71);
      margin-right: 5px;
    }

    .bar.created {
      background: linear-gradient(to top, #e74c3c, #c0392b);
    }

    .bar-value {
      position: absolute;
      top: -25px;
      color: #2c3e50;
      font-weight: bold;
      font-size: 0.8rem;
    }

    .bar-label {
      margin-top: 10px;
      font-size: 0.8rem;
      color: #7f8c8d;
      text-align: center;
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 20px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    .legend-color.completed {
      background: #27ae60;
    }

    .legend-color.created {
      background: #e74c3c;
    }

    .category-stats {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .category-item {
      padding: 15px;
      border: 1px solid #ecf0f1;
      border-radius: 8px;
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .category-name {
      font-weight: bold;
      color: #2c3e50;
    }

    .category-count {
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .category-progress {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: #ecf0f1;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3498db, #2980b9);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 0.9rem;
      font-weight: bold;
      color: #2c3e50;
      min-width: 45px;
    }

    .insights-section, .tips-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
    }

    .insights-section h2, .tips-section h2 {
      color: #2c3e50;
      margin-bottom: 20px;
      font-size: 1.5rem;
    }

    .insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .insight-card {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      padding: 15px;
      border: 1px solid #ecf0f1;
      border-radius: 8px;
      background: #f8f9fa;
    }

    .insight-icon {
      font-size: 1.5rem;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 8px;
      color: white;
      flex-shrink: 0;
    }

    .insight-content h4 {
      color: #2c3e50;
      margin: 0 0 5px 0;
      font-size: 1.1rem;
    }

    .insight-content p {
      color: #7f8c8d;
      margin: 0;
      font-size: 0.9rem;
    }

    .tips-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .tip-item {
      display: flex;
      align-items: flex-start;
      gap: 15px;
      padding: 15px;
      border: 1px solid #ecf0f1;
      border-radius: 8px;
      background: #f8f9fa;
    }

    .tip-number {
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      border-radius: 50%;
      font-weight: bold;
      flex-shrink: 0;
    }

    .tip-content h4 {
      color: #2c3e50;
      margin: 0 0 5px 0;
      font-size: 1.1rem;
    }

    .tip-content p {
      color: #7f8c8d;
      margin: 0;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .analytics-dashboard {
        padding: 10px;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .charts-section {
        grid-template-columns: 1fr;
      }

      .insights-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AnalyticsComponent implements OnInit, OnDestroy {
  productivityMetrics: ProductivityMetrics = {
    tasksCompletedToday: 0,
    tasksCompletedThisWeek: 0,
    averageTasksPerDay: 0,
    completionRate: 0,
    streakDays: 0,
    mostProductiveDay: '',
    mostProductiveHour: 0
  };

  categoryStats: CategoryStats[] = [];
  trendData: TrendData[] = [];
  maxCompletedTasks = 0;
  maxCreatedTasks = 0;

  insights: any[] = [];
  productivityTips: any[] = [];

  private subscriptions: Subscription[] = [];

  constructor(
    private taskService: TaskService,
    private gamificationService: GamificationService
  ) {}

  ngOnInit(): void {
    this.loadAnalyticsData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadAnalyticsData(): void {
    this.subscriptions.push(
      combineLatest([
        this.taskService.getTasks(),
        this.taskService.getTaskStats()
      ]).subscribe(([tasks, stats]) => {
        this.calculateProductivityMetrics(tasks);
        this.calculateCategoryStats(tasks);
        this.generateTrendData(tasks);
        this.generateInsights(tasks, stats);
        this.generateProductivityTips();
      })
    );
  }

  private calculateProductivityMetrics(tasks: Task[]): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const completedTasks = tasks.filter(task => task.completed);
    const tasksCompletedToday = completedTasks.filter(task =>
      new Date(task.updatedAt) >= today
    ).length;

    const tasksCompletedThisWeek = completedTasks.filter(task =>
      new Date(task.updatedAt) >= weekAgo
    ).length;

    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    // Calculate streak
    let streakDays = 0;
    const currentDate = new Date(today);

    while (true) {
      const dayTasks = completedTasks.filter(task => {
        const taskDate = new Date(task.updatedAt);
        return taskDate.toDateString() === currentDate.toDateString();
      });

      if (dayTasks.length === 0) break;
      streakDays++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Calculate most productive hour (simplified)
    const hourCounts: Record<number, number> = {};
    completedTasks.forEach(task => {
      const hour = new Date(task.updatedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const mostProductiveHour = Object.keys(hourCounts).reduce((a, b) =>
      hourCounts[+a] > hourCounts[+b] ? a : b, '9'
    );

    this.productivityMetrics = {
      tasksCompletedToday,
      tasksCompletedThisWeek,
      averageTasksPerDay: Math.round(tasksCompletedThisWeek / 7 * 10) / 10,
      completionRate,
      streakDays,
      mostProductiveDay: this.getMostProductiveDay(completedTasks),
      mostProductiveHour: +mostProductiveHour
    };
  }

  private calculateCategoryStats(tasks: Task[]): void {
    const categories = ['work', 'personal', 'shopping', 'health', 'education', 'other'];
    this.categoryStats = categories.map(category => {
      const categoryTasks = tasks.filter(task => task.category === category);
      const completed = categoryTasks.filter(task => task.completed).length;
      const completionRate = categoryTasks.length > 0 ? (completed / categoryTasks.length) * 100 : 0;

      return {
        category: this.capitalizeFirst(category),
        total: categoryTasks.length,
        completed,
        completionRate,
        averageCompletionTime: this.calculateAverageCompletionTime(categoryTasks)
      };
    }).filter(stat => stat.total > 0);
  }

  private generateTrendData(tasks: Task[]): void {
    const now = new Date();
    this.trendData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];

      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
        return taskDate === dateStr;
      });

      const completedTasks = tasks.filter(task => {
        if (!task.completed) return false;
        const taskDate = new Date(task.updatedAt).toISOString().split('T')[0];
        return taskDate === dateStr;
      });

      this.trendData.push({
        date: dateStr,
        completed: completedTasks.length,
        created: dayTasks.length,
        productivity: completedTasks.length // Simplified productivity metric
      });
    }

    this.maxCompletedTasks = Math.max(...this.trendData.map(d => d.completed), 1);
    this.maxCreatedTasks = Math.max(...this.trendData.map(d => d.created), 1);
  }

  private generateInsights(tasks: Task[], stats: TaskStats): void {
    this.insights = [];

    const completionRate = this.productivityMetrics.completionRate;
    if (completionRate > 80) {
      this.insights.push({
        icon: '🎯',
        title: 'Excellente Productivité',
        description: 'Votre taux de completion est excellent ! Continuez sur cette lancée.'
      });
    } else if (completionRate < 50) {
      this.insights.push({
        icon: '📈',
        title: 'Amélioration Possible',
        description: 'Considérez de diviser les grandes tâches en plus petites pour améliorer votre taux de completion.'
      });
    }

    if (this.productivityMetrics.streakDays > 5) {
      this.insights.push({
        icon: '🔥',
        title: 'Série Impressionnante',
        description: `Vous maintenez une série de ${this.productivityMetrics.streakDays} jours !`
      });
    }

    const overdueTasks = tasks.filter(task =>
      !task.completed && task.dueDate && new Date(task.dueDate) < new Date()
    ).length;

    if (overdueTasks > 0) {
      this.insights.push({
        icon: '⏰',
        title: 'Tâches en Retard',
        description: `Vous avez ${overdueTasks} tâche(s) en retard. Priorisez-les pour éviter l'accumulation.`
      });
    }

    if (this.insights.length === 0) {
      this.insights.push({
        icon: '💡',
        title: 'Commencez à Traquer',
        description: 'Complétez plus de tâches pour obtenir des insights personnalisés sur votre productivité.'
      });
    }
  }

  private generateProductivityTips(): void {
    this.productivityTips = [
      {
        id: 1,
        title: 'Technique Pomodoro',
        description: 'Travaillez 25 minutes intensivement, puis prenez une pause de 5 minutes. Répétez 4 fois puis prenez une pause plus longue.'
      },
      {
        id: 2,
        title: 'Règle des 2 Minutes',
        description: 'Si une tâche prend moins de 2 minutes, faites-la immédiatement plutôt que de la reporter.'
      },
      {
        id: 3,
        title: 'Priorisation Eisenhower',
        description: 'Classe les tâches selon leur urgence et importance : Urgent/Important, Important/Pas Urgent, Urgent/Pas Important, Ni Urgent/Ni Important.'
      },
      {
        id: 4,
        title: 'Tâches par Blocs',
        description: 'Regroupez les tâches similaires et traitez-les en blocs pour maintenir votre focus et réduire le changement de contexte.'
      },
      {
        id: 5,
        title: 'Révision Quotidienne',
        description: 'Prenez 10 minutes chaque soir pour planifier le lendemain et célébrer vos accomplissements de la journée.'
      }
    ];
  }

  private getMostProductiveDay(completedTasks: Task[]): string {
    const dayCounts: Record<string, number> = {};
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

    completedTasks.forEach(task => {
      const day = new Date(task.updatedAt).getDay();
      dayCounts[days[day]] = (dayCounts[days[day]] || 0) + 1;
    });

    const mostProductiveDay = Object.keys(dayCounts).reduce((a, b) =>
      dayCounts[a] > dayCounts[b] ? a : b, 'Lundi'
    );

    return mostProductiveDay;
  }

  private calculateAverageCompletionTime(tasks: Task[]): number {
    const completedTasks = tasks.filter(task => task.completed);
    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum, task) => {
      const created = new Date(task.createdAt);
      const completed = new Date(task.updatedAt);
      return sum + (completed.getTime() - created.getTime());
    }, 0);

    return totalTime / completedTasks.length / (1000 * 60 * 60); // Convert to hours
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  getDayLabel(index: number): string {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const now = new Date();
    const targetDate = new Date(now.getTime() - (6 - index) * 24 * 60 * 60 * 1000);
    return days[targetDate.getDay()];
  }
}