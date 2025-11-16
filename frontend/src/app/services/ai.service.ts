import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Task } from './task.service';

export interface AISuggestion {
  id: string;
  type: 'task' | 'improvement' | 'reminder' | 'optimization';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  confidence: number; // 0-1
  category?: string;
  dueDate?: Date;
  reasoning?: string;
  actionable: boolean;
}

export interface ProductivityInsight {
  id: string;
  type: 'pattern' | 'trend' | 'achievement' | 'warning';
  title: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  value?: number;
  trend?: 'up' | 'down' | 'stable';
  recommendation?: string;
  timestamp: Date;
}

export interface ProductivityMetrics {
  tasksCompleted: number;
  averageCompletionTime: number;
  productivityScore: number;
  focusTime: number;
  streakDays: number;
  weeklyGoal: number;
  monthlyGoal: number;
}

export interface ParsedTask {
  action: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  category: 'work' | 'personal' | 'shopping' | 'health' | 'other';
  dueDate: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private suggestionsSubject = new BehaviorSubject<AISuggestion[]>([]);
  private insightsSubject = new BehaviorSubject<ProductivityInsight[]>([]);

  public suggestions$ = this.suggestionsSubject.asObservable();
  public insights$ = this.insightsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeAI();
  }

  private initializeAI(): void {
    // Generate initial suggestions based on user patterns
    this.generateInitialSuggestions();
    this.generateProductivityInsights();
  }

  // AI-Powered Task Suggestions
  generateTaskSuggestions(tasks: Task[]): Observable<AISuggestion[]> {
    const suggestions: AISuggestion[] = [];

    // Analyze task patterns
    const completedTasks = tasks.filter(t => t.completed);
    const pendingTasks = tasks.filter(t => !t.completed);

    // Suggest recurring tasks
    const recurringPatterns = this.analyzeRecurringTasks(completedTasks);
    recurringPatterns.forEach(pattern => {
      suggestions.push({
        id: `recurring-${pattern.title}`,
        type: 'task',
        title: `Créer "${pattern.title}"`,
        description: `Tâche récurrente détectée. Dernière exécution: ${pattern.lastCompleted}`,
        priority: pattern.priority,
        confidence: 0.85,
        category: pattern.category,
        reasoning: 'Pattern recognition based on your task history',
        actionable: true
      });
    });

    // Suggest task optimizations
    const optimizationSuggestions = this.analyzeTaskOptimization(pendingTasks);
    suggestions.push(...optimizationSuggestions);

    // Suggest break times based on work patterns
    const breakSuggestion = this.analyzeBreakPatterns(completedTasks);
    if (breakSuggestion) {
      suggestions.push(breakSuggestion);
    }

    // Suggest priority adjustments
    const prioritySuggestions = this.analyzePriorityAdjustments(pendingTasks);
    suggestions.push(...prioritySuggestions);

    this.suggestionsSubject.next(suggestions);
    return of(suggestions);
  }

  // Productivity Analytics
  analyzeProductivity(tasks: Task[]): Observable<ProductivityMetrics> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentTasks = tasks.filter(t => new Date(t.createdAt) >= weekAgo);
    const monthlyTasks = tasks.filter(t => new Date(t.createdAt) >= monthAgo);

    const completedThisWeek = recentTasks.filter(t => t.completed).length;
    const completedThisMonth = monthlyTasks.filter(t => t.completed).length;

    // Calculate average completion time (simplified - using update time as proxy)
    const completedTasks = tasks.filter(t => t.completed);
    const avgCompletionTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, task) => {
          const created = new Date(task.createdAt).getTime();
          const updated = new Date(task.updatedAt).getTime();
          const time = updated - created;
          return sum + time;
        }, 0) / completedTasks.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Calculate productivity score (0-100)
    const productivityScore = Math.min(100, Math.max(0,
      (completedThisWeek / 10) * 50 + // 50% based on weekly completion
      (avgCompletionTime < 24 ? 30 : avgCompletionTime < 72 ? 15 : 0) + // 30% based on completion speed
      (completedThisMonth / 40) * 20 // 20% based on monthly consistency
    ));

    // Calculate focus time (estimated based on task completion patterns)
    const focusTime = this.calculateFocusTime(completedTasks);

    // Calculate streak
    const streakDays = this.calculateStreak(tasks);

    const metrics: ProductivityMetrics = {
      tasksCompleted: completedThisWeek,
      averageCompletionTime: Math.round(avgCompletionTime * 10) / 10,
      productivityScore: Math.round(productivityScore),
      focusTime: Math.round(focusTime),
      streakDays,
      weeklyGoal: 10, // Configurable
      monthlyGoal: 40  // Configurable
    };

    return of(metrics);
  }

  // Smart Scheduling Suggestions
  suggestOptimalSchedule(tasks: Task[]): Observable<any[]> {
    const suggestions = [];

    // Group tasks by priority and deadline
    const urgentTasks = tasks.filter(t => !t.completed && t.priority === 'high');
    const importantTasks = tasks.filter(t => !t.completed && t.priority === 'medium');

    // Suggest time blocks
    if (urgentTasks.length > 0) {
      suggestions.push({
        type: 'time-block',
        title: 'Bloc de focus urgent',
        description: `Allouer 2h ce matin pour ${urgentTasks.length} tâches urgentes`,
        timeSlot: '09:00-11:00',
        tasks: urgentTasks.slice(0, 3)
      });
    }

    if (importantTasks.length > 0) {
      suggestions.push({
        type: 'time-block',
        title: 'Bloc de développement',
        description: `Allouer 3h cet après-midi pour ${importantTasks.length} tâches importantes`,
        timeSlot: '14:00-17:00',
        tasks: importantTasks.slice(0, 4)
      });
    }

    return of(suggestions);
  }

  // Natural Language Processing for Task Creation
  parseNaturalLanguage(input: string): Observable<ParsedTask> {
    // Enhanced NLP for French commands
    const patterns = {
      create: /(?:crée|créer|ajouter?|nouvelle?|faire|commencer)/i,
      priority: /(?:urgent|urgence|priorité|important|critique|high|haute)/i,
      deadline: /(?:demain|lendemain|dans (\d+) jours?|pour (lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche))/i,
      category: /(?:travail|work|personnel|personal|shopping|courses|health|santé|finance)/i
    };

    const result: ParsedTask = {
      action: 'create',
      title: input,
      priority: 'medium',
      category: 'other',
      dueDate: null
    };

    // Extract priority
    if (patterns.priority.test(input)) {
      result.priority = 'high';
    }

    // Extract deadline
    const deadlineMatch = input.match(patterns.deadline);
    if (deadlineMatch) {
      if (deadlineMatch[1]) {
        // "dans X jours"
        const days = parseInt(deadlineMatch[1]);
        result.dueDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      } else if (deadlineMatch[2]) {
        // Specific day
        result.dueDate = this.parseDayOfWeek(deadlineMatch[2]);
      }
    }

    // Extract category
    if (patterns.category.test(input)) {
      if (/(?:travail|work)/i.test(input)) result.category = 'work';
      if (/(?:personnel|personal)/i.test(input)) result.category = 'personal';
      if (/(?:shopping|courses)/i.test(input)) result.category = 'shopping';
      if (/(?:health|santé)/i.test(input)) result.category = 'health';
    }

    return of(result);
  }

  private analyzeRecurringTasks(tasks: Task[]): any[] {
    // Simple pattern recognition for recurring tasks
    const taskTitles = tasks.map(t => t.title.toLowerCase());
    const recurring = taskTitles.filter((title, index) =>
      taskTitles.indexOf(title) !== index
    );

    return [...new Set(recurring)].map(title => ({
      title: title.charAt(0).toUpperCase() + title.slice(1),
      lastCompleted: tasks.find(t => t.title.toLowerCase() === title)?.updatedAt,
      priority: 'medium',
      category: 'recurring'
    }));
  }

  private analyzeTaskOptimization(tasks: Task[]): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Suggest breaking down large tasks
    const largeTasks = tasks.filter(t => t.title.length > 50);
    largeTasks.forEach(task => {
      suggestions.push({
        id: `breakdown-${task._id}`,
        type: 'optimization',
        title: `Diviser "${task.title.substring(0, 30)}..."`,
        description: 'Cette tâche semble complexe. Considérez la diviser en sous-tâches.',
        priority: 'medium',
        confidence: 0.7,
        reasoning: 'Task length analysis',
        actionable: true
      });
    });

    return suggestions;
  }

  private analyzeBreakPatterns(tasks: Task[]): AISuggestion | null {
    // Suggest breaks based on work patterns
    const recentTasks = tasks.filter(t =>
      t.completed && (Date.now() - new Date(t.updatedAt).getTime()) < 4 * 60 * 60 * 1000
    );

    if (recentTasks.length >= 3) {
      return {
        id: 'break-suggestion',
        type: 'reminder',
        title: 'Pause recommandée',
        description: 'Vous travaillez depuis 2h sans interruption. Prenez une pause de 5-10 minutes.',
        priority: 'medium',
        confidence: 0.8,
        reasoning: 'Work pattern analysis for optimal productivity',
        actionable: true
      };
    }

    return null;
  }

  private analyzePriorityAdjustments(tasks: Task[]): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Find overdue tasks
    const overdueTasks = tasks.filter(t =>
      t.dueDate && new Date(t.dueDate) < new Date() && !t.completed
    );

    overdueTasks.forEach(task => {
      suggestions.push({
        id: `priority-${task._id}`,
        type: 'improvement',
        title: `Augmenter priorité: "${task.title}"`,
        description: 'Cette tâche est en retard. Considérez l\'augmenter en priorité.',
        priority: 'high',
        confidence: 0.9,
        reasoning: 'Overdue task detection',
        actionable: true
      });
    });

    return suggestions;
  }

  private calculateFocusTime(tasks: Task[]): number {
    // Estimate focus time based on task completion patterns
    const completedToday = tasks.filter(t =>
      t.completed && this.isToday(new Date(t.updatedAt))
    );

    // Assume 25 minutes average per task (Pomodoro technique)
    return completedToday.length * 25;
  }

  private calculateStreak(tasks: Task[]): number {
    let streak = 0;
    const today = new Date();

    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const completedOnDate = tasks.some(t =>
        t.completed && this.isSameDay(new Date(t.updatedAt), date)
      );

      if (completedOnDate) {
        streak++;
      } else if (i > 0) { // Allow missing today but not previous days
        break;
      }
    }

    return streak;
  }

  private generateInitialSuggestions(): void {
    const suggestions: AISuggestion[] = [
      {
        id: 'welcome-1',
        type: 'task',
        title: 'Explorer les fonctionnalités IA',
        description: 'Découvrez les suggestions intelligentes et l\'analyse de productivité.',
        priority: 'low',
        confidence: 1.0,
        category: 'onboarding',
        reasoning: 'Welcome suggestion for new users',
        actionable: true
      },
      {
        id: 'welcome-2',
        type: 'improvement',
        title: 'Activer les notifications',
        description: 'Recevez des rappels intelligents pour vos tâches importantes.',
        priority: 'medium',
        confidence: 0.9,
        reasoning: 'Productivity enhancement suggestion',
        actionable: true
      }
    ];

    this.suggestionsSubject.next(suggestions);
  }

  private generateProductivityInsights(): void {
    const insights: ProductivityInsight[] = [
      {
        id: 'insight-1',
        type: 'achievement',
        title: 'Première semaine productive !',
        description: 'Vous avez maintenu une séquence de tâches complétées.',
        impact: 'positive',
        timestamp: new Date()
      }
    ];

    this.insightsSubject.next(insights);
  }

  private parseDayOfWeek(day: string): Date {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const dayIndex = days.indexOf(day.toLowerCase());
    const today = new Date();
    const targetDay = new Date(today);

    targetDay.setDate(today.getDate() + (dayIndex - today.getDay() + 7) % 7);
    if (targetDay <= today) {
      targetDay.setDate(targetDay.getDate() + 7);
    }

    return targetDay;
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() === date2.toDateString();
  }
}