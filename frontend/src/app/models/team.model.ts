export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  userId: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  isActive: boolean;
}

export interface SharedTask {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string; // userId
  assignedBy: string; // userId
  teamId: string;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  isEdited: boolean;
  mentions: string[]; // userIds mentioned in the comment
}

export interface TeamActivity {
  id: string;
  teamId: string;
  userId: string;
  userName: string;
  action: 'task_created' | 'task_updated' | 'task_completed' | 'task_assigned' | 'comment_added' | 'member_added' | 'member_removed';
  entityId: string; // taskId or memberId
  entityType: 'task' | 'member' | 'comment';
  description: string;
  metadata?: any;
  createdAt: Date;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  invitedBy: string;
  invitedUserEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  role: 'admin' | 'member';
  invitedAt: Date;
  expiresAt: Date;
  acceptedAt?: Date;
}

// Smart Scheduling Models
export interface TaskPriority {
  taskId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  score: number; // AI-calculated priority score (0-100)
  factors: PriorityFactor[];
  lastCalculated: Date;
}

export interface PriorityFactor {
  name: 'deadline' | 'dependencies' | 'user_history' | 'complexity' | 'urgency';
  weight: number; // 0-1
  value: number; // 0-1
  impact: 'positive' | 'negative';
}

export interface TimeEstimation {
  taskId: string;
  estimatedHours: number;
  confidence: number; // 0-1
  factors: EstimationFactor[];
  historicalData: HistoricalEstimate[];
  lastCalculated: Date;
}

export interface EstimationFactor {
  name: 'task_complexity' | 'user_experience' | 'similar_tasks' | 'time_of_day' | 'task_type';
  weight: number;
  value: number;
  impact: 'increase' | 'decrease';
}

export interface HistoricalEstimate {
  actualHours: number;
  estimatedHours: number;
  accuracy: number; // actual/estimated ratio
  completedAt: Date;
  taskType: string;
}

export interface ScheduleSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  taskId?: string;
  isAvailable: boolean;
  priority: number;
  type: 'work' | 'break' | 'meeting' | 'personal';
}

export interface DailySchedule {
  date: Date;
  userId: string;
  slots: ScheduleSlot[];
  totalWorkHours: number;
  totalBreakHours: number;
  productivity: number; // 0-100
  completedTasks: string[];
}

export interface SchedulingPreferences {
  userId: string;
  workStartTime: string; // HH:mm format
  workEndTime: string;
  preferredBreakDuration: number; // minutes
  maxDailyWorkHours: number;
  preferredTaskDuration: number; // minutes
  avoidTimes: TimeRange[];
  focusDays: string[]; // ['monday', 'tuesday', etc.]
  updatedAt: Date;
}

export interface TimeRange {
  start: string; // HH:mm
  end: string; // HH:mm
  reason?: string;
}

export interface SmartSuggestion {
  id: string;
  userId: string;
  type: 'reschedule' | 'prioritize' | 'break' | 'focus_time';
  title: string;
  description: string;
  taskId?: string;
  suggestedTime?: Date;
  confidence: number;
  createdAt: Date;
  appliedAt?: Date;
  dismissedAt?: Date;
}

// Gamification Models
export interface UserGamification {
  userId: string;
  level: number;
  experience: number;
  experienceToNext: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  badges: Badge[];
  achievements: Achievement[];
  rewards: Reward[];
  stats: GamificationStats;
  updatedAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  pointsReward: number;
  experienceReward: number;
  requirements: AchievementRequirement[];
  unlockedAt?: Date;
  progress: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface AchievementRequirement {
  type: 'tasks_completed' | 'streak_days' | 'points_earned' | 'badges_unlocked' | 'level_reached' | 'time_focused';
  target: number;
  current: number;
}

export interface GamificationStats {
  tasksCompleted: number;
  tasksCreated: number;
  totalFocusTime: number; // in minutes
  averageTaskCompletion: number; // in minutes
  bestStreak: number;
  totalPointsEarned: number;
  badgesEarned: number;
  achievementsUnlocked: number;
  levelReached: number;
  joinDate: Date;
}

export interface LeaderboardEntry {
  userId: string;
  id: string;
  username: string;
  name: string;
  avatar?: string;
  score: number;
  rank: number;
  level: number;
  badgesCount: number;
  streak: number;
  currentStreak: number;
  change: number; // position change from last period
}

export interface Leaderboard {
  type: 'weekly' | 'monthly' | 'all_time' | 'level' | 'streak';
  period: string; // e.g., "2025-W43" for weekly
  entries: LeaderboardEntry[];
  topUsers?: LeaderboardEntry[];
  users?: LeaderboardEntry[];
  lastUpdated: Date;
}

export interface GamificationEvent {
  id: string;
  userId: string;
  type: 'task_completed' | 'streak_maintained' | 'badge_unlocked' | 'level_up' | 'achievement_unlocked' | 'points_earned';
  points: number;
  experience: number;
  description: string;
  metadata: any;
  createdAt: Date;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: 'badge' | 'title' | 'theme' | 'feature_unlock' | 'bonus_points';
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  cost: number;
  requirements: AchievementRequirement[];
  isUnlocked: boolean;
  unlockedAt?: Date;
}

export interface LevelConfig {
  level: number;
  experienceRequired: number;
  title: string;
  color: string;
  perks: string[];
}

export interface GamificationConfig {
  pointsPerTask: number;
  pointsPerStreakDay: number;
  experiencePerTask: number;
  experiencePerLevelMultiplier: number;
  streakBonusMultiplier: number;
  maxStreakBonus: number;
  dailyLoginBonus: number;
  weeklyGoalsBonus: number;
  leaderboardResetSchedule: string;
  levelConfigs: LevelConfig[];
  badgeConfigs: BadgeConfig[];
  achievementConfigs: AchievementConfig[];
}

export interface BadgeConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: string;
  requirements: AchievementRequirement[];
}

export interface AchievementConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  experience: number;
  requirements: AchievementRequirement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  pointsReward: number;
  experienceReward: number;
  requirements: AchievementRequirement[];
  unlockedAt?: Date;
  progress: number;
  isCompleted: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt?: Date;
}

export interface UserGamification {
  userId: string;
  level: number;
  experience: number;
  experienceToNext: number;
  points: number;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  achievements: Achievement[];
  rewards: Reward[];
  stats: GamificationStats;
  lastActivity: Date;
  preferences: GamificationPreferences;
}

export interface GamificationPreferences {
  notifications: {
    levelUp: boolean;
    achievementUnlock: boolean;
    badgeUnlock: boolean;
    streakMilestone: boolean;
    leaderboardUpdate: boolean;
  };
  privacy: {
    showInLeaderboard: boolean;
    showAchievements: boolean;
    showStats: boolean;
  };
  goals: {
    dailyTaskGoal: number;
    weeklyFocusHours: number;
    monthlyAchievementGoal: number;
  };
}