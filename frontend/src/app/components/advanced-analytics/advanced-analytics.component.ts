import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, combineLatest, interval } from 'rxjs';
import { TaskService, Task, TaskStats } from '../../services/task.service';
import { GamificationService } from '../../services/gamification.service';
import { NotificationApiService } from '../../services/notification-api.service';

interface ProductivityMetrics {
  tasksCompletedToday: number;
  tasksCompletedThisWeek: number;
  tasksCompletedThisMonth: number;
  averageTasksPerDay: number;
  completionRate: number;
  streakDays: number;
  mostProductiveDay: string;
  mostProductiveHour: number;
  totalFocusTime: number;
  averageTaskCompletionTime: number;
  productivityScore: number;
}

interface CategoryStats {
  category: string;
  total: number;
  completed: number;
  completionRate: number;
  averageCompletionTime: number;
  trend: 'up' | 'down' | 'stable';
}

interface TrendData {
  date: string;
  completed: number;
  created: number;
  productivity: number;
  focusTime: number;
}

interface TimeDistribution {
  hour: number;
  tasks: number;
  productivity: number;
}

interface AchievementProgress {
  category: string;
  current: number;
  target: number;
  percentage: number;
}

interface PredictiveForecast {
  date: string;
  predictedTasks: number;
  confidence: number;
}

@Component({
  selector: 'app-advanced-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="advanced-analytics-wrapper">
      <!-- Header -->
      <div class="analytics-header glass-card">
        <div class="header-content">
          <h1 class="header-title">
            <i class="header-icon">📊</i>
            Advanced Analytics Dashboard
          </h1>
          <p class="header-subtitle">Comprehensive insights into your productivity and performance</p>
        </div>

        <!-- Controls -->
        <div class="header-controls">
          <div class="period-selector">
            <label for="period">Time Period:</label>
            <select id="period" [(ngModel)]="selectedPeriod" (change)="updatePeriod()">
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>
          </div>

          <button class="export-btn" (click)="exportData()">
            <i class="export-icon">📥</i>
            Export Data
          </button>

          <button class="refresh-btn" (click)="refreshData()">
            <i class="refresh-icon">🔄</i>
            Refresh
          </button>
        </div>
      </div>

      <!-- Key Performance Indicators -->
      <div class="kpi-section">
        <h2 class="section-title">Key Performance Indicators</h2>
        <div class="kpi-grid">
          <div class="kpi-card primary">
            <div class="kpi-icon">🎯</div>
            <div class="kpi-content">
              <div class="kpi-value">{{ productivityMetrics.productivityScore }}</div>
              <div class="kpi-label">Productivity Score</div>
              <div class="kpi-trend" [class]="getTrendClass(productivityTrend)">
                <i class="trend-icon">{{ getTrendIcon(productivityTrend) }}</i>
                <span>{{ productivityTrend }}%</span>
              </div>
            </div>
          </div>

          <div class="kpi-card success">
            <div class="kpi-icon">✅</div>
            <div class="kpi-content">
              <div class="kpi-value">{{ productivityMetrics.tasksCompletedToday }}</div>
              <div class="kpi-label">Tasks Today</div>
              <div class="kpi-subtext">+{{ productivityMetrics.tasksCompletedThisWeek }} this week</div>
            </div>
          </div>

          <div class="kpi-card info">
            <div class="kpi-icon">📈</div>
            <div class="kpi-content">
              <div class="kpi-value">{{ productivityMetrics.completionRate.toFixed(1) }}%</div>
              <div class="kpi-label">Completion Rate</div>
              <div class="kpi-subtext">Overall task completion</div>
            </div>
          </div>

          <div class="kpi-card warning">
            <div class="kpi-icon">🔥</div>
            <div class="kpi-content">
              <div class="kpi-value">{{ productivityMetrics.streakDays }}</div>
              <div class="kpi-label">Current Streak</div>
              <div class="kpi-subtext">Days in a row</div>
            </div>
          </div>

          <div class="kpi-card secondary">
            <div class="kpi-icon">⏰</div>
            <div class="kpi-content">
              <div class="kpi-value">{{ formatTime(productivityMetrics.totalFocusTime) }}</div>
              <div class="kpi-label">Focus Time</div>
              <div class="kpi-subtext">Total this {{ selectedPeriod }}</div>
            </div>
          </div>

          <div class="kpi-card accent">
            <div class="kpi-icon">⚡</div>
            <div class="kpi-content">
              <div class="kpi-value">{{ productivityMetrics.mostProductiveHour }}:00</div>
              <div class="kpi-label">Peak Hour</div>
              <div class="kpi-subtext">Most productive time</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-row">
          <!-- Productivity Trends -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>Productivity Trends</h3>
              <div class="chart-controls">
                <button class="chart-toggle" [class.active]="chartView === 'bar'" (click)="chartView = 'bar'">Bar</button>
                <button class="chart-toggle" [class.active]="chartView === 'line'" (click)="chartView = 'line'">Line</button>
              </div>
            </div>
            <div class="chart-container">
              <div class="trend-chart" *ngIf="chartView === 'bar'">
                <div class="chart-bars">
                  <div class="bar-group" *ngFor="let day of trendData; let i = index">
                    <div class="bar completed-bar" [style.height.%]="getBarHeight(day.completed, 'completed')">
                      <span class="bar-value">{{ day.completed }}</span>
                    </div>
                    <div class="bar created-bar" [style.height.%]="getBarHeight(day.created, 'created')">
                      <span class="bar-value">{{ day.created }}</span>
                    </div>
                    <div class="bar-label">{{ getDayLabel(i) }}</div>
                  </div>
                </div>
              </div>
              <div class="line-chart" *ngIf="chartView === 'line'">
                <svg class="productivity-line" viewBox="0 0 400 200">
                  <polyline
                    [attr.points]="getLinePoints()"
                    fill="none"
                    stroke="#667eea"
                    stroke-width="3"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <circle
                    *ngFor="let point of getLineDataPoints(); let i = index"
                    [attr.cx]="point.x"
                    [attr.cy]="point.y"
                    r="4"
                    fill="#667eea"
                    class="data-point"
                  />
                </svg>
              </div>
              <div class="chart-legend">
                <div class="legend-item">
                  <div class="legend-color completed"></div>
                  <span>Completed Tasks</span>
                </div>
                <div class="legend-item">
                  <div class="legend-color created"></div>
                  <span>Created Tasks</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Time Distribution -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>Productivity by Hour</h3>
            </div>
            <div class="chart-container">
              <div class="time-distribution">
                <div class="hour-bar" *ngFor="let hour of timeDistribution">
                  <div class="hour-label">{{ hour.hour }}:00</div>
                  <div class="hour-progress">
                    <div class="progress-fill" [style.width.%]="(hour.tasks / maxTasksPerHour) * 100"></div>
                    <span class="progress-value">{{ hour.tasks }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

          <!-- Team Heatmap / What-if Row -->
          <div class="chart-row">
            <div class="chart-card heatmap-card">
              <div class="chart-header">
                <h3>Team Activity Heatmap</h3>
              </div>
              <div class="chart-container heatmap-container">
                <div class="heatmap-grid">
                  <div class="heatmap-row header">
                    <div class="cell header-cell">Member</div>
                    <div class="cell" *ngFor="let d of trendData">{{ d.date.split('-').slice(1).join('-') }}</div>
                  </div>
                  <div class="heatmap-row" *ngFor="let row of teamHeatmap">
                    <div class="cell member-cell">{{ row.member }}</div>
                    <div class="cell" *ngFor="let v of row.values" [style.background]="getHeatmapColor(v)">
                      <span class="cell-value">{{ v }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="chart-card small-card">
              <div class="chart-header">
                <h3>What-if Simulator</h3>
              </div>
              <div class="chart-container">
                <p class="muted">Simulate a productivity improvement scenario. (Prototype) → Increase average completion by 10% to see projected KPI changes.</p>
                <button class="action-btn" (click)="simulateWhatIf()">Simulate +10% Productivity</button>
              </div>
            </div>
          </div>

        <div class="chart-row">
          <!-- Category Performance -->
          <div class="chart-card full-width">
            <div class="chart-header">
              <h3>Performance by Category</h3>
            </div>
            <div class="chart-container">
              <div class="category-performance">
                <div class="category-item" *ngFor="let cat of categoryStats">
                  <div class="category-header">
                    <span class="category-name">{{ cat.category }}</span>
                    <div class="category-metrics">
                      <span class="category-count">{{ cat.completed }}/{{ cat.total }}</span>
                      <span class="category-rate">{{ cat.completionRate.toFixed(1) }}%</span>
                      <div class="trend-indicator" [class]="cat.trend">
                        <i class="trend-icon">{{ getTrendIcon(cat.trend === 'up' ? 10 : cat.trend === 'down' ? -10 : 0) }}</i>
                      </div>
                    </div>
                  </div>
                  <div class="category-progress">
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="cat.completionRate"></div>
                    </div>
                  </div>
                  <div class="category-details">
                    <span>Avg. completion: {{ formatTime(cat.averageCompletionTime) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Executive Summary (AI) -->
      <div class="executive-summary-section">
        <h2 class="section-title">Executive Summary</h2>
        <div class="summary-card glass-card">
          <div class="summary-header">
            <h3>AI Quick Summary</h3>
            <div class="summary-controls">
              <button class="regen-btn" (click)="generateAiSummary()">Regenerate</button>
              <button class="copy-btn" (click)="copySummary()">Copy</button>
              <button class="export-btn" (click)="exportSummary()">Export</button>
            </div>
          </div>
          <div class="summary-body">
            <p *ngIf="aiSummary; else noSummary">{{ aiSummary }}</p>
            <ng-template #noSummary>
              <p class="muted">AI summary not generated yet. Click "Regenerate" to create an executive summary with actionables.</p>
            </ng-template>
          </div>
          <div class="summary-footer" *ngIf="aiInsightsGeneratedAt">
            <small>Generated at: {{ aiInsightsGeneratedAt | date:'short' }}</small>
          </div>
        </div>
      </div>

      <!-- Insights & Recommendations -->
      <div class="insights-section">
        <h2 class="section-title">AI-Powered Insights</h2>
        <div class="insights-grid">
          <div class="insight-card" *ngFor="let insight of insights">
            <div class="insight-icon">{{ insight.icon }}</div>
            <div class="insight-content">
              <h4>{{ insight.title }}</h4>
              <p>{{ insight.description }}</p>
              <div class="insight-action" *ngIf="insight.action">
                <button class="action-btn" (click)="performInsightAction(insight.action)">
                  {{ insight.action.label }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Achievement Progress -->
      <div class="achievements-section">
        <h2 class="section-title">Achievement Progress</h2>
        <div class="achievements-grid">
          <div class="achievement-card" *ngFor="let achievement of achievementProgress">
            <div class="achievement-icon">🏆</div>
            <div class="achievement-content">
              <h4>{{ achievement.category }}</h4>
              <div class="achievement-progress">
                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="achievement.percentage"></div>
                </div>
                <span class="progress-text">{{ achievement.current }}/{{ achievement.target }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Productivity Tips -->
      <div class="tips-section">
        <h2 class="section-title">Productivity Tips</h2>
        <div class="tips-carousel">
          <div class="tip-card" *ngFor="let tip of productivityTips; let i = index" [class.active]="currentTipIndex === i">
            <div class="tip-number">{{ tip.id }}</div>
            <div class="tip-content">
              <h3>{{ tip.title }}</h3>
              <p>{{ tip.description }}</p>
            </div>
          </div>
        </div>
        <div class="carousel-controls">
          <button class="carousel-btn" (click)="previousTip()" [disabled]="currentTipIndex === 0">←</button>
          <span class="carousel-indicator">{{ currentTipIndex + 1 }} / {{ productivityTips.length }}</span>
          <button class="carousel-btn" (click)="nextTip()" [disabled]="currentTipIndex === productivityTips.length - 1">→</button>
        </div>
      </div>

      <!-- Predictive Forecasting -->
      <div class="forecast-section">
        <h2 class="section-title">Predictive Forecasting</h2>
        <div class="forecast-grid">
          <div class="forecast-card" *ngFor="let forecast of predictiveForecast">
            <div class="forecast-date">{{ forecast.date }}</div>
            <div class="forecast-tasks">Predicted Tasks: {{ forecast.predictedTasks }}</div>
            <div class="forecast-confidence">Confidence: {{ (forecast.confidence * 100).toFixed(1) }}%</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .advanced-analytics-wrapper {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      min-height: 100vh;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    /* Header */
    .analytics-header {
      margin-bottom: 2rem;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .header-content {
      text-align: center;
      margin-bottom: 2rem;
    }

    .header-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      font-size: 2.5rem;
      font-weight: 700;
      color: #2c3e50;
      margin: 0 0 0.5rem 0;
    }

    .header-icon {
      font-size: 3rem;
    }

    .header-subtitle {
      color: #6c757d;
      font-size: 1.2rem;
      margin: 0;
    }

    .header-controls {
      display: flex;
      justify-content: center;
      gap: 1rem;
      align-items: center;
    }

    .period-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .period-selector label {
      font-weight: 600;
      color: #495057;
    }

    .period-selector select {
      padding: 0.5rem 1rem;
      border: 2px solid rgba(102, 126, 234, 0.2);
      border-radius: 10px;
      background: white;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .period-selector select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .export-btn, .refresh-btn {
      padding: 0.8rem 1.5rem;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
    }

    .export-btn {
      background: rgba(52, 152, 219, 0.1);
      color: #3498db;
    }

    .export-btn:hover {
      background: #3498db;
      color: white;
      transform: translateY(-2px);
    }

    .refresh-btn {
      background: rgba(155, 89, 182, 0.1);
      color: #9b59b6;
    }

    .refresh-btn:hover {
      background: #9b59b6;
      color: white;
      transform: translateY(-2px);
    }

    /* KPI Section */
    .kpi-section {
      margin-bottom: 3rem;
    }

    .section-title {
      font-size: 1.8rem;
      font-weight: 700;
      color: #2c3e50;
      margin: 0 0 1.5rem 0;
      text-align: center;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .kpi-card {
      padding: 1.5rem;
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .kpi-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .kpi-card.primary {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
      border-color: rgba(102, 126, 234, 0.3);
    }

    .kpi-card.success {
      background: linear-gradient(135deg, rgba(39, 174, 96, 0.1), rgba(46, 204, 113, 0.1));
      border-color: rgba(39, 174, 96, 0.3);
    }

    .kpi-card.info {
      background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(41, 128, 185, 0.1));
      border-color: rgba(52, 152, 219, 0.3);
    }

    .kpi-card.warning {
      background: linear-gradient(135deg, rgba(230, 126, 34, 0.1), rgba(211, 84, 0, 0.1));
      border-color: rgba(230, 126, 34, 0.3);
    }

    .kpi-card.secondary {
      background: linear-gradient(135deg, rgba(108, 117, 125, 0.1), rgba(127, 140, 141, 0.1));
      border-color: rgba(108, 117, 125, 0.3);
    }

    .kpi-card.accent {
      background: linear-gradient(135deg, rgba(155, 89, 182, 0.1), rgba(142, 68, 173, 0.1));
      border-color: rgba(155, 89, 182, 0.3);
    }

    .kpi-icon {
      font-size: 2.5rem;
      width: 70px;
      height: 70px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.9);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .kpi-content {
      flex: 1;
    }

    .kpi-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 0.25rem;
    }

    .kpi-label {
      font-size: 1rem;
      font-weight: 600;
      color: #495057;
      margin-bottom: 0.25rem;
    }

    .kpi-subtext {
      font-size: 0.85rem;
      color: #6c757d;
    }

    .kpi-trend {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.85rem;
      font-weight: 600;
      margin-top: 0.5rem;
    }

    .kpi-trend.positive {
      color: #27ae60;
    }

    .kpi-trend.negative {
      color: #e74c3c;
    }

    .kpi-trend.neutral {
      color: #95a5a6;
    }

    /* Charts Section */
    .charts-section {
      margin-bottom: 3rem;
    }

    .chart-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .chart-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .chart-card.full-width {
      grid-column: 1 / -1;
    }

    .chart-header {
      padding: 1.5rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chart-header h3 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .chart-controls {
      display: flex;
      gap: 0.5rem;
    }

    .chart-toggle {
      padding: 0.4rem 0.8rem;
      border: 2px solid rgba(102, 126, 234, 0.2);
      background: transparent;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .chart-toggle.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .chart-container {
      padding: 1.5rem;
    }

    /* Trend Chart */
    .trend-chart {
      height: 300px;
    }

    .chart-bars {
      display: flex;
      align-items: end;
      justify-content: space-between;
      height: 250px;
      padding: 0 1rem;
    }

    .bar-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      flex: 1;
    }

    .bar {
      width: 100%;
      max-width: 40px;
      border-radius: 4px 4px 0 0;
      position: relative;
      display: flex;
      align-items: end;
      justify-content: center;
      color: white;
      font-size: 0.8rem;
      font-weight: 600;
      min-height: 20px;
      transition: all 0.3s ease;
    }

    .completed-bar {
      background: linear-gradient(180deg, #27ae60, #2ecc71);
    }

    .created-bar {
      background: linear-gradient(180deg, #3498db, #5dade2);
    }

    .bar-value {
      position: absolute;
      top: -20px;
      color: #2c3e50;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .bar-label {
      margin-top: 0.5rem;
      font-size: 0.8rem;
      color: #6c757d;
      font-weight: 500;
    }

    /* Line Chart */
    .line-chart {
      height: 250px;
      padding: 1rem;
    }

    .productivity-line {
      width: 100%;
      height: 100%;
    }

    .data-point {
      transition: all 0.3s ease;
    }

    .data-point:hover {
      r: 6;
      fill: #764ba2;
    }

    /* Time Distribution */
    .time-distribution {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .hour-bar {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .hour-label {
      width: 60px;
      font-size: 0.9rem;
      color: #495057;
      font-weight: 500;
    }

    .hour-progress {
      flex: 1;
      position: relative;
    }

    .progress-fill {
      height: 24px;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 12px;
      transition: width 0.5s ease;
    }

    .progress-value {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      color: white;
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* Chart Legend */
    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-top: 1rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
      color: #495057;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 3px;
    }

    .legend-color.completed {
      background: linear-gradient(180deg, #27ae60, #2ecc71);
    }

    .legend-color.created {
      background: linear-gradient(180deg, #3498db, #5dade2);
    }

    /* Category Performance */
    .category-performance {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .category-item {
      padding: 1rem;
      background: rgba(248, 249, 250, 0.8);
      border-radius: 12px;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .category-name {
      font-weight: 600;
      color: #2c3e50;
    }

    .category-metrics {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.9rem;
    }

    .category-count {
      color: #6c757d;
    }

    .category-rate {
      color: #27ae60;
      font-weight: 600;
    }

    .trend-indicator {
      display: flex;
      align-items: center;
    }

    .trend-indicator.up .trend-icon {
      color: #27ae60;
    }

    .trend-indicator.down .trend-icon {
      color: #e74c3c;
    }

    .trend-indicator.stable .trend-icon {
      color: #95a5a6;
    }

    .category-progress {
      margin-bottom: 0.5rem;
    }

    .progress-bar {
      height: 8px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    .category-details {
      font-size: 0.85rem;
      color: #6c757d;
    }

    /* Insights Section */
    .insights-section {
      margin-bottom: 3rem;
    }

    .insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .insight-card {
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      display: flex;
      gap: 1rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .insight-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .insight-icon {
      font-size: 2rem;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .insight-content {
      flex: 1;
    }

    .insight-content h4 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .insight-content p {
      margin: 0 0 1rem 0;
      color: #6c757d;
      line-height: 1.5;
    }

    .insight-action {
      margin-top: 1rem;
    }

    .action-btn {
      padding: 0.6rem 1.2rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .action-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    /* Achievements Section */
    .achievements-section {
      margin-bottom: 3rem;
    }

    .achievements-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .achievement-card {
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .achievement-icon {
      font-size: 2rem;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #f39c12, #e67e22);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .achievement-content {
      flex: 1;
    }

    .achievement-content h4 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .achievement-progress {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .progress-text {
      font-size: 0.9rem;
      color: #6c757d;
      font-weight: 500;
    }

    /* Tips Section */
    .tips-section {
      margin-bottom: 2rem;
    }

    .tips-carousel {
      position: relative;
      height: 200px;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .tip-card {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      display: flex;
      align-items: center;
      gap: 2rem;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.5s ease;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .tip-card.active {
      opacity: 1;
      transform: translateX(0);
    }

    .tip-number {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .tip-content {
      flex: 1;
    }

    .tip-content h3 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 1.3rem;
      font-weight: 600;
    }

    .tip-content p {
      margin: 0;
      color: #6c757d;
      line-height: 1.6;
    }

    .carousel-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
    }

    .carousel-btn {
      width: 40px;
      height: 40px;
      border: 2px solid rgba(102, 126, 234, 0.2);
      background: white;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      transition: all 0.3s ease;
    }

    .carousel-btn:hover:not(:disabled) {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .carousel-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .carousel-indicator {
      font-weight: 600;
      color: #495057;
    }

    /* Forecast Section */
    .forecast-section {
      margin-top: 3rem;
    }

    .forecast-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .forecast-card {
      padding: 1.5rem;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .forecast-date {
      font-size: 1rem;
      font-weight: 600;
      color: #2c3e50;
    }

    .forecast-tasks {
      font-size: 1.2rem;
      font-weight: 700;
      color: #27ae60;
    }

    .forecast-confidence {
      font-size: 0.9rem;
      color: #6c757d;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .advanced-analytics-wrapper {
        padding: 1rem;
      }

      .header-controls {
        flex-direction: column;
        gap: 1rem;
      }

      .kpi-grid {
        grid-template-columns: 1fr;
      }

      .chart-row {
        grid-template-columns: 1fr;
      }

      .insights-grid {
        grid-template-columns: 1fr;
      }

      .achievements-grid {
        grid-template-columns: 1fr;
      }

      .tip-card {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
      }

      .carousel-controls {
        flex-direction: column;
        gap: 0.5rem;
      }
    }

    /* Executive Summary Section */
    .executive-summary-section {
      margin-bottom: 3rem;
    }

    .summary-card {
      padding: 2rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }

    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid rgba(102, 126, 234, 0.1);
    }

    .summary-header h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .summary-header h3::before {
      content: '🤖';
      font-size: 1.8rem;
    }

    .summary-controls {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .regen-btn, .copy-btn, .export-btn {
      padding: 0.6rem 1.2rem;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .regen-btn {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .regen-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    .regen-btn:active {
      transform: translateY(0);
    }

    .copy-btn {
      background: linear-gradient(135deg, #27ae60, #2ecc71);
      color: white;
      box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
    }

    .copy-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(39, 174, 96, 0.4);
    }

    .copy-btn:active {
      transform: translateY(0);
    }

    .export-btn {
      background: linear-gradient(135deg, #f39c12, #e67e22);
      color: white;
      box-shadow: 0 4px 15px rgba(243, 156, 18, 0.3);
    }

    .export-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(243, 156, 18, 0.4);
    }

    .export-btn:active {
      transform: translateY(0);
    }

    .summary-body {
      margin-bottom: 1.5rem;
    }

    .summary-body p {
      font-size: 1rem;
      line-height: 1.7;
      color: #495057;
      margin: 0;
    }

    .summary-body .muted {
      color: #6c757d;
      font-style: italic;
    }

    .summary-footer {
      padding-top: 1rem;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      text-align: right;
    }

    .summary-footer small {
      color: #6c757d;
      font-size: 0.85rem;
    }

    /* Glass Card Utility */
    .glass-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }
  `]
})
export class AdvancedAnalyticsComponent implements OnInit, OnDestroy {
  productivityMetrics: ProductivityMetrics = {
    tasksCompletedToday: 0,
    tasksCompletedThisWeek: 0,
    tasksCompletedThisMonth: 0,
    averageTasksPerDay: 0,
    completionRate: 0,
    streakDays: 0,
    mostProductiveDay: '',
    mostProductiveHour: 0,
    totalFocusTime: 0,
    averageTaskCompletionTime: 0,
    productivityScore: 0
  };

  categoryStats: CategoryStats[] = [];
  trendData: TrendData[] = [];
  timeDistribution: TimeDistribution[] = [];
  achievementProgress: AchievementProgress[] = [];
  predictiveForecast: PredictiveForecast[] = [];

  maxCompletedTasks = 0;
  maxCreatedTasks = 0;
  maxTasksPerHour = 0;
  productivityTrend = 0;
  selectedPeriod = '7d';
  chartView: 'bar' | 'line' = 'bar';
  currentTipIndex = 0;

  insights: any[] = [];
  productivityTips: any[] = [];
  // New AI/Heatmap features
  aiSummary: string | null = null;
  aiInsightsGeneratedAt: Date | null = null;
  teamHeatmap: { member: string; values: number[] }[] = [];
  heatmapMax = 0;

  private subscriptions: Subscription[] = [];

  constructor(
    private taskService: TaskService,
    private gamificationService: GamificationService,
    private notificationService: NotificationApiService
  ) {}

  ngOnInit(): void {
    this.loadAnalyticsData();
    this.startAutoRefresh();
    this.generateMockForecastData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadAnalyticsData(): void {
    this.subscriptions.push(
      combineLatest([
        this.taskService.getTasks(),
        this.taskService.getTaskStats(),
        this.gamificationService.getAchievements()
      ]).subscribe(([tasks, stats, achievements]) => {
        this.calculateProductivityMetrics(tasks);
        this.calculateCategoryStats(tasks);
        this.generateTrendData(tasks);
        this.generateTimeDistribution(tasks);
        this.generateAchievementProgress(achievements.achievements || []);
        this.generateInsights(tasks, stats);
        this.generateProductivityTips();
        // New: generate AI summary and heatmap prototype
        this.generateAiSummary();
        this.generateTeamHeatmap(tasks);
      })
    );
  }

  // AI Executive summary (mock/prototype)
  generateAiSummary(): void {
    // Create a compact, action-oriented summary based on current metrics (mocked)
    this.aiSummary = `In the last ${this.selectedPeriod}, your productivity score is ${this.productivityMetrics.productivityScore}. Your completion rate is ${this.productivityMetrics.completionRate.toFixed(1)}% and your current streak is ${this.productivityMetrics.streakDays} days. Actionable: schedule high-priority tasks during ${this.productivityMetrics.mostProductiveHour}:00, break large tasks into smaller steps, and consider a focused Pomodoro session today.`;
    this.aiInsightsGeneratedAt = new Date();
  }

  copySummary(): void {
    if (!this.aiSummary) return;
    navigator.clipboard?.writeText(this.aiSummary).then(() => {
      console.log('Summary copied to clipboard');
    }).catch(() => {
      console.warn('Clipboard API unavailable');
    });
  }

  exportSummary(): void {
    if (!this.aiSummary) return;
    const blob = new Blob([this.aiSummary], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `executive-summary-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  // Team heatmap prototype generation
  generateTeamHeatmap(tasks: Task[]): void {
    // Mock members and generate per-day activity counts using trendData length
    const members = ['Alice', 'Bob', 'Carla', 'Diego', 'Eva'];
    const days = this.trendData.length || 7;
    this.teamHeatmap = members.map(m => {
      const values = Array.from({ length: days }, () => Math.floor(Math.random() * 10));
      return { member: m, values };
    });
    this.heatmapMax = this.teamHeatmap.reduce((mx, r) => Math.max(mx, ...r.values), 0);
  }

  getHeatmapColor(value: number): string {
    if (this.heatmapMax === 0) return '#f1f3f5';
    const ratio = value / this.heatmapMax;
    // gradient from light to strong
    const start = [241, 243, 245]; // light
    const end = [102, 126, 234]; // blue
    const r = Math.round(start[0] + (end[0] - start[0]) * ratio);
    const g = Math.round(start[1] + (end[1] - start[1]) * ratio);
    const b = Math.round(start[2] + (end[2] - start[2]) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  }

  simulateWhatIf(): void {
    // Simple prototype: bump productivity score by 10% and show toast/log
    const before = this.productivityMetrics.productivityScore;
    this.productivityMetrics.productivityScore = Math.min(100, Math.round(before * 1.1));
    this.insights.unshift({ icon: '🔮', title: 'What-if Result', description: `Projected productivity score increased from ${before} to ${this.productivityMetrics.productivityScore}.` });
  }

  calculateProductivityMetrics(tasks: Task[]): void {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const periodDays = this.getPeriodDays();

    // Calculate date ranges
    const periodStart = new Date(today.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const completedTasks = tasks.filter(task => task.completed);
    const periodTasks = tasks.filter(task =>
      new Date(task.createdAt) >= periodStart
    );
    const periodCompletedTasks = completedTasks.filter(task =>
      new Date(task.updatedAt) >= periodStart
    );

    // Basic metrics
    this.productivityMetrics.tasksCompletedToday = completedTasks.filter(task =>
      new Date(task.updatedAt) >= today
    ).length;

    this.productivityMetrics.tasksCompletedThisWeek = completedTasks.filter(task =>
      new Date(task.updatedAt) >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    ).length;

    this.productivityMetrics.tasksCompletedThisMonth = completedTasks.filter(task =>
      new Date(task.updatedAt) >= new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
    ).length;

    this.productivityMetrics.completionRate = periodTasks.length > 0 ?
      (periodCompletedTasks.length / periodTasks.length) * 100 : 0;

    // Advanced metrics
    this.productivityMetrics.averageTasksPerDay = periodDays > 0 ?
      periodCompletedTasks.length / periodDays : 0;

    this.productivityMetrics.streakDays = this.calculateStreak(tasks);
    this.productivityMetrics.mostProductiveDay = this.getMostProductiveDay(completedTasks);
    this.productivityMetrics.mostProductiveHour = this.getMostProductiveHour(completedTasks);
    this.productivityMetrics.totalFocusTime = this.calculateTotalFocusTime(tasks);
    this.productivityMetrics.averageTaskCompletionTime = this.calculateAverageCompletionTime(completedTasks);

    // Productivity score (0-100)
    this.productivityMetrics.productivityScore = Math.min(100, Math.round(
      (this.productivityMetrics.completionRate * 0.4) +
      (Math.min(this.productivityMetrics.streakDays * 2, 20) * 0.3) +
      (Math.min(this.productivityMetrics.averageTasksPerDay * 5, 30) * 0.3)
    ));

    // Calculate trend
    this.productivityTrend = this.calculateProductivityTrend(tasks);
  }

  calculateCategoryStats(tasks: Task[]): void {
    const categories = ['Work', 'Personal', 'Health', 'Learning', 'Other'];
    this.categoryStats = categories.map(category => {
      const categoryTasks = tasks.filter(task => task.category === category);
      const completedTasks = categoryTasks.filter(task => task.completed);

      return {
        category,
        total: categoryTasks.length,
        completed: completedTasks.length,
        completionRate: categoryTasks.length > 0 ? (completedTasks.length / categoryTasks.length) * 100 : 0,
        averageCompletionTime: this.calculateAverageCompletionTime(completedTasks),
        trend: this.getCategoryTrend(categoryTasks)
      };
    });
  }

  generateTrendData(tasks: Task[]): void {
    const days = this.getPeriodDays();
    this.trendData = [];
    this.maxCompletedTasks = 0;
    this.maxCreatedTasks = 0;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayTasks = tasks.filter(task =>
        new Date(task.createdAt) >= dayStart && new Date(task.createdAt) < dayEnd
      );
      const dayCompleted = tasks.filter(task =>
        task.completed && new Date(task.updatedAt) >= dayStart && new Date(task.updatedAt) < dayEnd
      );

      const completed = dayCompleted.length;
      const created = dayTasks.length;
      const productivity = created > 0 ? (completed / created) * 100 : 0;

      this.trendData.push({
        date: dayStart.toISOString().split('T')[0],
        completed,
        created,
        productivity,
        focusTime: this.calculateDayFocusTime(dayCompleted)
      });

      this.maxCompletedTasks = Math.max(this.maxCompletedTasks, completed);
      this.maxCreatedTasks = Math.max(this.maxCreatedTasks, created);
    }
  }

  generateTimeDistribution(tasks: Task[]): void {
    this.timeDistribution = [];
    this.maxTasksPerHour = 0;

    for (let hour = 0; hour < 24; hour++) {
      const hourTasks = tasks.filter(task => {
        const taskHour = new Date(task.completed ? task.updatedAt : task.createdAt).getHours();
        return taskHour === hour;
      });

      const tasksCount = hourTasks.length;
      const productivity = tasksCount > 0 ? (hourTasks.filter(t => t.completed).length / tasksCount) * 100 : 0;

      this.timeDistribution.push({
        hour,
        tasks: tasksCount,
        productivity
      });

      this.maxTasksPerHour = Math.max(this.maxTasksPerHour, tasksCount);
    }
  }

  generateAchievementProgress(achievements: any[]): void {
    // Mock achievement progress - in real app, this would come from the gamification service
    this.achievementProgress = [
      { category: 'Task Master', current: 45, target: 50, percentage: 90 },
      { category: 'Streak Champion', current: 7, target: 10, percentage: 70 },
      { category: 'Focus Guru', current: 120, target: 150, percentage: 80 },
      { category: 'Category Expert', current: 3, target: 5, percentage: 60 }
    ];
  }

  generateInsights(tasks: Task[], stats: any): void {
    this.insights = [
      {
        icon: '🎯',
        title: 'Peak Performance Time',
        description: `You're most productive at ${this.productivityMetrics.mostProductiveHour}:00. Consider scheduling important tasks during this time.`,
        action: null
      },
      {
        icon: '📈',
        title: 'Completion Rate',
        description: `Your ${this.selectedPeriod} completion rate is ${this.productivityMetrics.completionRate.toFixed(1)}%. ${this.productivityMetrics.completionRate > 80 ? 'Excellent work!' : 'Try breaking tasks into smaller steps.'}`,
        action: null
      },
      {
        icon: '🔥',
        title: 'Current Streak',
        description: `You're on a ${this.productivityMetrics.streakDays}-day completion streak. Keep it up!`,
        action: null
      },
      {
        icon: '⏰',
        title: 'Time Management',
        description: `You've spent ${this.formatTime(this.productivityMetrics.totalFocusTime)} focused on tasks this ${this.selectedPeriod}. Consider taking breaks to maintain productivity.`,
        action: { label: 'Start Pomodoro', type: 'pomodoro' }
      },
      {
        icon: '📊',
        title: 'Category Focus',
        description: `Your strongest category is ${this.getTopCategory()}. Consider balancing your tasks across different categories.`,
        action: { label: 'View Categories', type: 'categories' }
      }
    ];
  }

  generateProductivityTips(): void {
    this.productivityTips = [
      {
        id: 1,
        title: 'Time Blocking',
        description: 'Dedicate specific time blocks for different types of tasks. This reduces context switching and improves focus.'
      },
      {
        id: 2,
        title: 'Two-Minute Rule',
        description: 'If a task takes less than two minutes, do it immediately. This prevents small tasks from piling up.'
      },
      {
        id: 3,
        title: 'Eisenhower Matrix',
        description: 'Categorize tasks by urgency and importance. Focus on what\'s both urgent and important first.'
      },
      {
        id: 4,
        title: 'Pomodoro Technique',
        description: 'Work for 25 minutes straight, then take a 5-minute break. This maintains focus and prevents burnout.'
      },
      {
        id: 5,
        title: 'Weekly Review',
        description: 'Spend 30 minutes each week reviewing completed tasks and planning for the next week. This improves long-term productivity.'
      }
    ];
  }

  // Mock forecast data generation
  generateMockForecastData() {
    const today = new Date();
    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + i);
      this.predictiveForecast.push({
        date: futureDate.toISOString().split('T')[0],
        predictedTasks: Math.floor(Math.random() * 10) + 5,
        confidence: Math.random() * 0.2 + 0.8,
      });
    }
  }

  // Utility methods
  getPeriodDays(): number {
    switch (this.selectedPeriod) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 7;
    }
  }

  calculateStreak(tasks: Task[]): number {
    const completedTasks = tasks.filter(task => task.completed)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    let streak = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const task of completedTasks) {
      const taskDate = new Date(task.updatedAt);
      taskDate.setHours(0, 0, 0, 0);

      if (taskDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (taskDate.getTime() < currentDate.getTime()) {
        break;
      }
    }

    return streak;
  }

  getMostProductiveDay(completedTasks: Task[]): string {
    const dayCounts: Record<string, number> = {};
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    completedTasks.forEach(task => {
      const day = new Date(task.updatedAt).getDay();
      dayCounts[days[day]] = (dayCounts[days[day]] || 0) + 1;
    });

    const mostProductiveDay = Object.keys(dayCounts).reduce((a, b) =>
      dayCounts[a] > dayCounts[b] ? a : b, 'Monday');

    return mostProductiveDay;
  }

  getMostProductiveHour(completedTasks: Task[]): number {
    const hourCounts: Record<number, number> = {};

    completedTasks.forEach(task => {
      const hour = new Date(task.updatedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const mostProductiveHour = Object.keys(hourCounts).reduce((a, b) =>
      hourCounts[Number(a)] > hourCounts[Number(b)] ? a : b, '9');

    return Number(mostProductiveHour);
  }

  calculateTotalFocusTime(tasks: Task[]): number {
    return tasks.filter(task => task.completed).reduce((total, task) => {
      // Mock focus time calculation - in real app, this would come from time tracking
      return total + Math.random() * 2 + 0.5; // 0.5-2.5 hours per task
    }, 0);
  }

  calculateAverageCompletionTime(completedTasks: Task[]): number {
    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum, task) => {
      const created = new Date(task.createdAt);
      const completed = new Date(task.updatedAt);
      return sum + (completed.getTime() - created.getTime());
    }, 0);

    return totalTime / completedTasks.length;
  }

  calculateProductivityTrend(tasks: Task[]): number {
    const recentTasks = tasks.filter(task =>
      new Date(task.createdAt) >= new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    );
    const olderTasks = tasks.filter(task =>
      new Date(task.createdAt) >= new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) &&
      new Date(task.createdAt) < new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    );

    const recentRate = recentTasks.length > 0 ?
      (recentTasks.filter(t => t.completed).length / recentTasks.length) * 100 : 0;
    const olderRate = olderTasks.length > 0 ?
      (olderTasks.filter(t => t.completed).length / olderTasks.length) * 100 : 0;

    return recentRate - olderRate;
  }

  getCategoryTrend(categoryTasks: Task[]): 'up' | 'down' | 'stable' {
    // Simple trend calculation - in real app, this would be more sophisticated
    return Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable';
  }

  calculateDayFocusTime(dayTasks: Task[]): number {
    return dayTasks.reduce((total, task) => total + Math.random() * 2 + 0.5, 0);
  }

  getTopCategory(): string {
    return this.categoryStats.reduce((top, current) =>
      current.completionRate > top.completionRate ? current : top
    ).category;
  }

  // UI methods
  getBarHeight(value: number, type: 'completed' | 'created'): number {
    const max = type === 'completed' ? this.maxCompletedTasks : this.maxCreatedTasks;
    return max > 0 ? (value / max) * 100 : 0;
  }

  getLinePoints(): string {
    const points: string[] = [];
    const width = 400;
    const height = 200;
    const dataPoints = this.getLineDataPoints();

    dataPoints.forEach(point => {
      points.push(`${point.x},${height - point.y}`);
    });

    return points.join(' ');
  }

  getLineDataPoints(): { x: number, y: number }[] {
    const points: { x: number, y: number }[] = [];
    const width = 400;
    const height = 180; // Leave some margin

    this.trendData.forEach((day, index) => {
      const x = (index / (this.trendData.length - 1)) * width;
      const y = (day.productivity / 100) * height;
      points.push({ x, y });
    });

    return points;
  }

  getTrendClass(trend: number): string {
    if (trend > 5) return 'positive';
    if (trend < -5) return 'negative';
    return 'neutral';
  }

  getTrendIcon(trend: number): string {
    if (trend > 5) return '↗️';
    if (trend < -5) return '↘️';
    return '→';
  }

  formatTime(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  }

  getDayLabel(index: number): string {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const targetDate = new Date(now.getTime() - (this.trendData.length - 1 - index) * 24 * 60 * 60 * 1000);
    return days[targetDate.getDay()];
  }

  updatePeriod(): void {
    this.loadAnalyticsData();
  }

  refreshData(): void {
    this.loadAnalyticsData();
  }

  startAutoRefresh(): void {
    // Refresh data every 5 minutes
    this.subscriptions.push(
      interval(5 * 60 * 1000).subscribe(() => {
        this.loadAnalyticsData();
      })
    );
  }

  exportData(): void {
    const data = {
      productivityMetrics: this.productivityMetrics,
      categoryStats: this.categoryStats,
      trendData: this.trendData,
      timeDistribution: this.timeDistribution,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `productivity-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  performInsightAction(action: any): void {
    // Handle insight actions
    switch (action.type) {
      case 'pomodoro':
        // Navigate to pomodoro component
        console.log('Starting Pomodoro session');
        break;
      case 'categories':
        // Navigate to tasks with category filter
        console.log('Viewing categories');
        break;
    }
  }

  nextTip(): void {
    if (this.currentTipIndex < this.productivityTips.length - 1) {
      this.currentTipIndex++;
    }
  }

  previousTip(): void {
    if (this.currentTipIndex > 0) {
      this.currentTipIndex--;
    }
  }
}