import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval, combineLatest } from 'rxjs';
import { GamificationService } from '../../services/gamification.service';
import { NotificationApiService } from '../../services/notification-api.service';
import { UserGamification, Leaderboard, Achievement, Badge, Reward, GamificationEvent } from '../../models/team.model';

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'tasks_completed' | 'focus_time' | 'streak_maintenance' | 'category_focus';
  target: number;
  current: number;
  reward: {
    points: number;
    experience: number;
    badge?: string;
  };
  timeLeft: number; // in hours
  isCompleted: boolean;
  isClaimed: boolean;
}

interface WeeklyQuest {
  id: string;
  title: string;
  description: string;
  type: 'productivity_master' | 'team_player' | 'consistency_king' | 'quality_focus';
  requirements: {
    tasks_completed?: number;
    focus_hours?: number;
    streak_days?: number;
    categories_used?: number;
  };
  progress: {
    tasks_completed?: number;
    focus_hours?: number;
    streak_days?: number;
    categories_used?: number;
  };
  reward: {
    points: number;
    experience: number;
    title?: string;
    badge?: string;
  };
  isCompleted: boolean;
  isClaimed: boolean;
  expiresAt: Date;
}

interface LevelUpAnimation {
  show: boolean;
  newLevel: number;
  pointsGained: number;
  badgesEarned: Badge[];
}

interface AchievementUnlockAnimation {
  show: boolean;
  achievement: Achievement;
  particles: boolean;
}

@Component({
  selector: 'app-advanced-gamification',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="advanced-gamification-wrapper">
      <!-- Level Up Animation Overlay -->
      <div class="level-up-overlay" *ngIf="levelUpAnimation.show" (click)="dismissLevelUp()">
        <div class="level-up-modal glass-card">
          <div class="level-up-content">
            <div class="level-up-icon">🎉</div>
            <h2>Level Up!</h2>
            <div class="new-level">Level {{ levelUpAnimation.newLevel }}</div>
            <div class="points-gained">+{{ levelUpAnimation.pointsGained }} XP</div>
            <div class="badges-earned" *ngIf="levelUpAnimation.badgesEarned.length > 0">
              <h3>New Badges Unlocked!</h3>
              <div class="badge-list">
                <div class="badge-item" *ngFor="let badge of levelUpAnimation.badgesEarned">
                  <span class="badge-icon">{{ badge.icon }}</span>
                  <span class="badge-name">{{ badge.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Achievement Unlock Animation -->
      <div class="achievement-overlay" *ngIf="achievementAnimation.show" (click)="dismissAchievement()">
        <div class="achievement-modal glass-card">
          <div class="achievement-content">
            <div class="achievement-icon">{{ achievementAnimation.achievement.icon }}</div>
            <h2>Achievement Unlocked!</h2>
            <div class="achievement-name">{{ achievementAnimation.achievement.name }}</div>
            <div class="achievement-description">{{ achievementAnimation.achievement.description }}</div>
            <div class="achievement-reward">
              +{{ achievementAnimation.achievement.pointsReward }} points
            </div>
          </div>
          <div class="particles" *ngIf="achievementAnimation.particles">
            <div class="particle" *ngFor="let i of [1,2,3,4,5,6,7,8,9,10]"></div>
          </div>
        </div>
      </div>

      <!-- Header -->
      <div class="gamification-header glass-card">
        <div class="header-content">
          <h1 class="header-title">
            <i class="header-icon">🏆</i>
            Advanced Gamification Center
          </h1>
          <p class="header-subtitle">Level up your productivity with achievements, challenges, and rewards</p>
        </div>

        <!-- Quick Stats -->
        <div class="quick-stats">
          <div class="stat-item">
            <div class="stat-value">{{ gamification?.level || 0 }}</div>
            <div class="stat-label">Level</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ gamification?.points || 0 }}</div>
            <div class="stat-label">Points</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ getStreakStatus().current }}</div>
            <div class="stat-label">Streak</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ completedAchievements.length }}</div>
            <div class="stat-label">Achievements</div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="navigation-tabs">
        <button
          class="tab-button"
          [class.active]="activeTab === 'dashboard'"
          (click)="setActiveTab('dashboard')"
        >
          <i class="tab-icon">📊</i>
          Dashboard
        </button>
        <button
          class="tab-button"
          [class.active]="activeTab === 'challenges'"
          (click)="setActiveTab('challenges')"
        >
          <i class="tab-icon">🎯</i>
          Challenges
          <span class="tab-badge" *ngIf="unclaimedChallengesCount > 0">{{ unclaimedChallengesCount }}</span>
        </button>
        <button
          class="tab-button"
          [class.active]="activeTab === 'achievements'"
          (click)="setActiveTab('achievements')"
        >
          <i class="tab-icon">🏆</i>
          Achievements
        </button>
        <button
          class="tab-button"
          [class.active]="activeTab === 'leaderboard'"
          (click)="setActiveTab('leaderboard')"
        >
          <i class="tab-icon">👑</i>
          Leaderboard
        </button>
        <button
          class="tab-button"
          [class.active]="activeTab === 'rewards'"
          (click)="setActiveTab('rewards')"
        >
          <i class="tab-icon">🎁</i>
          Rewards
          <span class="tab-badge" *ngIf="unclaimedRewardsCount > 0">{{ unclaimedRewardsCount }}</span>
        </button>
      </div>

      <!-- Dashboard Tab -->
      <div class="tab-content" *ngIf="activeTab === 'dashboard'">
        <!-- Level Progress -->
        <div class="level-progress-section">
          <div class="level-card glass-card">
            <div class="level-header">
              <div class="level-info">
                <h3>Level {{ gamification?.level || 1 }}</h3>
                <div class="experience-info">
                  {{ gamification?.experience || 0 }} / {{ gamification?.experienceToNext || 100 }} XP
                </div>
              </div>
              <div class="level-avatar">
                <div class="avatar-circle" [style.background]="getLevelColor()">
                  <span class="level-number">{{ gamification?.level || 1 }}</span>
                </div>
              </div>
            </div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                [style.width.%]="getLevelProgress().percentage"
              ></div>
            </div>
            <div class="level-benefits">
              <div class="benefit-item">
                <span class="benefit-icon">⚡</span>
                <span>{{ getNextLevelBenefits() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Daily Challenges -->
        <div class="daily-challenges-section">
          <h3 class="section-title">Daily Challenges</h3>
          <div class="challenges-grid">
            <div
              class="challenge-card glass-card"
              *ngFor="let challenge of dailyChallenges"
              [class.completed]="challenge.isCompleted"
              [class.claimed]="challenge.isClaimed"
            >
              <div class="challenge-header">
                <div class="challenge-icon">{{ getChallengeIcon(challenge.type) }}</div>
                <div class="challenge-status">
                  <span class="status-badge" *ngIf="challenge.isCompleted && !challenge.isClaimed">Ready to Claim</span>
                  <span class="status-badge claimed" *ngIf="challenge.isClaimed">Claimed</span>
                </div>
              </div>
              <div class="challenge-content">
                <h4>{{ challenge.title }}</h4>
                <p>{{ challenge.description }}</p>
                <div class="challenge-progress">
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      [style.width.%]="(challenge.current / challenge.target) * 100"
                    ></div>
                  </div>
                  <div class="progress-text">{{ challenge.current }}/{{ challenge.target }}</div>
                </div>
                <div class="challenge-reward">
                  <span class="reward-points">+{{ challenge.reward.points }} pts</span>
                  <span class="reward-xp">+{{ challenge.reward.experience }} XP</span>
                </div>
              </div>
              <div class="challenge-actions">
                <button
                  class="claim-btn"
                  *ngIf="challenge.isCompleted && !challenge.isClaimed"
                  (click)="claimDailyChallenge(challenge)"
                >
                  Claim Reward
                </button>
                <div class="time-left" *ngIf="!challenge.isCompleted">
                  {{ formatTimeLeft(challenge.timeLeft) }} left
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="activity-section">
          <h3 class="section-title">Recent Activity</h3>
          <div class="activity-feed">
            <div class="activity-item" *ngFor="let activity of recentActivities">
              <div class="activity-icon">{{ activity.icon }}</div>
              <div class="activity-content">
                <div class="activity-text">{{ activity.text }}</div>
                <div class="activity-time">{{ formatActivityTime(activity.timestamp) }}</div>
              </div>
              <div class="activity-reward" *ngIf="activity.points">
                +{{ activity.points }} pts
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Challenges Tab -->
      <div class="tab-content" *ngIf="activeTab === 'challenges'">
        <div class="challenges-header">
          <h3>Weekly Quests</h3>
          <p>Complete these quests to earn exclusive rewards and titles</p>
        </div>

        <div class="weekly-quests">
          <div
            class="quest-card glass-card"
            *ngFor="let quest of weeklyQuests"
            [class.completed]="quest.isCompleted"
            [class.claimed]="quest.isClaimed"
          >
            <div class="quest-header">
              <div class="quest-icon">{{ getQuestIcon(quest.type) }}</div>
              <div class="quest-title">
                <h4>{{ quest.title }}</h4>
                <div class="quest-expiry">Expires {{ formatExpiryTime(quest.expiresAt) }}</div>
              </div>
              <div class="quest-status">
                <span class="status-badge" *ngIf="quest.isCompleted && !quest.isClaimed">Ready to Claim</span>
                <span class="status-badge claimed" *ngIf="quest.isClaimed">Claimed</span>
              </div>
            </div>

            <div class="quest-description">{{ quest.description }}</div>

            <div class="quest-requirements">
              <div class="requirement-item" *ngFor="let req of getQuestRequirements(quest)">
                <div class="requirement-icon">{{ getRequirementIcon(req.type) }}</div>
                <div class="requirement-text">
                  {{ req.label }}: {{ req.current }}/{{ req.target }}
                </div>
                <div class="requirement-progress">
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      [style.width.%]="(req.current / req.target) * 100"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <div class="quest-rewards">
              <div class="reward-item">
                <span class="reward-icon">⭐</span>
                <span>{{ quest.reward.points }} points</span>
              </div>
              <div class="reward-item">
                <span class="reward-icon">⚡</span>
                <span>{{ quest.reward.experience }} XP</span>
              </div>
              <div class="reward-item" *ngIf="quest.reward.title">
                <span class="reward-icon">👑</span>
                <span>{{ quest.reward.title }}</span>
              </div>
            </div>

            <div class="quest-actions">
              <button
                class="claim-btn primary"
                *ngIf="quest.isCompleted && !quest.isClaimed"
                (click)="claimWeeklyQuest(quest)"
              >
                Claim Quest Reward
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Achievements Tab -->
      <div class="tab-content" *ngIf="activeTab === 'achievements'">
        <div class="achievements-header">
          <div class="achievements-filters">
            <button
              class="filter-btn"
              [class.active]="achievementFilter === 'all'"
              (click)="setAchievementFilter('all')"
            >
              All ({{ achievements.length }})
            </button>
            <button
              class="filter-btn"
              [class.active]="achievementFilter === 'completed'"
              (click)="setAchievementFilter('completed')"
            >
              Completed ({{ completedAchievements.length }})
            </button>
            <button
              class="filter-btn"
              [class.active]="achievementFilter === 'in-progress'"
              (click)="setAchievementFilter('in-progress')"
            >
              In Progress ({{ inProgressAchievements.length }})
            </button>
          </div>
        </div>

        <div class="achievements-grid">
          <div
            class="achievement-card glass-card"
            *ngFor="let achievement of filteredAchievements"
            [class.completed]="achievement.isCompleted"
            [class.locked]="!achievement.isUnlocked"
          >
            <div class="achievement-icon" [style.color]="getBadgeRarityColor(achievement.rarity)">
              {{ achievement.isCompleted ? achievement.icon : '🔒' }}
            </div>
            <div class="achievement-content">
              <h4>{{ achievement.name }}</h4>
              <p>{{ achievement.description }}</p>
              <div class="achievement-progress" *ngIf="!achievement.isCompleted">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    [style.width.%]="getAchievementProgress(achievement)"
                  ></div>
                </div>
                <span class="progress-text">{{ getAchievementProgressText(achievement) }}</span>
              </div>
              <div class="achievement-reward" *ngIf="achievement.isCompleted">
                <span class="reward-points">+{{ achievement.pointsReward }} points</span>
              </div>
            </div>
            <div class="achievement-category">
              <span class="category-badge" [style.background]="getCategoryColor(achievement.category)">
                {{ getAchievementCategoryIcon(achievement.category) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Leaderboard Tab -->
      <div class="tab-content" *ngIf="activeTab === 'leaderboard'">
        <div class="leaderboard-header">
          <div class="leaderboard-types">
            <button
              class="type-btn"
              [class.active]="leaderboardType === 'points'"
              (click)="setLeaderboardType('points')"
            >
              Points
            </button>
            <button
              class="type-btn"
              [class.active]="leaderboardType === 'level'"
              (click)="setLeaderboardType('level')"
            >
              Level
            </button>
            <button
              class="type-btn"
              [class.active]="leaderboardType === 'streak'"
              (click)="setLeaderboardType('streak')"
            >
              Streak
            </button>
          </div>
        </div>

        <div class="leaderboard-content">
          <!-- Top 3 Podium -->
          <div class="podium" *ngIf="leaderboard && leaderboard.topUsers && leaderboard.topUsers.length >= 3">
            <div class="podium-item second">
              <div class="podium-avatar">
                <img [src]="leaderboard.topUsers[1].avatar || '/assets/default-avatar.png'" alt="2nd place">
                <div class="podium-rank">2</div>
              </div>
              <div class="podium-name">{{ leaderboard.topUsers[1].name }}</div>
              <div class="podium-score">{{ getLeaderboardScore(leaderboard.topUsers[1]) }}</div>
            </div>

            <div class="podium-item first">
              <div class="podium-avatar">
                <img [src]="leaderboard.topUsers[0].avatar || '/assets/default-avatar.png'" alt="1st place">
                <div class="podium-rank crown">👑</div>
              </div>
              <div class="podium-name">{{ leaderboard.topUsers[0].name }}</div>
              <div class="podium-score">{{ getLeaderboardScore(leaderboard.topUsers[0]) }}</div>
            </div>

            <div class="podium-item third">
              <div class="podium-avatar">
                <img [src]="leaderboard.topUsers[2].avatar || '/assets/default-avatar.png'" alt="3rd place">
                <div class="podium-rank">3</div>
              </div>
              <div class="podium-name">{{ leaderboard.topUsers[2].name }}</div>
              <div class="podium-score">{{ getLeaderboardScore(leaderboard.topUsers[2]) }}</div>
            </div>
          </div>

          <!-- Full Leaderboard -->
          <div class="leaderboard-list">
            <div
              class="leaderboard-entry"
              *ngFor="let user of leaderboard?.users || []; let i = index"
              [class.current-user]="user.id === currentUserId"
            >
              <div class="entry-rank">#{{ i + 4 }}</div>
              <div class="entry-avatar">
                <img [src]="user.avatar || '/assets/default-avatar.png'" alt="User avatar">
              </div>
              <div class="entry-info">
                <div class="entry-name">{{ user.name }}</div>
                <div class="entry-stats">
                  <span>Level {{ user.level }}</span>
                  <span>{{ user.currentStreak }} day streak</span>
                </div>
              </div>
              <div class="entry-score">{{ getLeaderboardScore(user) }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Rewards Tab -->
      <div class="tab-content" *ngIf="activeTab === 'rewards'">
        <div class="rewards-header">
          <div class="rewards-info">
            <h3>Reward Store</h3>
            <p>You have {{ gamification?.points || 0 }} points to spend</p>
          </div>
        </div>

        <div class="rewards-grid">
          <div
            class="reward-card glass-card"
            *ngFor="let reward of rewards"
            [class.unlocked]="reward.isUnlocked"
            [class.claimed]="isRewardClaimed(reward)"
          >
            <div class="reward-icon">{{ reward.icon }}</div>
            <div class="reward-content">
              <h4>{{ reward.name }}</h4>
              <p>{{ reward.description }}</p>
              <div class="reward-cost">{{ reward.cost }} points</div>
            </div>
            <div class="reward-actions">
              <button
                class="claim-reward-btn"
                [disabled]="!reward.isUnlocked || isRewardClaimed(reward) || (gamification?.points || 0) < reward.cost"
                (click)="claimReward(reward)"
              >
                {{ isRewardClaimed(reward) ? 'Claimed' : 'Claim' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .advanced-gamification-wrapper {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    /* Animations */
    @keyframes levelUp {
      0% { transform: scale(0.8); opacity: 0; }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes achievementUnlock {
      0% { transform: scale(0); opacity: 0; }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); opacity: 1; }
    }

    @keyframes particleFloat {
      0% { transform: translateY(0) rotate(0deg); opacity: 1; }
      100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
    }

    /* Overlay Modals */
    .level-up-overlay, .achievement-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(10px);
    }

    .level-up-modal, .achievement-modal {
      max-width: 500px;
      width: 90%;
      padding: 2rem;
      text-align: center;
      animation: levelUp 0.5s ease-out;
      position: relative;
      overflow: hidden;
    }

    .achievement-modal {
      animation: achievementUnlock 0.6s ease-out;
    }

    .level-up-icon, .achievement-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .level-up-content h2, .achievement-content h2 {
      color: #2c3e50;
      margin: 0 0 1rem 0;
      font-size: 2rem;
    }

    .new-level {
      font-size: 3rem;
      font-weight: 700;
      color: #667eea;
      margin-bottom: 1rem;
    }

    .points-gained {
      font-size: 1.5rem;
      color: #27ae60;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }

    .badges-earned {
      margin-top: 1.5rem;
    }

    .badges-earned h3 {
      color: #2c3e50;
      margin-bottom: 1rem;
    }

    .badge-list {
      display: flex;
      justify-content: center;
      gap: 1rem;
    }

    .badge-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .badge-icon {
      font-size: 2rem;
    }

    .badge-name {
      font-size: 0.9rem;
      color: #6c757d;
    }

    .achievement-name {
      font-size: 1.5rem;
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .achievement-description {
      color: #6c757d;
      margin-bottom: 1rem;
    }

    .achievement-reward {
      font-size: 1.2rem;
      color: #27ae60;
      font-weight: 600;
    }

    .particles {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    .particle {
      position: absolute;
      width: 10px;
      height: 10px;
      background: #667eea;
      border-radius: 50%;
      animation: particleFloat 2s ease-out infinite;
    }

    .particle:nth-child(1) { left: 10%; animation-delay: 0s; }
    .particle:nth-child(2) { left: 20%; animation-delay: 0.2s; }
    .particle:nth-child(3) { left: 30%; animation-delay: 0.4s; }
    .particle:nth-child(4) { left: 40%; animation-delay: 0.6s; }
    .particle:nth-child(5) { left: 50%; animation-delay: 0.8s; }
    .particle:nth-child(6) { left: 60%; animation-delay: 1s; }
    .particle:nth-child(7) { left: 70%; animation-delay: 1.2s; }
    .particle:nth-child(8) { left: 80%; animation-delay: 1.4s; }
    .particle:nth-child(9) { left: 90%; animation-delay: 1.6s; }
    .particle:nth-child(10) { left: 95%; animation-delay: 1.8s; }

    /* Header */
    .gamification-header {
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

    .quick-stats {
      display: flex;
      justify-content: center;
      gap: 2rem;
    }

    .stat-item {
      text-align: center;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #667eea;
    }

    .stat-label {
      color: #6c757d;
      font-size: 0.9rem;
      margin-top: 0.25rem;
    }

    /* Navigation */
    .navigation-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(15px);
      border-radius: 15px;
      padding: 0.5rem;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .tab-button {
      flex: 1;
      padding: 1rem;
      border: none;
      background: transparent;
      border-radius: 10px;
      font-weight: 600;
      color: #6c757d;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
      position: relative;
    }

    .tab-button:hover, .tab-button.active {
      background: #667eea;
      color: white;
    }

    .tab-icon {
      font-size: 1.5rem;
    }

    .tab-badge {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: #e74c3c;
      color: white;
      border-radius: 10px;
      padding: 0.2rem 0.5rem;
      font-size: 0.7rem;
      font-weight: 700;
    }

    /* Tab Content */
    .tab-content {
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Level Progress */
    .level-progress-section {
      margin-bottom: 3rem;
    }

    .level-card {
      padding: 2rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .level-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .level-info h3 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 1.5rem;
    }

    .experience-info {
      color: #6c757d;
      font-size: 0.9rem;
    }

    .level-avatar {
      width: 80px;
      height: 80px;
    }

    .avatar-circle {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.5rem;
      font-weight: 700;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .progress-bar {
      height: 12px;
      background: rgba(0, 0, 0, 0.1);
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 6px;
      transition: width 0.5s ease;
    }

    .level-benefits {
      display: flex;
      gap: 1rem;
    }

    .benefit-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #6c757d;
      font-size: 0.9rem;
    }

    /* Daily Challenges */
    .daily-challenges-section {
      margin-bottom: 3rem;
    }

    .section-title {
      font-size: 1.8rem;
      font-weight: 700;
      color: #2c3e50;
      margin: 0 0 1.5rem 0;
    }

    .challenges-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .challenge-card {
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .challenge-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .challenge-card.completed {
      border-color: #27ae60;
      background: rgba(39, 174, 96, 0.05);
    }

    .challenge-card.claimed {
      opacity: 0.7;
    }

    .challenge-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .challenge-icon {
      font-size: 2rem;
    }

    .status-badge {
      padding: 0.4rem 0.8rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      background: #667eea;
      color: white;
    }

    .status-badge.claimed {
      background: #95a5a6;
    }

    .challenge-content h4 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 1.1rem;
    }

    .challenge-content p {
      margin: 0 0 1rem 0;
      color: #6c757d;
      font-size: 0.9rem;
    }

    .challenge-progress {
      margin-bottom: 1rem;
    }

    .progress-text {
      font-size: 0.8rem;
      color: #6c757d;
      margin-top: 0.5rem;
    }

    .challenge-reward {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .reward-points, .reward-xp {
      font-size: 0.9rem;
      font-weight: 600;
      color: #27ae60;
    }

    .claim-btn {
      width: 100%;
      padding: 0.8rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .claim-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .time-left {
      text-align: center;
      color: #6c757d;
      font-size: 0.9rem;
    }

    /* Weekly Quests */
    .weekly-quests {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .quest-card {
      padding: 2rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .quest-card.completed {
      border-color: #27ae60;
      background: rgba(39, 174, 96, 0.05);
    }

    .quest-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .quest-icon {
      font-size: 2rem;
    }

    .quest-title h4 {
      margin: 0 0 0.25rem 0;
      color: #2c3e50;
      font-size: 1.2rem;
    }

    .quest-expiry {
      color: #6c757d;
      font-size: 0.8rem;
    }

    .quest-description {
      color: #495057;
      margin-bottom: 1.5rem;
      line-height: 1.5;
    }

    .quest-requirements {
      margin-bottom: 1.5rem;
    }

    .requirement-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .requirement-icon {
      font-size: 1.2rem;
      width: 30px;
    }

    .requirement-text {
      flex: 1;
      color: #495057;
      font-size: 0.9rem;
    }

    .requirement-progress {
      width: 100px;
    }

    .quest-rewards {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .reward-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #27ae60;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .claim-btn.primary {
      background: linear-gradient(135deg, #27ae60, #2ecc71);
    }

    /* Achievements */
    .achievements-filters {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }

    .filter-btn {
      padding: 0.8rem 1.5rem;
      border: 2px solid rgba(102, 126, 234, 0.2);
      background: white;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .filter-btn:hover, .filter-btn.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
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
      gap: 1rem;
      transition: all 0.3s ease;
    }

    .achievement-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .achievement-card.completed {
      border-color: #27ae60;
      background: rgba(39, 174, 96, 0.05);
    }

    .achievement-card.locked {
      opacity: 0.6;
    }

    .achievement-icon {
      font-size: 2rem;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .achievement-content {
      flex: 1;
    }

    .achievement-content h4 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 1.1rem;
    }

    .achievement-content p {
      margin: 0 0 1rem 0;
      color: #6c757d;
      font-size: 0.9rem;
    }

    .achievement-reward {
      font-size: 0.9rem;
      color: #27ae60;
      font-weight: 600;
    }

    .achievement-category {
      display: flex;
      align-items: flex-start;
    }

    .category-badge {
      padding: 0.4rem;
      border-radius: 8px;
      font-size: 1.2rem;
    }

    /* Leaderboard */
    .leaderboard-types {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }

    .type-btn {
      padding: 0.8rem 1.5rem;
      border: 2px solid rgba(102, 126, 234, 0.2);
      background: white;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .type-btn:hover, .type-btn.active {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .podium {
      display: flex;
      justify-content: center;
      align-items: end;
      gap: 2rem;
      margin-bottom: 3rem;
      padding: 2rem;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(15px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .podium-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .podium-item.first {
      order: 2;
    }

    .podium-item.second {
      order: 1;
    }

    .podium-item.third {
      order: 3;
    }

    .podium-avatar {
      position: relative;
      width: 80px;
      height: 80px;
    }

    .podium-avatar img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid;
    }

    .podium-item.first .podium-avatar img {
      border-color: #f39c12;
    }

    .podium-item.second .podium-avatar img {
      border-color: #95a5a6;
    }

    .podium-item.third .podium-avatar img {
      border-color: #e67e22;
    }

    .podium-rank {
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      border-radius: 50%;
      width: 25px;
      height: 25px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .podium-item.first .podium-rank {
      background: #f39c12;
      color: white;
    }

    .podium-name {
      font-weight: 600;
      color: #2c3e50;
      text-align: center;
    }

    .podium-score {
      font-size: 1.2rem;
      font-weight: 700;
      color: #667eea;
    }

    .leaderboard-list {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      overflow: hidden;
    }

    .leaderboard-entry {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      transition: background 0.3s ease;
    }

    .leaderboard-entry:hover, .leaderboard-entry.current-user {
      background: rgba(102, 126, 234, 0.05);
    }

    .entry-rank {
      font-weight: 700;
      color: #6c757d;
      width: 40px;
    }

    .entry-avatar img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .entry-info {
      flex: 1;
    }

    .entry-name {
      font-weight: 600;
      color: #2c3e50;
    }

    .entry-stats {
      display: flex;
      gap: 1rem;
      font-size: 0.8rem;
      color: #6c757d;
    }

    .entry-score {
      font-weight: 700;
      color: #667eea;
    }

    /* Rewards */
    .rewards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .reward-card {
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      display: flex;
      gap: 1rem;
      transition: all 0.3s ease;
    }

    .reward-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }

    .reward-card.unlocked {
      border-color: #27ae60;
      background: rgba(39, 174, 96, 0.05);
    }

    .reward-icon {
      font-size: 2rem;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .reward-content {
      flex: 1;
    }

    .reward-content h4 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 1.1rem;
    }

    .reward-content p {
      margin: 0 0 1rem 0;
      color: #6c757d;
      font-size: 0.9rem;
    }

    .reward-cost {
      font-size: 1rem;
      font-weight: 700;
      color: #667eea;
    }

    .claim-reward-btn {
      padding: 0.8rem 1.5rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .claim-reward-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .claim-reward-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    /* Activity Feed */
    .activity-feed {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(20px);
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      overflow: hidden;
    }

    .activity-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    .activity-item:last-child {
      border-bottom: none;
    }

    .activity-icon {
      font-size: 1.5rem;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(102, 126, 234, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .activity-content {
      flex: 1;
    }

    .activity-text {
      color: #2c3e50;
      font-size: 0.9rem;
    }

    .activity-time {
      color: #6c757d;
      font-size: 0.8rem;
      margin-top: 0.25rem;
    }

    .activity-reward {
      font-weight: 700;
      color: #27ae60;
      font-size: 0.9rem;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .advanced-gamification-wrapper {
        padding: 1rem;
      }

      .quick-stats {
        flex-direction: column;
        gap: 1rem;
      }

      .navigation-tabs {
        flex-direction: column;
      }

      .tab-button {
        flex-direction: row;
        justify-content: flex-start;
      }

      .challenges-grid {
        grid-template-columns: 1fr;
      }

      .achievements-grid {
        grid-template-columns: 1fr;
      }

      .rewards-grid {
        grid-template-columns: 1fr;
      }

      .podium {
        flex-direction: column;
        align-items: center;
        gap: 1rem;
      }

      .podium-item {
        flex-direction: row;
        width: 100%;
        justify-content: space-between;
      }

      .weekly-quests {
        gap: 1rem;
      }

      .quest-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }

      .requirement-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
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
export class AdvancedGamificationComponent implements OnInit, OnDestroy {
  gamification: UserGamification | null = null;
  leaderboard: Leaderboard | null = null;
  achievements: Achievement[] = [];
  badges: Badge[] = [];
  rewards: Reward[] = [];

  activeTab: 'dashboard' | 'challenges' | 'achievements' | 'leaderboard' | 'rewards' = 'dashboard';
  leaderboardType: 'points' | 'level' | 'streak' = 'points';
  achievementFilter: 'all' | 'completed' | 'in-progress' = 'all';
  currentUserId = 'current-user'; // Would come from auth service

  dailyChallenges: DailyChallenge[] = [];
  weeklyQuests: WeeklyQuest[] = [];
  recentActivities: any[] = [];

  levelUpAnimation: LevelUpAnimation = { show: false, newLevel: 0, pointsGained: 0, badgesEarned: [] };
  achievementAnimation: AchievementUnlockAnimation = { show: false, achievement: {} as Achievement, particles: false };

  unclaimedChallengesCount = 0;
  unclaimedRewardsCount = 0;

  private subscriptions: Subscription[] = [];

  constructor(
    private gamificationService: GamificationService,
    private notificationService: NotificationApiService
  ) {}

  ngOnInit(): void {
    this.loadData();
    this.initializeChallenges();
    this.startRealTimeUpdates();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadData(): void {
    this.subscriptions.push(
      combineLatest([
        this.gamificationService.gamification$,
        this.gamificationService.getAchievements(),
        this.gamificationService.getRewards()
      ]).subscribe(([profile, achievementsData, rewards]) => {
        this.gamification = profile;
        this.achievements = achievementsData.achievements;
        this.badges = achievementsData.badges;
        this.rewards = rewards;
        this.updateCounts();
      })
    );

    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.gamificationService.getLeaderboard(this.leaderboardType).subscribe(leaderboard => {
      this.leaderboard = leaderboard;
    });
  }

  initializeChallenges(): void {
    // Mock daily challenges - in real app, this would come from backend
    this.dailyChallenges = [
      {
        id: 'complete-3-tasks',
        title: 'Task Master',
        description: 'Complete 3 tasks today',
        type: 'tasks_completed',
        target: 3,
        current: 1,
        reward: { points: 50, experience: 25 },
        timeLeft: 18, // hours
        isCompleted: false,
        isClaimed: false
      },
      {
        id: 'focus-2-hours',
        title: 'Deep Focus',
        description: 'Spend 2 hours in focused work',
        type: 'focus_time',
        target: 120, // minutes
        current: 45,
        reward: { points: 75, experience: 40 },
        timeLeft: 16,
        isCompleted: false,
        isClaimed: false
      },
      {
        id: 'maintain-streak',
        title: 'Consistency King',
        description: 'Maintain your current streak',
        type: 'streak_maintenance',
        target: 1,
        current: 1,
        reward: { points: 25, experience: 15 },
        timeLeft: 20,
        isCompleted: true,
        isClaimed: false
      }
    ];

    // Mock weekly quests
    this.weeklyQuests = [
      {
        id: 'productivity-master',
        title: 'Productivity Master',
        description: 'Show exceptional productivity this week',
        type: 'productivity_master',
        requirements: {
          tasks_completed: 20,
          focus_hours: 25
        },
        progress: {
          tasks_completed: 12,
          focus_hours: 18
        },
        reward: { points: 500, experience: 200, title: 'Productivity Master' },
        isCompleted: false,
        isClaimed: false,
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
      }
    ];

    // Mock recent activities
    this.recentActivities = [
      { icon: '✅', text: 'Completed task "Review project proposal"', timestamp: Date.now() - 1000 * 60 * 30, points: 10 },
      { icon: '🔥', text: 'Maintained 5-day streak', timestamp: Date.now() - 1000 * 60 * 60 * 2, points: 25 },
      { icon: '🏆', text: 'Unlocked achievement "Task Master"', timestamp: Date.now() - 1000 * 60 * 60 * 6, points: 50 },
      { icon: '⭐', text: 'Reached level 5', timestamp: Date.now() - 1000 * 60 * 60 * 24, points: 100 }
    ];
  }

  startRealTimeUpdates(): void {
    // Update challenges every minute
    this.subscriptions.push(
      interval(60000).subscribe(() => {
        this.updateChallenges();
      })
    );
  }

  updateChallenges(): void {
    // Mock challenge updates - in real app, this would come from backend
    this.dailyChallenges.forEach(challenge => {
      if (!challenge.isCompleted) {
        challenge.timeLeft = Math.max(0, challenge.timeLeft - 1/60); // Decrease by 1 minute
        if (challenge.timeLeft <= 0) {
          challenge.timeLeft = 24; // Reset for next day
          challenge.current = 0;
        }
      }
    });
  }

  updateCounts(): void {
    this.unclaimedChallengesCount = this.dailyChallenges.filter(c => c.isCompleted && !c.isClaimed).length +
                                   this.weeklyQuests.filter(q => q.isCompleted && !q.isClaimed).length;
    this.unclaimedRewardsCount = this.rewards.filter(r => r.isUnlocked && !this.isRewardClaimed(r)).length;
  }

  setActiveTab(tab: 'dashboard' | 'challenges' | 'achievements' | 'leaderboard' | 'rewards'): void {
    this.activeTab = tab;
    if (tab === 'leaderboard') {
      this.loadLeaderboard();
    }
  }

  setLeaderboardType(type: 'points' | 'level' | 'streak'): void {
    this.leaderboardType = type;
    this.loadLeaderboard();
  }

  setAchievementFilter(filter: 'all' | 'completed' | 'in-progress'): void {
    this.achievementFilter = filter;
  }

  claimDailyChallenge(challenge: DailyChallenge): void {
    challenge.isClaimed = true;
    this.showPointsAnimation(challenge.reward.points);

    // Update gamification stats
    if (this.gamification) {
      this.gamification.points += challenge.reward.points;
      this.gamification.experience += challenge.reward.experience;
    }

    this.updateCounts();
  }

  claimWeeklyQuest(quest: WeeklyQuest): void {
    quest.isClaimed = true;
    this.showPointsAnimation(quest.reward.points);

    // Update gamification stats
    if (this.gamification) {
      this.gamification.points += quest.reward.points;
      this.gamification.experience += quest.reward.experience;
    }

    this.updateCounts();
  }

  claimReward(reward: Reward): void {
    this.gamificationService.claimReward(reward.id).subscribe(
      response => {
        console.log('Reward claimed:', response);
        this.showRewardClaimedAnimation(reward);
        this.updateCounts();
      },
      error => {
        console.error('Error claiming reward:', error);
      }
    );
  }

  showPointsAnimation(points: number): void {
    // Mock animation - in real app, this would trigger a points animation
    console.log(`+${points} points!`);
  }

  showRewardClaimedAnimation(reward: Reward): void {
    // Mock animation
    console.log(`Reward claimed: ${reward.name}`);
  }

  showLevelUp(newLevel: number, pointsGained: number, badgesEarned: Badge[] = []): void {
    this.levelUpAnimation = {
      show: true,
      newLevel,
      pointsGained,
      badgesEarned
    };
  }

  dismissLevelUp(): void {
    this.levelUpAnimation.show = false;
  }

  showAchievementUnlock(achievement: Achievement): void {
    this.achievementAnimation = {
      show: true,
      achievement,
      particles: true
    };
  }

  dismissAchievement(): void {
    this.achievementAnimation.show = false;
  }

  // Computed properties
  get completedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.isCompleted);
  }

  get inProgressAchievements(): Achievement[] {
    return this.achievements.filter(a => !a.isCompleted && a.isUnlocked);
  }

  get filteredAchievements(): Achievement[] {
    switch (this.achievementFilter) {
      case 'completed':
        return this.completedAchievements;
      case 'in-progress':
        return this.inProgressAchievements;
      default:
        return this.achievements;
    }
  }

  // Utility methods
  getLevelProgress(): { current: number; next: number; percentage: number } {
    return this.gamificationService.getLevelProgress();
  }

  getStreakStatus(): { current: number; longest: number; isActive: boolean } {
    return this.gamificationService.getStreakStatus();
  }

  getLevelColor(): string {
    const level = this.gamification?.level || 1;
    const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7'];
    return colors[(level - 1) % colors.length];
  }

  getNextLevelBenefits(): string {
    const level = this.gamification?.level || 1;
    const benefits = [
      'Unlock new achievements',
      'Higher point multipliers',
      'Exclusive badges',
      'Special rewards',
      'Advanced challenges'
    ];
    return benefits[(level - 1) % benefits.length];
  }

  getChallengeIcon(type: string): string {
    switch (type) {
      case 'tasks_completed': return '✅';
      case 'focus_time': return '⏰';
      case 'streak_maintenance': return '🔥';
      case 'category_focus': return '📂';
      default: return '🎯';
    }
  }

  getQuestIcon(type: string): string {
    switch (type) {
      case 'productivity_master': return '⚡';
      case 'team_player': return '👥';
      case 'consistency_king': return '👑';
      case 'quality_focus': return '✨';
      default: return '🏆';
    }
  }

  getQuestRequirements(quest: WeeklyQuest): any[] {
    const requirements = [];
    if (quest.requirements.tasks_completed) {
      requirements.push({
        key: 'tasks_completed',
        label: `Complete ${quest.requirements.tasks_completed} tasks`,
        current: quest.progress.tasks_completed || 0,
        target: quest.requirements.tasks_completed
      });
    }
    if (quest.requirements.focus_hours) {
      requirements.push({
        key: 'focus_hours',
        label: `Focus for ${quest.requirements.focus_hours} hours`,
        current: quest.progress.focus_hours || 0,
        target: quest.requirements.focus_hours
      });
    }
    return requirements;
  }

  getAchievementProgress(achievement: Achievement): number {
    // Mock progress calculation - in real app, this would be stored in achievement data
    return Math.floor(Math.random() * 100);
  }

  getAchievementProgressText(achievement: Achievement): string {
    const progress = this.getAchievementProgress(achievement);
    return `${progress}% complete`;
  }

  getBadgeRarityColor(rarity: string): string {
    return this.gamificationService.getBadgeRarityColor(rarity);
  }

  getAchievementCategoryIcon(category: string): string {
    return this.gamificationService.getAchievementCategoryIcon(category);
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'getting_started': '#667eea',
      'productivity': '#27ae60',
      'consistency': '#e67e22',
      'progression': '#9b59b6',
      'social': '#3498db',
      'quality': '#e74c3c'
    };
    return colors[category] || '#95a5a6';
  }

  getLeaderboardScore(user: any): number {
    switch (this.leaderboardType) {
      case 'points': return user.points || 0;
      case 'level': return user.level || 1;
      case 'streak': return user.currentStreak || 0;
      default: return 0;
    }
  }

  isRewardClaimed(reward: Reward): boolean {
    if (!this.gamification?.rewards) return false;
    return this.gamification.rewards.some(r => r.id === reward.id);
  }

  formatTimeLeft(hours: number): string {
    if (hours < 1) {
      return `${Math.floor(hours * 60)}m left`;
    }
    return `${Math.floor(hours)}h left`;
  }

  formatExpiryTime(date: Date): string {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `${days}d ${hours}h`;
    }
    return `${hours}h`;
  }

  getRequirementIcon(type: string): string {
    switch (type) {
      case 'tasks_completed': return '✅';
      case 'focus_hours': return '⏰';
      case 'streak_days': return '🔥';
      default: return '🎯';
    }
  }

  formatActivityTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  }
}