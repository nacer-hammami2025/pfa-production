import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { TaskService, Task } from './task.service';

export interface AISuggestion {
  id: string;
  type: 'priority' | 'schedule' | 'productivity' | 'pattern' | 'reminder';
  title: string;
  description: string;
  confidence: number; // 0-100
  actionable: boolean;
  taskId?: string;
  suggestedAction?: {
    label: string;
    callback: () => void;
  };
  metadata?: any;
}

export interface ProductivityPattern {
  mostProductiveHour: number;
  mostProductiveDay: number;
  preferredCategories: string[];
  averageTaskDuration: number;
  completionRateByHour: { [hour: number]: number };
  completionRateByDay: { [day: number]: number };
}

@Injectable({
  providedIn: 'root'
})
export class AISuggestionsService {
  private suggestions = new BehaviorSubject<AISuggestion[]>([]);
  private productivityPatterns = new BehaviorSubject<ProductivityPattern | null>(null);

  constructor(private taskService: TaskService) {
    this.initializeAISuggestions();
  }

  getSuggestions(): Observable<AISuggestion[]> {
    return this.suggestions.asObservable();
  }

  getProductivityPatterns(): Observable<ProductivityPattern | null> {
    return this.productivityPatterns.asObservable();
  }

  private initializeAISuggestions(): void {
    // Analyser les tâches et générer des suggestions
    combineLatest([
      this.taskService.getTasks(),
      this.taskService.getTaskStats()
    ]).subscribe(([tasks, stats]) => {
      this.analyzeProductivityPatterns(tasks);
      this.generateSuggestions(tasks, stats);
    });
  }

  private analyzeProductivityPatterns(tasks: Task[]): void {
    if (tasks.length === 0) return;

    const completedTasks = tasks.filter(task => task.completed);

    // Analyser les heures les plus productives
    const hourCounts: { [hour: number]: number } = {};
    const dayCounts: { [day: number]: number } = {};

    completedTasks.forEach(task => {
      const completedDate = new Date(task.updatedAt);
      const hour = completedDate.getHours();
      const day = completedDate.getDay();

      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    // Trouver l'heure la plus productive
    const mostProductiveHour = Object.keys(hourCounts).reduce((a, b) =>
      hourCounts[+a] > hourCounts[+b] ? a : b, '9'
    );

    // Trouver le jour le plus productif
    const mostProductiveDay = Object.keys(dayCounts).reduce((a, b) =>
      dayCounts[+a] > dayCounts[+b] ? a : b, '1'
    );

    // Analyser les catégories préférées
    const categoryCounts: { [category: string]: number } = {};
    tasks.forEach(task => {
      categoryCounts[task.category] = (categoryCounts[task.category] || 0) + 1;
    });

    const preferredCategories = Object.keys(categoryCounts)
      .sort((a, b) => categoryCounts[b] - categoryCounts[a])
      .slice(0, 3);

    // Calculer la durée moyenne des tâches
    const totalDuration = completedTasks.reduce((sum, task) => {
      const created = new Date(task.createdAt);
      const completed = new Date(task.updatedAt);
      return sum + (completed.getTime() - created.getTime());
    }, 0);

    const averageTaskDuration = totalDuration / completedTasks.length;

    // Calculer les taux de completion par heure et par jour
    const completionRateByHour: { [hour: number]: number } = {};
    const completionRateByDay: { [day: number]: number } = {};

    // Pour chaque heure/jour, calculer le taux de completion
    for (let hour = 0; hour < 24; hour++) {
      const tasksAtHour = tasks.filter(task => {
        if (!task.completed) return false;
        const taskHour = new Date(task.updatedAt).getHours();
        return taskHour === hour;
      });
      const totalTasksAtHour = tasks.filter(task => {
        const taskHour = new Date(task.createdAt).getHours();
        return taskHour === hour;
      });
      completionRateByHour[hour] = totalTasksAtHour.length > 0 ?
        (tasksAtHour.length / totalTasksAtHour.length) * 100 : 0;
    }

    for (let day = 0; day < 7; day++) {
      const tasksOnDay = tasks.filter(task => {
        if (!task.completed) return false;
        const taskDay = new Date(task.updatedAt).getDay();
        return taskDay === day;
      });
      const totalTasksOnDay = tasks.filter(task => {
        const taskDay = new Date(task.createdAt).getDay();
        return taskDay === day;
      });
      completionRateByDay[day] = totalTasksOnDay.length > 0 ?
        (tasksOnDay.length / totalTasksOnDay.length) * 100 : 0;
    }

    const patterns: ProductivityPattern = {
      mostProductiveHour: +mostProductiveHour,
      mostProductiveDay: +mostProductiveDay,
      preferredCategories,
      averageTaskDuration,
      completionRateByHour,
      completionRateByDay
    };

    this.productivityPatterns.next(patterns);
  }

  private generateSuggestions(tasks: Task[], stats: any): void {
    const suggestions: AISuggestion[] = [];

    // Suggestions de priorité
    suggestions.push(...this.generatePrioritySuggestions(tasks));

    // Suggestions de planification
    suggestions.push(...this.generateSchedulingSuggestions(tasks));

    // Suggestions de productivité
    suggestions.push(...this.generateProductivitySuggestions(tasks, stats));

    // Détection de patterns
    suggestions.push(...this.generatePatternSuggestions(tasks));

    // Trier par confiance et limiter à 10 suggestions
    suggestions.sort((a, b) => b.confidence - a.confidence);
    this.suggestions.next(suggestions.slice(0, 10));
  }

  private generatePrioritySuggestions(tasks: Task[]): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const pendingTasks = tasks.filter(task => !task.completed);

    // Tâches proches de l'échéance
    const urgentTasks = pendingTasks.filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      const now = new Date();
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntilDue > 0 && hoursUntilDue <= 24;
    });

    urgentTasks.forEach(task => {
      suggestions.push({
        id: `priority-${task._id}`,
        type: 'priority',
        title: 'Tâche prioritaire à traiter',
        description: `"${task.title}" arrive à échéance bientôt. Considérez la traiter en priorité.`,
        confidence: 90,
        actionable: true,
        taskId: task._id,
        suggestedAction: {
          label: 'Marquer comme prioritaire',
          callback: () => {
            // Callback à définir dans le composant
            console.log('Marquer tâche comme prioritaire:', task.title);
          }
        }
      });
    });

    // Tâches en retard
    const overdueTasks = pendingTasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < new Date();
    });

    overdueTasks.forEach(task => {
      suggestions.push({
        id: `overdue-${task._id}`,
        type: 'priority',
        title: 'Tâche en retard',
        description: `"${task.title}" est en retard. Traitez-la immédiatement pour éviter l'accumulation.`,
        confidence: 95,
        actionable: true,
        taskId: task._id,
        suggestedAction: {
          label: 'Voir la tâche',
          callback: () => {
            console.log('Voir tâche en retard:', task.title);
          }
        }
      });
    });

    return suggestions;
  }

  private generateSchedulingSuggestions(tasks: Task[]): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const patterns = this.productivityPatterns.value;

    if (!patterns) return suggestions;

    const pendingTasks = tasks.filter(task => !task.completed);

    // Suggérer des créneaux horaires optimaux
    pendingTasks.slice(0, 3).forEach(task => {
      const suggestedHour = patterns.mostProductiveHour;
      const hourLabel = suggestedHour < 12 ?
        `${suggestedHour}h` :
        suggestedHour === 12 ? '12h' : `${suggestedHour - 12}h`;

      suggestions.push({
        id: `schedule-${task._id}`,
        type: 'schedule',
        title: 'Créneau optimal suggéré',
        description: `Planifiez "${task.title}" vers ${hourLabel} quand vous êtes le plus productif.`,
        confidence: 75,
        actionable: true,
        taskId: task._id,
        metadata: { suggestedHour }
      });
    });

    return suggestions;
  }

  private generateProductivitySuggestions(tasks: Task[], stats: any): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const patterns = this.productivityPatterns.value;

    if (!patterns) return suggestions;

    // Suggestion basée sur les séries
    const completedTasks = tasks.filter(task => task.completed);
    if (completedTasks.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayCompleted = completedTasks.filter(task =>
        new Date(task.updatedAt) >= today
      ).length;

      if (todayCompleted === 0) {
        suggestions.push({
          id: 'productivity-start-day',
          type: 'productivity',
          title: 'Commencez votre journée productive',
          description: `Vous êtes le plus productif vers ${patterns.mostProductiveHour}h. C'est le moment idéal pour commencer !`,
          confidence: 80,
          actionable: true,
          suggestedAction: {
            label: 'Voir mes tâches',
            callback: () => {
              console.log('Voir les tâches pour commencer la journée');
            }
          }
        });
      }
    }

    // Suggestion basée sur les catégories préférées
    if (patterns.preferredCategories.length > 0) {
      const pendingTasks = tasks.filter(task => !task.completed);
      const preferredCategoryTasks = pendingTasks.filter(task =>
        patterns.preferredCategories.includes(task.category)
      );

      if (preferredCategoryTasks.length > 0) {
        suggestions.push({
          id: 'productivity-preferred-category',
          type: 'productivity',
          title: 'Tâches dans vos catégories préférées',
          description: `Vous avez ${preferredCategoryTasks.length} tâche(s) dans vos catégories favorites (${patterns.preferredCategories.slice(0, 2).join(', ')}).`,
          confidence: 70,
          actionable: true
        });
      }
    }

    return suggestions;
  }

  private generatePatternSuggestions(tasks: Task[]): AISuggestion[] {
    const suggestions: AISuggestion[] = [];
    const patterns = this.productivityPatterns.value;

    if (!patterns) return suggestions;

    // Analyser les weekends vs semaine
    const weekdayTasks = tasks.filter(task => {
      const day = new Date(task.createdAt).getDay();
      return day >= 1 && day <= 5; // Lundi à Vendredi
    });

    const weekendTasks = tasks.filter(task => {
      const day = new Date(task.createdAt).getDay();
      return day === 0 || day === 6; // Samedi et Dimanche
    });

    if (weekdayTasks.length > weekendTasks.length * 2) {
      suggestions.push({
        id: 'pattern-weekday-focus',
        type: 'pattern',
        title: 'Focus en semaine détecté',
        description: 'Vous créez beaucoup plus de tâches en semaine. Considérez utiliser les weekends pour vous reposer.',
        confidence: 65,
        actionable: false
      });
    }

    // Analyser la durée des tâches
    const avgDurationHours = patterns.averageTaskDuration / (1000 * 60 * 60);
    if (avgDurationHours > 4) {
      suggestions.push({
        id: 'pattern-long-tasks',
        type: 'pattern',
        title: 'Tâches longues détectées',
        description: 'Vos tâches durent en moyenne plus de 4h. Essayez de les diviser en tâches plus petites.',
        confidence: 70,
        actionable: true,
        suggestedAction: {
          label: 'Voir les tâches longues',
          callback: () => {
            console.log('Voir les tâches longues à diviser');
          }
        }
      });
    }

    // Analyser la répartition des priorités
    const priorityCounts = {
      low: tasks.filter(t => t.priority === 'low').length,
      medium: tasks.filter(t => t.priority === 'medium').length,
      high: tasks.filter(t => t.priority === 'high').length,
      urgent: tasks.filter(t => t.priority === 'urgent').length
    };

    const totalTasks = tasks.length;
    const urgentPercentage = (priorityCounts.urgent / totalTasks) * 100;

    if (urgentPercentage > 30) {
      suggestions.push({
        id: 'pattern-many-urgent',
        type: 'pattern',
        title: 'Trop de tâches urgentes',
        description: `${urgentPercentage.toFixed(1)}% de vos tâches sont urgentes. Considérez mieux planifier à l'avance.`,
        confidence: 75,
        actionable: true
      });
    }

    return suggestions;
  }

  // Méthodes publiques pour interagir avec les suggestions
  dismissSuggestion(suggestionId: string): void {
    const current = this.suggestions.value;
    this.suggestions.next(current.filter(s => s.id !== suggestionId));
  }

  applySuggestion(suggestion: AISuggestion): void {
    if (suggestion.suggestedAction?.callback) {
      suggestion.suggestedAction.callback();
    }

    // Marquer comme appliquée (optionnel)
    this.dismissSuggestion(suggestion.id);
  }

  refreshSuggestions(): void {
    // Forcer une réanalyse
    this.initializeAISuggestions();
  }

  // Obtenir des statistiques pour l'IA
  getTaskInsights(): Observable<any> {
    return combineLatest([
      this.taskService.getTasks(),
      this.productivityPatterns
    ]).pipe(
      map(([tasks, patterns]) => ({
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
        pendingTasks: tasks.filter(t => !t.completed).length,
        overdueTasks: tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length,
        patterns,
        recentActivity: this.getRecentActivity(tasks),
        productivityScore: this.calculateProductivityScore(tasks)
      }))
    );
  }

  private getRecentActivity(tasks: Task[]): any {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const recentTasks = tasks.filter(task =>
      new Date(task.createdAt) >= last7Days
    );

    return {
      tasksCreated: recentTasks.length,
      tasksCompleted: recentTasks.filter(t => t.completed).length,
      averagePerDay: recentTasks.length / 7
    };
  }

  private calculateProductivityScore(tasks: Task[]): number {
    if (tasks.length === 0) return 0;

    const completedTasks = tasks.filter(t => t.completed).length;
    const overdueTasks = tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length;
    const onTimeCompletion = completedTasks - overdueTasks;

    const baseScore = (completedTasks / tasks.length) * 100;
    const penalty = (overdueTasks / tasks.length) * 50;

    return Math.max(0, Math.min(100, baseScore - penalty));
  }
}