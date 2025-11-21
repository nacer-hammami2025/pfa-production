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

      <!-- Advanced Productivity System -->
      <div class="productivity-mastery-section">
        <div class="section-header">
          <h2>🧠 Système de Productivité Professionnelle</h2>
          <p class="section-subtitle">Maîtrisez les techniques utilisées par les leaders mondiaux</p>
        </div>
        
        <div class="productivity-grid">
          <div class="productivity-card" *ngFor="let tip of productivityTips; trackBy: trackByTipId" 
               [class.expanded]="tip.expanded"
               (click)="toggleTipExpansion(tip)">
            
            <!-- Card Header -->
            <div class="card-header">
              <div class="tip-icon">{{ tip.icon }}</div>
              <div class="tip-meta">
                <h3 class="tip-title">{{ tip.title }}</h3>
                <div class="tip-badges">
                  <span class="difficulty-badge" [ngClass]="'difficulty-' + tip.difficulty.toLowerCase()">
                    {{ tip.difficulty }}
                  </span>
                  <span class="category-badge">{{ tip.category }}</span>
                  <span class="effectiveness-badge">{{ tip.effectiveness }} efficace</span>
                </div>
              </div>
              <div class="expand-indicator" [class.rotated]="tip.expanded">
                <i class="fas fa-chevron-down"></i>
              </div>
            </div>

            <!-- Card Content -->
            <div class="card-content">
              <p class="tip-description">{{ tip.description }}</p>
              
              <div class="tip-stats">
                <div class="stat-item">
                  <i class="fas fa-clock"></i>
                  <span>Maîtrise: {{ tip.timeToMaster }}</span>
                </div>
                <div class="stat-item">
                  <i class="fas fa-brain"></i>
                  <span>Base scientifique validée</span>
                </div>
              </div>
            </div>

            <!-- Expanded Content -->
            <div class="expanded-content" *ngIf="tip.expanded">
              <div class="scientific-basis">
                <h4><i class="fas fa-microscope"></i> Fondement Scientifique</h4>
                <p>{{ tip.scientificBasis }}</p>
              </div>

              <div class="action-steps">
                <h4><i class="fas fa-list-check"></i> Plan d'Action Détaillé</h4>
                <ul class="steps-list">
                  <li *ngFor="let step of tip.actionSteps" class="action-step">
                    {{ step }}
                  </li>
                </ul>
              </div>

              <div class="tip-actions">
                <button class="action-btn primary" (click)="startImplementation(tip); $event.stopPropagation()">
                  <i class="fas fa-rocket"></i> Commencer Maintenant
                </button>
                <button class="action-btn secondary" (click)="addToPersonalPlan(tip); $event.stopPropagation()">
                  <i class="fas fa-bookmark"></i> Ajouter au Plan
                </button>
                <button class="action-btn tertiary" (click)="learnMore(tip); $event.stopPropagation()">
                  <i class="fas fa-graduation-cap"></i> Approfondir
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Personal Productivity Dashboard -->
        <div class="personal-dashboard" *ngIf="personalProductivityTips.length > 0">
          <h3><i class="fas fa-user-chart"></i> Votre Plan de Productivité Personnalisé</h3>
          <div class="personal-tips">
            <div class="personal-tip-item" *ngFor="let tip of personalProductivityTips">
              <div class="tip-progress">
                <div class="progress-circle" [style.background]="'conic-gradient(#4CAF50 ' + tip.progress + '%, #e0e0e0 0%)'">
                  <span>{{ tip.progress }}%</span>
                </div>
              </div>
              <div class="tip-info">
                <h4>{{ tip.title }}</h4>
                <p>{{ tip.nextAction }}</p>
              </div>
              <button class="continue-btn" (click)="continueImplementation(tip)">
                Continuer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-dashboard {
      padding: 30px;
      max-width: 1400px;
      margin: 0 auto;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .analytics-header {
      text-align: center;
      margin-bottom: 40px;
      color: white;
    }

    .analytics-header h1 {
      font-size: 3rem;
      margin-bottom: 15px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      background: linear-gradient(45deg, #fff, #f0f8ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .analytics-subtitle {
      font-size: 1.2rem;
      opacity: 0.9;
      font-weight: 300;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 25px;
      margin-bottom: 50px;
    }

    .metric-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 20px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      position: relative;
      overflow: hidden;
    }

    .metric-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
      background-size: 300% 100%;
      animation: gradientShift 3s ease infinite;
    }

    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }

    .metric-card:hover {
      transform: translateY(-8px) scale(1.02);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }

    .metric-icon {
      font-size: 3rem;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
      flex-shrink: 0;
    }

    .metric-content h3 {
      margin: 0 0 8px 0;
      font-size: 1.1rem;
      color: #2c3e50;
      font-weight: 600;
    }

    .metric-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: #667eea;
      margin: 0;
      text-shadow: 0 1px 2px rgba(0,0,0,0.1);
    }

    .metric-label {
      color: #7f8c8d;
      font-size: 0.9rem;
      margin: 0;
      font-weight: 500;
    }

    .charts-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 50px;
    }

    @media (max-width: 1024px) {
      .charts-section {
        grid-template-columns: 1fr;
      }
    }

    .chart-container {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
    }

    .chart-container:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
    }

    .chart-container h2 {
      color: #2c3e50;
      font-size: 1.5rem;
      margin-bottom: 25px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .trend-chart {
      margin-bottom: 20px;
    }

    .chart-placeholder {
      display: flex;
      align-items: end;
      justify-content: space-between;
      height: 200px;
      margin-bottom: 20px;
      padding: 20px;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      border-radius: 15px;
      position: relative;
    }

    .trend-bars {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      max-width: 60px;
      position: relative;
    }

    .bar {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 25px;
      position: relative;
      margin: 0 2px;
      border-radius: 4px 4px 0 0;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .bar.completed {
      background: linear-gradient(to top, #27ae60, #2ecc71);
      box-shadow: 0 2px 8px rgba(39, 174, 96, 0.3);
    }

    .bar.created {
      background: linear-gradient(to top, #e74c3c, #c0392b);
      box-shadow: 0 2px 8px rgba(231, 76, 60, 0.3);
      margin-top: 5px;
    }

    .bar:hover {
      transform: scale(1.1);
    }

    .bar-value {
      position: absolute;
      top: -25px;
      color: #2c3e50;
      font-weight: bold;
      font-size: 0.8rem;
      background: rgba(255, 255, 255, 0.9);
      padding: 2px 6px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .bar:hover .bar-value {
      opacity: 1;
    }

    .bar-label {
      margin-top: 15px;
      font-size: 0.8rem;
      color: #7f8c8d;
      text-align: center;
      font-weight: 500;
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-top: 20px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
      color: #2c3e50;
      font-weight: 500;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 3px;
    }

    .legend-color.completed {
      background: linear-gradient(to right, #27ae60, #2ecc71);
    }

    .legend-color.created {
      background: linear-gradient(to right, #e74c3c, #c0392b);
    }

    .category-stats {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .category-item {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      padding: 20px;
      transition: all 0.3s ease;
      border: 1px solid rgba(0,0,0,0.05);
    }

    .category-item:hover {
      transform: translateX(5px);
      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
    }

    .category-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .category-name {
      font-weight: 600;
      color: #2c3e50;
      font-size: 1.1rem;
    }

    .category-count {
      color: #7f8c8d;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .category-progress {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: #ecf0f1;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.1);
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 4px;
      transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }

    .progress-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      animation: shimmer 2s infinite;
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .progress-text {
      font-weight: 600;
      color: #667eea;
      font-size: 0.9rem;
      min-width: 45px;
      text-align: right;
    }

    .insights-section {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .insights-section h2 {
      color: #2c3e50;
      font-size: 1.5rem;
      margin-bottom: 20px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .insight-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 15px;
      padding: 20px;
      display: flex;
      align-items: flex-start;
      gap: 15px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .insight-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    }

    .insight-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }

    .insight-content h3 {
      margin: 0 0 8px 0;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .insight-content p {
      margin: 0;
      opacity: 0.9;
      line-height: 1.5;
    }

    .tips-section {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 30px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .tips-section h2 {
      color: #2c3e50;
      font-size: 1.5rem;
      margin-bottom: 20px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .tips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 20px;
    }

    .tip-card {
      background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
      border-radius: 15px;
      padding: 25px;
      border: 1px solid rgba(0,0,0,0.05);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .tip-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 4px;
      height: 100%;
      background: linear-gradient(to bottom, #667eea, #764ba2);
    }

    .tip-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 25px rgba(0,0,0,0.1);
    }

    .tip-card h3 {
      margin: 0 0 12px 0;
      color: #2c3e50;
      font-size: 1.2rem;
      font-weight: 600;
    }

    .tip-card p {
      margin: 0;
      color: #5a6c7d;
      line-height: 1.6;
    }

    @media (max-width: 768px) {
      .analytics-dashboard {
        padding: 20px;
      }

      .analytics-header h1 {
        font-size: 2.5rem;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .charts-section {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .insights-grid,
      .tips-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Advanced Productivity System Styles */
    .productivity-mastery-section {
      margin-top: 50px;
      padding: 40px;
      background: linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%);
      backdrop-filter: blur(20px);
      border-radius: 25px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .section-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .section-header h2 {
      font-size: 2.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 10px;
    }

    .section-subtitle {
      font-size: 1.1rem;
      color: #6b7280;
      font-weight: 400;
    }

    .productivity-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 25px;
      margin-bottom: 40px;
    }

    .productivity-card {
      background: white;
      border-radius: 20px;
      padding: 0;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
      border: 1px solid #e5e7eb;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      cursor: pointer;
      overflow: hidden;
      position: relative;
    }

    .productivity-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
      border-color: #667eea;
    }

    .productivity-card.expanded {
      transform: scale(1.01);
      box-shadow: 0 25px 60px rgba(102, 126, 234, 0.2);
      border-color: #667eea;
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      padding: 25px;
      gap: 20px;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border-bottom: 1px solid #e5e7eb;
    }

    .tip-icon {
      font-size: 2.5rem;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 15px;
      color: white;
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
      flex-shrink: 0;
    }

    .tip-meta {
      flex: 1;
      min-width: 0;
    }

    .tip-title {
      font-size: 1.4rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 12px;
      line-height: 1.3;
    }

    .tip-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .difficulty-badge,
    .category-badge,
    .effectiveness-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .difficulty-débutant {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .difficulty-intermédiaire {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    .difficulty-avancé,
    .difficulty-expert {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .category-badge {
      background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
      color: white;
    }

    .effectiveness-badge {
      background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
      color: white;
    }

    .expand-indicator {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
      flex-shrink: 0;
    }

    .expand-indicator.rotated {
      transform: rotate(180deg);
    }

    .card-content {
      padding: 25px;
    }

    .tip-description {
      font-size: 1rem;
      line-height: 1.6;
      color: #374151;
      margin-bottom: 20px;
    }

    .tip-stats {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #6b7280;
      font-size: 0.9rem;
    }

    .stat-item i {
      color: #667eea;
    }

    .expanded-content {
      border-top: 1px solid #e5e7eb;
      padding: 25px;
      background: #f8fafc;
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .scientific-basis,
    .action-steps {
      margin-bottom: 25px;
    }

    .scientific-basis h4,
    .action-steps h4 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.1rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
    }

    .scientific-basis h4 i,
    .action-steps h4 i {
      color: #667eea;
    }

    .scientific-basis p {
      color: #4b5563;
      line-height: 1.6;
      font-style: italic;
    }

    .steps-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .action-step {
      padding: 12px 0;
      color: #374151;
      font-weight: 500;
      border-bottom: 1px solid #e5e7eb;
      transition: all 0.2s ease;
    }

    .action-step:last-child {
      border-bottom: none;
    }

    .action-step:hover {
      color: #667eea;
      padding-left: 10px;
    }

    .tip-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 20px;
    }

    .action-btn {
      padding: 12px 20px;
      border-radius: 10px;
      border: none;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-btn.primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .action-btn.primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
    }

    .action-btn.secondary {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
    }

    .action-btn.secondary:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(245, 158, 11, 0.6);
    }

    .action-btn.tertiary {
      background: white;
      color: #667eea;
      border: 2px solid #667eea;
    }

    .action-btn.tertiary:hover {
      background: #667eea;
      color: white;
    }

    /* Personal Dashboard */
    .personal-dashboard {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 20px;
      margin-top: 30px;
    }

    .personal-dashboard h3 {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.5rem;
      margin-bottom: 25px;
    }

    .personal-tips {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
    }

    .personal-tip-item {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 15px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .progress-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 0.9rem;
      color: white;
      background: conic-gradient(#4CAF50 0%, #e0e0e0 0%);
      position: relative;
    }

    .progress-circle::before {
      content: '';
      position: absolute;
      width: 45px;
      height: 45px;
      background: #667eea;
      border-radius: 50%;
      z-index: -1;
    }

    .tip-info {
      flex: 1;
    }

    .tip-info h4 {
      margin-bottom: 8px;
      font-size: 1.1rem;
    }

    .tip-info p {
      opacity: 0.9;
      font-size: 0.9rem;
    }

    .continue-btn {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 500;
    }

    .continue-btn:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .productivity-grid {
        grid-template-columns: 1fr;
      }
      
      .tip-actions {
        flex-direction: column;
      }
      
      .action-btn {
        width: 100%;
        justify-content: center;
      }
      
      .personal-tips {
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
  personalProductivityTips: any[] = [];

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
      ]).subscribe({
        next: ([tasks, stats]) => {
          console.log('Analytics data loaded:', { tasksCount: tasks.length, stats });
          this.calculateProductivityMetrics(tasks);
          this.calculateCategoryStats(tasks);
          this.generateTrendData(tasks);
          this.generateInsights(tasks, stats);
          this.generateProductivityTips();
        },
        error: (error) => {
          console.error('Error loading analytics data:', error);
          // Initialize with default data on error
          this.initializeDefaultData();
        }
      })
    );
  }

  private initializeDefaultData(): void {
    // Initialize with sample data for demonstration
    this.productivityMetrics = {
      tasksCompletedToday: 0,
      tasksCompletedThisWeek: 0,
      averageTasksPerDay: 0,
      completionRate: 0,
      streakDays: 0,
      mostProductiveDay: 'Aucun',
      mostProductiveHour: 9
    };

    this.categoryStats = [
      { category: 'Travail', total: 0, completed: 0, completionRate: 0, averageCompletionTime: 0 },
      { category: 'Personnel', total: 0, completed: 0, completionRate: 0, averageCompletionTime: 0 },
      { category: 'Courses', total: 0, completed: 0, completionRate: 0, averageCompletionTime: 0 },
      { category: 'Santé', total: 0, completed: 0, completionRate: 0, averageCompletionTime: 0 },
      { category: 'Éducation', total: 0, completed: 0, completionRate: 0, averageCompletionTime: 0 },
      { category: 'Autre', total: 0, completed: 0, completionRate: 0, averageCompletionTime: 0 }
    ];

    this.generateDefaultTrendData();
    this.generateInsights([], { 
      total: 0, 
      completed: 0, 
      pending: 0, 
      overdue: 0, 
      byPriority: { low: 0, medium: 0, high: 0, urgent: 0 }, 
      byCategory: { work: 0, personal: 0, shopping: 0, health: 0, education: 0, other: 0 }, 
      completionRate: 0 
    });
    this.generateProductivityTips();
  }

  private generateDefaultTrendData(): void {
    const now = new Date();
    this.trendData = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      this.trendData.push({
        date: date.toISOString().split('T')[0],
        completed: 0,
        created: 0,
        productivity: 0
      });
    }

    this.maxCompletedTasks = 1;
    this.maxCreatedTasks = 1;
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
        icon: '🍅',
        title: 'Technique Pomodoro Avancée',
        description: 'Optimisez votre focus avec des cycles de 25 minutes de travail intense suivis de 5 minutes de récupération. Après 4 cycles, accordez-vous 30 minutes de pause profonde.',
        difficulty: 'Intermédiaire',
        timeToMaster: '1-2 semaines',
        scientificBasis: 'Basé sur les recherches de Francesco Cirillo sur la gestion du temps et de l\'attention.',
        actionSteps: [
          '⏰ Définissez un objectif précis pour chaque session',
          '🔕 Éliminez toutes les distractions (notifications, téléphone)',
          '⚡ Travaillez avec une intensité maximale pendant 25 minutes',
          '🧘 Prenez une vraie pause : levez-vous, respirez, hydratez-vous',
          '📊 Notez votre progression et ajustez si nécessaire'
        ],
        category: 'Gestion du Temps',
        effectiveness: '95%'
      },
      {
        id: 2,
        icon: '⚡',
        title: 'Règle des 2 Minutes + GTD',
        description: 'Si une tâche prend moins de 2 minutes, exécutez-la immédiatement. Pour les autres, capturez-les dans un système de confiance pour traitement ultérieur.',
        difficulty: 'Débutant',
        timeToMaster: '3-7 jours',
        scientificBasis: 'Méthode Getting Things Done de David Allen, validée par la psychologie cognitive.',
        actionSteps: [
          '⏱️ Évaluez rapidement : moins de 2 minutes ?',
          '✅ Si oui : exécutez immédiatement sans réflexion',
          '📝 Si non : capturez dans votre système de gestion',
          '🗂️ Organisez par contexte (@bureau, @maison, @appels)',
          '🔄 Révisez votre système hebdomadairement'
        ],
        category: 'Organisation',
        effectiveness: '88%'
      },
      {
        id: 3,
        icon: '📊',
        title: 'Matrice Eisenhower 2.0',
        description: 'Classifiez vos tâches selon 4 quadrants : Urgent/Important (Faire), Important/Pas Urgent (Planifier), Urgent/Pas Important (Déléguer), Ni Urgent/Ni Important (Éliminer).',
        difficulty: 'Intermédiaire',
        timeToMaster: '2-3 semaines',
        scientificBasis: 'Développée par le Président Eisenhower, popularisée par Stephen Covey dans "7 Habits".',
        actionSteps: [
          '🚨 Quadrant 1 (Urgent + Important) : Gérez les crises',
          '🎯 Quadrant 2 (Important + Pas Urgent) : PRIORITÉ ABSOLUE',
          '👥 Quadrant 3 (Urgent + Pas Important) : Déléguez ou minimisez',
          '🗑️ Quadrant 4 (Ni Urgent ni Important) : Éliminez radicalement',
          '⚖️ Visez 65% de votre temps dans le Quadrant 2'
        ],
        category: 'Priorisation',
        effectiveness: '92%'
      },
      {
        id: 4,
        icon: '🎯',
        title: 'Time Blocking & Deep Work',
        description: 'Regroupez les tâches similaires en blocs temporels dédiés. Réservez 90-120 minutes pour le travail profond sans interruption.',
        difficulty: 'Avancé',
        timeToMaster: '4-6 semaines',
        scientificBasis: 'Recherches de Cal Newport sur le Deep Work et la neuroplasticité du cerveau.',
        actionSteps: [
          '🗓️ Planifiez votre semaine par blocs de 90-120 minutes',
          '🧠 Réservez vos heures de pic cognitif pour le travail complexe',
          '📱 Créez des blocs "communications" pour emails/messages',
          '🔄 Groupez les tâches administratives en fin de journée',
          '🚫 Protégez vos blocs de Deep Work comme des rendez-vous sacrés'
        ],
        category: 'Focus & Concentration',
        effectiveness: '97%'
      },
      {
        id: 5,
        icon: '🌅',
        title: 'Routine de Révision Holistique',
        description: 'Implémentez un système de révision quotidienne, hebdomadaire et mensuelle pour maintenir l\'alignement entre vos actions et vos objectifs à long terme.',
        difficulty: 'Avancé',
        timeToMaster: '6-8 semaines',
        scientificBasis: 'Combinaison des méthodes GTD, Bullet Journal et recherches sur la métacognition.',
        actionSteps: [
          '🌙 Révision quotidienne (10 min) : Bilan + Planification J+1',
          '📅 Révision hebdomadaire (30 min) : Objectifs + Ajustements',
          '🚀 Révision mensuelle (60 min) : Vision + Stratégie',
          '🏆 Célébrez vos victoires, même les plus petites',
          '📈 Analysez vos patterns et optimisez continuellement'
        ],
        category: 'Système Global',
        effectiveness: '90%'
      },
      {
        id: 6,
        icon: '🧠',
        title: 'Méthode Zettelkasten Digital',
        description: 'Créez un système de gestion des connaissances interconnectées pour amplifier votre réflexion et accélérer votre apprentissage.',
        difficulty: 'Expert',
        timeToMaster: '8-12 semaines',
        scientificBasis: 'Système de Niklas Luhmann, validé par les neurosciences de l\'apprentissage.',
        actionSteps: [
          '📚 Capturez chaque idée importante dans une note atomique',
          '🔗 Créez des liens entre les concepts connexes',
          '🏷️ Utilisez des tags contextuels, pas des catégories rigides',
          '💡 Révisez régulièrement pour créer de nouvelles connexions',
          '🌟 Laissez émerger des insights inattendus de votre réseau'
        ],
        category: 'Gestion des Connaissances',
        effectiveness: '85%'
      }
    ];
  }

  trackByTipId(index: number, tip: any): number {
    return tip.id;
  }

  toggleTipExpansion(tip: any): void {
    tip.expanded = !tip.expanded;
  }

  startImplementation(tip: any): void {
    // Ajouter à la liste personnelle avec progression
    const personalTip = {
      ...tip,
      progress: 0,
      startedAt: new Date(),
      nextAction: `Commencez par: ${tip.actionSteps[0]}`,
      currentStep: 0
    };
    
    const existingIndex = this.personalProductivityTips.findIndex(p => p.id === tip.id);
    if (existingIndex === -1) {
      this.personalProductivityTips.push(personalTip);
    }

    // Notification de succès
    this.showNotification(`🚀 Super ! Vous commencez "${tip.title}". Première étape ajoutée à votre plan.`, 'success');
  }

  addToPersonalPlan(tip: any): void {
    const personalTip = {
      ...tip,
      progress: 0,
      addedAt: new Date(),
      nextAction: 'Préparation: Lisez attentivement la méthode',
      currentStep: -1
    };
    
    const existingIndex = this.personalProductivityTips.findIndex(p => p.id === tip.id);
    if (existingIndex === -1) {
      this.personalProductivityTips.push(personalTip);
      this.showNotification(`📚 "${tip.title}" ajouté à votre plan personnel !`, 'info');
    } else {
      this.showNotification(`📝 "${tip.title}" est déjà dans votre plan.`, 'warning');
    }
  }

  learnMore(tip: any): void {
    // Simuler l'ouverture de ressources d'apprentissage
    const resources = {
      1: 'https://francescocirillo.com/pages/pomodoro-technique',
      2: 'https://gettingthingsdone.com/',
      3: 'https://www.franklincovey.com/the-7-habits/',
      4: 'https://www.calnewport.com/books/deep-work/',
      5: 'https://bulletjournal.com/pages/learn',
      6: 'https://zettelkasten.de/'
    };
    
    this.showNotification(`🎓 Ressources d'apprentissage disponibles pour "${tip.title}"`, 'info');
  }

  continueImplementation(tip: any): void {
    if (tip.currentStep < tip.actionSteps.length - 1) {
      tip.currentStep++;
      tip.progress = Math.round((tip.currentStep + 1) / tip.actionSteps.length * 100);
      tip.nextAction = `Étape suivante: ${tip.actionSteps[tip.currentStep]}`;
      
      this.showNotification(`✅ Progression : ${tip.progress}% de "${tip.title}" complétée !`, 'success');
    } else {
      tip.progress = 100;
      tip.nextAction = '🎉 Méthode maîtrisée ! Continuez la pratique quotidienne.';
      this.showNotification(`🏆 Félicitations ! Vous avez maîtrisé "${tip.title}". Excellence atteinte !`, 'success');
    }
  }

  private showNotification(message: string, type: 'success' | 'info' | 'warning' | 'error'): void {
    // Intégration avec le système de notifications existant
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Ici, on pourrait intégrer avec un service de toast/notification
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