import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { UserGamification, Leaderboard, Achievement, Badge, Reward, GamificationEvent } from '../models/team.model';

@Injectable({
  providedIn: 'root'
})
export class GamificationService {
  private apiUrl = '/api/gamification';
  private gamificationSubject = new BehaviorSubject<UserGamification | null>(null);
  public gamification$ = this.gamificationSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUserProfile();
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  loadUserProfile(): Observable<UserGamification> {
    return this.http.get<UserGamification>(`${this.apiUrl}/profile`, { headers: this.getHeaders() })
      .pipe(
        tap(profile => this.gamificationSubject.next(profile))
      );
  }

  updateStats(action: string, metadata: any = {}): Observable<{
    gamification: UserGamification;
    events: GamificationEvent[];
    pointsEarned: number;
    experienceEarned: number;
  }> {
    return this.http.post<{
      gamification: UserGamification;
      events: GamificationEvent[];
      pointsEarned: number;
      experienceEarned: number;
    }>(`${this.apiUrl}/update-stats`, { action, metadata }, { headers: this.getHeaders() })
      .pipe(
        tap(response => {
          this.gamificationSubject.next(response.gamification);
        })
      );
  }

  getLeaderboard(type: 'points' | 'level' | 'streak', period?: string): Observable<Leaderboard> {
    const params = period ? `?period=${period}` : '';
    return this.http.get<Leaderboard>(`${this.apiUrl}/leaderboard/${type}${params}`, { headers: this.getHeaders() });
  }

  getAchievements(): Observable<{ achievements: Achievement[]; badges: Badge[] }> {
    return this.http.get<{ achievements: Achievement[]; badges: Badge[] }>(`${this.apiUrl}/achievements`, { headers: this.getHeaders() });
  }

  getRewards(): Observable<Reward[]> {
    return this.http.get<Reward[]>(`${this.apiUrl}/rewards`, { headers: this.getHeaders() });
  }

  claimReward(rewardId: string): Observable<{ message: string; reward: Reward }> {
    return this.http.post<{ message: string; reward: Reward }>(`${this.apiUrl}/rewards/${rewardId}/claim`, {}, { headers: this.getHeaders() })
      .pipe(
        tap(() => {
          // Reload profile after claiming reward
          this.loadUserProfile().subscribe();
        })
      );
  }

  // Helper methods for common actions
  taskCompleted(task: any): Observable<any> {
    return this.updateStats('task_completed', {
      title: task.title,
      priority: task.priority,
      timeSpent: task.timeSpent,
      estimatedTime: task.estimatedTime,
      complexity: task.complexity
    });
  }

  taskCreated(task: any): Observable<any> {
    return this.updateStats('task_created', {
      title: task.title,
      priority: task.priority
    });
  }

  dailyLogin(): Observable<any> {
    return this.updateStats('daily_login');
  }

  streakMaintained(days: number): Observable<any> {
    return this.updateStats('streak_maintained', { days });
  }

  // Utility methods
  getCurrentGamification(): UserGamification | null {
    return this.gamificationSubject.value;
  }

  getLevelProgress(): { current: number; next: number; percentage: number } {
    const gamification = this.getCurrentGamification();
    if (!gamification) {
      return { current: 0, next: 100, percentage: 0 };
    }

    const current = gamification.experience;
    const next = gamification.experienceToNext;
    const percentage = (current / next) * 100;

    return { current, next, percentage };
  }

  getStreakStatus(): { current: number; longest: number; isActive: boolean } {
    const gamification = this.getCurrentGamification();
    if (!gamification) {
      return { current: 0, longest: 0, isActive: false };
    }

    const today = new Date().toDateString();
    const lastActivity = gamification.lastActivityDate ? new Date(gamification.lastActivityDate).toDateString() : null;
    const isActive = lastActivity === today;

    return {
      current: gamification.currentStreak,
      longest: gamification.longestStreak,
      isActive
    };
  }

  getNextAchievement(): Achievement | null {
    // This would require fetching achievement configs from backend
    // For now, return null - could be implemented later
    return null;
  }

  getBadgeRarityColor(rarity: string): string {
    switch (rarity) {
      case 'common': return '#8B8B8B';
      case 'uncommon': return '#4CAF50';
      case 'rare': return '#2196F3';
      case 'epic': return '#9C27B0';
      case 'legendary': return '#FF9800';
      default: return '#8B8B8B';
    }
  }

  getAchievementCategoryIcon(category: string): string {
    switch (category) {
      case 'getting_started': return '🚀';
      case 'productivity': return '⚡';
      case 'consistency': return '🔥';
      case 'progression': return '📈';
      case 'social': return '👥';
      case 'quality': return '✨';
      default: return '🏆';
    }
  }

  formatPoints(points: number): string {
    if (points >= 1000000) {
      return (points / 1000000).toFixed(1) + 'M';
    } else if (points >= 1000) {
      return (points / 1000).toFixed(1) + 'K';
    }
    return points.toString();
  }

  getMotivationalMessage(): string {
    const gamification = this.getCurrentGamification();
    if (!gamification) return 'Commencez votre voyage de productivité !';

    const streak = this.getStreakStatus();

    if (streak.current === 0) {
      return 'Reprenez votre série aujourd\'hui !';
    } else if (streak.current < 7) {
      return `Série de ${streak.current} jour${streak.current > 1 ? 's' : ''} ! Continuez !`;
    } else if (streak.current < 30) {
      return `Incroyable ! ${streak.current} jours consécutifs !`;
    } else {
      return `Légende ! ${streak.current} jours d'affilée ! 🔥`;
    }
  }
}