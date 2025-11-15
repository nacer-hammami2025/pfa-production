import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { GamificationService } from '../../services/gamification.service';
import { UserGamification, Leaderboard, Achievement, Badge, Reward } from '../../models/team.model';

@Component({
  selector: 'app-gamification',
  templateUrl: './gamification.component.html',
  styleUrls: ['./gamification.component.css']
})
export class GamificationComponent implements OnInit, OnDestroy {
  gamification: UserGamification | null = null;
  leaderboard: Leaderboard | null = null;
  achievements: Achievement[] = [];
  badges: Badge[] = [];
  rewards: Reward[] = [];
  selectedTab: 'profile' | 'leaderboard' | 'achievements' | 'rewards' = 'profile';
  leaderboardType: 'points' | 'level' | 'streak' = 'points';
  isLoading = false;
  private subscriptions: Subscription[] = [];

  constructor(private gamificationService: GamificationService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadData(): void {
    this.isLoading = true;

    // Subscribe to gamification profile updates
    this.subscriptions.push(
      this.gamificationService.gamification$.subscribe(profile => {
        this.gamification = profile;
        this.isLoading = false;
      })
    );

    // Load achievements and badges
    this.subscriptions.push(
      this.gamificationService.getAchievements().subscribe(data => {
        this.achievements = data.achievements;
        this.badges = data.badges;
      })
    );

    // Load rewards
    this.subscriptions.push(
      this.gamificationService.getRewards().subscribe(rewards => {
        this.rewards = rewards;
      })
    );

    // Load leaderboard
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.gamificationService.getLeaderboard(this.leaderboardType).subscribe(leaderboard => {
      this.leaderboard = leaderboard;
    });
  }

  onTabChange(tab: 'profile' | 'leaderboard' | 'achievements' | 'rewards'): void {
    this.selectedTab = tab;
    if (tab === 'leaderboard') {
      this.loadLeaderboard();
    }
  }

  onLeaderboardTypeChange(type: 'points' | 'level' | 'streak'): void {
    this.leaderboardType = type;
    this.loadLeaderboard();
  }

  claimReward(reward: Reward): void {
    if (!reward.isUnlocked) return;

    this.gamificationService.claimReward(reward.id).subscribe(
      response => {
        console.log('Reward claimed:', response);
        // Reward will be updated in the profile via the service
      },
      error => {
        console.error('Error claiming reward:', error);
      }
    );
  }

  getLevelProgress(): { current: number; next: number; percentage: number } {
    return this.gamificationService.getLevelProgress();
  }

  getStreakStatus(): { current: number; longest: number; isActive: boolean } {
    return this.gamificationService.getStreakStatus();
  }

  getMotivationalMessage(): string {
    return this.gamificationService.getMotivationalMessage();
  }

  getBadgeRarityColor(rarity: string): string {
    return this.gamificationService.getBadgeRarityColor(rarity);
  }

  getAchievementCategoryIcon(category: string): string {
    return this.gamificationService.getAchievementCategoryIcon(category);
  }

  formatPoints(points: number): string {
    return this.gamificationService.formatPoints(points);
  }

  getRankChangeIcon(change: number): string {
    if (change > 0) return '📈';
    if (change < 0) return '📉';
    return '➡️';
  }

  getRankChangeText(change: number): string {
    if (change > 0) return `+${change}`;
    if (change < 0) return change.toString();
    return '0';
  }

  // Helper methods for template
  getCompletedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.isCompleted);
  }

  getInProgressAchievements(): Achievement[] {
    return this.achievements.filter(a => !a.isCompleted);
  }

  getUnlockedRewards(): Reward[] {
    return this.rewards.filter(r => r.isUnlocked);
  }

  getLockedRewards(): Reward[] {
    return this.rewards.filter(r => !r.isUnlocked);
  }

  isRewardClaimed(reward: Reward): boolean {
    if (!this.gamification?.rewards) return false;
    return this.gamification.rewards.some(r => r.id === reward.id);
  }
}