import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AISuggestionsService, AISuggestion } from '../../services/ai-suggestions.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-ai-suggestions',
  template: `
    <div class="ai-suggestions">
      <div class="suggestions-header">
        <h1>🤖 Suggestions IA</h1>
        <p class="suggestions-subtitle">Recommandations personnalisées basées sur vos habitudes</p>
        <button (click)="refreshSuggestions()" class="refresh-btn">
          🔄 Actualiser
        </button>
      </div>

      <!-- Suggestions Actives -->
      <div class="suggestions-container" *ngIf="suggestions.length > 0; else noSuggestions">
        <div class="suggestion-card"
             *ngFor="let suggestion of suggestions"
             [class]="getSuggestionClass(suggestion)"
             [attr.data-confidence]="suggestion.confidence">

          <div class="suggestion-header">
            <div class="suggestion-icon">{{ getSuggestionIcon(suggestion.type) }}</div>
            <div class="suggestion-meta">
              <span class="suggestion-type">{{ getSuggestionTypeLabel(suggestion.type) }}</span>
              <div class="confidence-bar">
                <div class="confidence-fill" [style.width.%]="suggestion.confidence"></div>
              </div>
              <span class="confidence-text">{{ suggestion.confidence }}% confiance</span>
            </div>
          </div>

          <div class="suggestion-content">
            <h3>{{ suggestion.title }}</h3>
            <p>{{ suggestion.description }}</p>

            <div class="suggestion-metadata" *ngIf="suggestion.metadata">
              <span class="metadata-item" *ngFor="let key of getMetadataKeys(suggestion.metadata)">
                {{ key }}: {{ suggestion.metadata[key] }}
              </span>
            </div>
          </div>

          <div class="suggestion-actions" *ngIf="suggestion.actionable">
            <button *ngIf="suggestion.suggestedAction"
                    (click)="applySuggestion(suggestion)"
                    class="action-btn primary">
              {{ suggestion.suggestedAction.label }}
            </button>
            <button (click)="dismissSuggestion(suggestion.id)" class="action-btn secondary">
              Ignorer
            </button>
          </div>
        </div>
      </div>

      <!-- État vide -->
      <ng-template #noSuggestions>
        <div class="empty-state">
          <div class="empty-icon">🤖</div>
          <h3>Aucune suggestion pour le moment</h3>
          <p>Continuez à utiliser l'application pour que l'IA puisse analyser vos habitudes et vous fournir des recommandations personnalisées.</p>
          <div class="empty-tips">
            <h4>💡 Conseils pour de meilleures suggestions :</h4>
            <ul>
              <li>Complétez plusieurs tâches pour établir vos patterns</li>
              <li>Ajoutez des dates d'échéance à vos tâches</li>
              <li>Utilisez différentes catégories et priorités</li>
              <li>Créez des tâches régulièrement</li>
            </ul>
          </div>
        </div>
      </ng-template>

      <!-- Statistiques de Productivité -->
      <div class="productivity-insights" *ngIf="productivityInsights">
        <h2>📊 Aperçu de votre Productivité</h2>
        <div class="insights-grid">
          <div class="insight-card">
            <div class="insight-icon">🎯</div>
            <div class="insight-value">{{ productivityInsights.productivityScore.toFixed(1) }}%</div>
            <div class="insight-label">Score de Productivité</div>
          </div>

          <div class="insight-card">
            <div class="insight-icon">✅</div>
            <div class="insight-value">{{ productivityInsights.completedTasks }}</div>
            <div class="insight-label">Tâches Terminées</div>
          </div>

          <div class="insight-card">
            <div class="insight-icon">⏳</div>
            <div class="insight-value">{{ productivityInsights.pendingTasks }}</div>
            <div class="insight-label">Tâches en Attente</div>
          </div>

          <div class="insight-card" [class.warning]="productivityInsights.overdueTasks > 0">
            <div class="insight-icon">🚨</div>
            <div class="insight-value">{{ productivityInsights.overdueTasks }}</div>
            <div class="insight-label">Tâches en Retard</div>
          </div>
        </div>

        <!-- Activité récente -->
        <div class="recent-activity">
          <h3>📈 Activité Récente (7 derniers jours)</h3>
          <div class="activity-stats">
            <div class="activity-item">
              <span class="activity-label">Tâches créées :</span>
              <span class="activity-value">{{ productivityInsights.recentActivity.tasksCreated }}</span>
            </div>
            <div class="activity-item">
              <span class="activity-label">Tâches terminées :</span>
              <span class="activity-value">{{ productivityInsights.recentActivity.tasksCompleted }}</span>
            </div>
            <div class="activity-item">
              <span class="activity-label">Moyenne par jour :</span>
              <span class="activity-value">{{ productivityInsights.recentActivity.averagePerDay.toFixed(1) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ai-suggestions {
      padding: 20px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .suggestions-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 15px;
    }

    .suggestions-header h1 {
      color: #2c3e50;
      font-size: 2.2rem;
      margin: 0;
    }

    .suggestions-subtitle {
      color: #7f8c8d;
      font-size: 1.1rem;
      margin: 5px 0 0 0;
      flex: 1;
    }

    .refresh-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 10px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .refresh-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
    }

    .suggestions-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      margin-bottom: 40px;
    }

    .suggestion-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #667eea;
      transition: all 0.2s ease;
    }

    .suggestion-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }

    .suggestion-card[data-confidence="90"],
    .suggestion-card[data-confidence="95"] {
      border-left-color: #27ae60;
      background: linear-gradient(135deg, rgba(39, 174, 96, 0.05) 0%, rgba(39, 174, 96, 0.02) 100%);
    }

    .suggestion-card[data-confidence="75"],
    .suggestion-card[data-confidence="80"] {
      border-left-color: #f39c12;
      background: linear-gradient(135deg, rgba(243, 156, 18, 0.05) 0%, rgba(243, 156, 18, 0.02) 100%);
    }

    .suggestion-header {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 15px;
    }

    .suggestion-icon {
      font-size: 1.8rem;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
    }

    .suggestion-meta {
      flex: 1;
    }

    .suggestion-type {
      display: inline-block;
      background: #ecf0f1;
      color: #2c3e50;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .confidence-bar {
      width: 100%;
      height: 6px;
      background: #ecf0f1;
      border-radius: 3px;
      margin: 8px 0;
      overflow: hidden;
    }

    .confidence-fill {
      height: 100%;
      background: linear-gradient(90deg, #27ae60, #2ecc71);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .confidence-text {
      font-size: 0.8rem;
      color: #7f8c8d;
    }

    .suggestion-content h3 {
      color: #2c3e50;
      margin: 0 0 8px 0;
      font-size: 1.2rem;
    }

    .suggestion-content p {
      color: #34495e;
      margin: 0 0 15px 0;
      line-height: 1.5;
    }

    .suggestion-metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 15px;
    }

    .metadata-item {
      background: #f8f9fa;
      color: #495057;
      padding: 4px 8px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .suggestion-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    .action-btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
      font-size: 0.9rem;
    }

    .action-btn.primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .action-btn.primary:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
    }

    .action-btn.secondary {
      background: #ecf0f1;
      color: #2c3e50;
    }

    .action-btn.secondary:hover {
      background: #d5dbdb;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }

    .empty-state h3 {
      color: #2c3e50;
      margin-bottom: 10px;
    }

    .empty-state p {
      color: #7f8c8d;
      margin-bottom: 30px;
      max-width: 500px;
      margin-left: auto;
      margin-right: auto;
    }

    .empty-tips {
      text-align: left;
      max-width: 400px;
      margin: 0 auto;
    }

    .empty-tips h4 {
      color: #2c3e50;
      margin-bottom: 15px;
    }

    .empty-tips ul {
      list-style: none;
      padding: 0;
    }

    .empty-tips li {
      color: #34495e;
      margin-bottom: 8px;
      padding-left: 20px;
      position: relative;
    }

    .empty-tips li:before {
      content: '✓';
      position: absolute;
      left: 0;
      color: #27ae60;
      font-weight: bold;
    }

    .productivity-insights {
      background: white;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .productivity-insights h2 {
      color: #2c3e50;
      margin-bottom: 25px;
      font-size: 1.5rem;
    }

    .insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .insight-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      transition: transform 0.2s ease;
    }

    .insight-card:hover {
      transform: translateY(-2px);
    }

    .insight-card.warning {
      background: #fff5f5;
      border: 1px solid #fed7d7;
    }

    .insight-icon {
      font-size: 2rem;
      margin-bottom: 10px;
    }

    .insight-value {
      font-size: 2rem;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 5px;
    }

    .insight-label {
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .recent-activity {
      border-top: 1px solid #ecf0f1;
      padding-top: 25px;
    }

    .recent-activity h3 {
      color: #2c3e50;
      margin-bottom: 20px;
      font-size: 1.2rem;
    }

    .activity-stats {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .activity-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #f8f9fa;
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-label {
      color: #34495e;
      font-weight: 500;
    }

    .activity-value {
      color: #2c3e50;
      font-weight: bold;
      background: #f8f9fa;
      padding: 4px 8px;
      border-radius: 4px;
    }

    @media (max-width: 768px) {
      .suggestions-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .insights-grid {
        grid-template-columns: 1fr;
      }

      .suggestion-actions {
        flex-direction: column;
      }

      .activity-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 5px;
      }
    }
  `]
})
export class AISuggestionsComponent implements OnInit, OnDestroy {
  suggestions: AISuggestion[] = [];
  productivityInsights: any = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private aiSuggestionsService: AISuggestionsService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.aiSuggestionsService.getSuggestions().subscribe(suggestions => {
        this.suggestions = suggestions;
      })
    );

    this.subscriptions.push(
      this.aiSuggestionsService.getTaskInsights().subscribe(insights => {
        this.productivityInsights = insights;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getSuggestionIcon(type: string): string {
    const icons = {
      priority: '🎯',
      schedule: '📅',
      productivity: '⚡',
      pattern: '📊',
      reminder: '🔔'
    };
    return icons[type as keyof typeof icons] || '💡';
  }

  getSuggestionTypeLabel(type: string): string {
    const labels = {
      priority: 'Priorité',
      schedule: 'Planification',
      productivity: 'Productivité',
      pattern: 'Pattern',
      reminder: 'Rappel'
    };
    return labels[type as keyof typeof labels] || type;
  }

  getSuggestionClass(suggestion: AISuggestion): string {
    return `suggestion-card confidence-${Math.floor(suggestion.confidence / 25) * 25}`;
  }

  getMetadataKeys(metadata: any): string[] {
    return Object.keys(metadata || {});
  }

  applySuggestion(suggestion: AISuggestion): void {
    this.aiSuggestionsService.applySuggestion(suggestion);

    // Notification de confirmation
    this.notificationService.addNotification({
      type: 'success',
      title: 'Suggestion appliquée',
      message: 'La suggestion IA a été appliquée avec succès.',
      autoHide: true
    });
  }

  dismissSuggestion(suggestionId: string): void {
    this.aiSuggestionsService.dismissSuggestion(suggestionId);

    // Notification discrète
    this.notificationService.addNotification({
      type: 'info',
      title: 'Suggestion ignorée',
      message: 'La suggestion a été masquée.',
      autoHide: true
    });
  }

  refreshSuggestions(): void {
    this.aiSuggestionsService.refreshSuggestions();

    // Feedback visuel
    this.notificationService.addNotification({
      type: 'info',
      title: 'Suggestions actualisées',
      message: 'L\'IA analyse vos données pour de nouvelles recommandations.',
      autoHide: true
    });
  }
}