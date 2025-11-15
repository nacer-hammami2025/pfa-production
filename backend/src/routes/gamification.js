const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Task = require('../models/Task');

// Get user gamification profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('gamification');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize gamification if not exists
    if (!user.gamification) {
      user.gamification = initializeGamification(req.user.id);
      await user.save();
    }

    res.json(user.gamification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user stats and check for achievements
router.post('/update-stats', auth, async (req, res) => {
  try {
    const { action, metadata } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Initialize gamification if not exists
    if (!user.gamification) {
      user.gamification = initializeGamification(req.user.id);
    }

    const gamification = user.gamification;
    let pointsEarned = 0;
    let experienceEarned = 0;
    let events = [];

    // Process different actions
    switch (action) {
      case 'task_completed':
        pointsEarned = calculateTaskPoints(metadata);
        experienceEarned = calculateTaskExperience(metadata);
        gamification.stats.tasksCompleted += 1;

        // Update streak
        const today = new Date().toDateString();
        const lastActivity = gamification.lastActivityDate?.toDateString();

        if (lastActivity === today) {
          // Already active today
        } else if (lastActivity === new Date(Date.now() - 86400000).toDateString()) {
          // Consecutive day
          gamification.currentStreak += 1;
          if (gamification.currentStreak > gamification.longestStreak) {
            gamification.longestStreak = gamification.currentStreak;
          }
          pointsEarned += gamification.currentStreak * 10; // Streak bonus
        } else {
          // Streak broken
          gamification.currentStreak = 1;
        }

        gamification.lastActivityDate = new Date();
        break;

      case 'task_created':
        gamification.stats.tasksCreated += 1;
        pointsEarned = 5;
        experienceEarned = 2;
        break;

      case 'streak_maintained':
        pointsEarned = gamification.currentStreak * 5;
        experienceEarned = gamification.currentStreak * 2;
        break;

      case 'daily_login':
        pointsEarned = 10;
        experienceEarned = 5;
        break;
    }

    // Add points and experience
    gamification.totalPoints += pointsEarned;
    gamification.experience += experienceEarned;

    // Check for level up
    while (gamification.experience >= gamification.experienceToNext) {
      gamification.level += 1;
      gamification.experience -= gamification.experienceToNext;
      gamification.experienceToNext = calculateExperienceForLevel(gamification.level);

      events.push({
        type: 'level_up',
        points: 0,
        experience: 0,
        description: `Niveau ${gamification.level} atteint !`,
        metadata: { newLevel: gamification.level }
      });
    }

    // Check for achievements
    const newAchievements = await checkAchievements(gamification, user._id);
    for (const achievement of newAchievements) {
      gamification.achievements.push(achievement);
      events.push({
        type: 'achievement_unlocked',
        points: achievement.points,
        experience: achievement.experience,
        description: `Achievement débloqué: ${achievement.name}`,
        metadata: { achievement: achievement }
      });
    }

    // Check for badges
    const newBadges = await checkBadges(gamification, user._id);
    for (const badge of newBadges) {
      gamification.badges.push(badge);
      events.push({
        type: 'badge_unlocked',
        points: 50,
        experience: 25,
        description: `Badge débloqué: ${badge.name}`,
        metadata: { badge: badge }
      });
    }

    // Create gamification event
    if (pointsEarned > 0 || experienceEarned > 0) {
      events.push({
        type: action,
        points: pointsEarned,
        experience: experienceEarned,
        description: getEventDescription(action, metadata),
        metadata: metadata
      });
    }

    await user.save();

    res.json({
      gamification: user.gamification,
      events: events,
      pointsEarned,
      experienceEarned
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get leaderboard
router.get('/leaderboard/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    const { period } = req.query;

    const users = await User.find({})
      .select('username gamification')
      .sort(getLeaderboardSort(type));

    const leaderboard = {
      type,
      period: period || 'all_time',
      entries: users
        .filter(user => user.gamification)
        .map((user, index) => ({
          userId: user._id,
          username: user.username,
          score: getLeaderboardScore(user.gamification, type),
          rank: index + 1,
          level: user.gamification.level,
          badgesCount: user.gamification.badges.length,
          streak: user.gamification.currentStreak,
          change: 0 // Would need historical data to calculate
        }))
        .slice(0, 50), // Top 50
      lastUpdated: new Date()
    };

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user achievements and badges
router.get('/achievements', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('gamification');
    if (!user || !user.gamification) {
      return res.json({ achievements: [], badges: [] });
    }

    res.json({
      achievements: user.gamification.achievements,
      badges: user.gamification.badges
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get available rewards
router.get('/rewards', auth, async (req, res) => {
  try {
    const rewards = getAvailableRewards();
    res.json(rewards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Claim reward
router.post('/rewards/:rewardId/claim', auth, async (req, res) => {
  try {
    const { rewardId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user || !user.gamification) {
      return res.status(404).json({ message: 'User not found' });
    }

    const reward = getAvailableRewards().find(r => r.id === rewardId);
    if (!reward) {
      return res.status(404).json({ message: 'Reward not found' });
    }

    // Check if requirements are met
    const requirementsMet = checkRewardRequirements(user.gamification, reward);
    if (!requirementsMet) {
      return res.status(400).json({ message: 'Requirements not met' });
    }

    // Mark as unlocked
    reward.isUnlocked = true;
    reward.unlockedAt = new Date();

    // Add to user's rewards if not already there
    if (!user.gamification.rewards) {
      user.gamification.rewards = [];
    }

    const existingReward = user.gamification.rewards.find(r => r.id === rewardId);
    if (!existingReward) {
      user.gamification.rewards.push(reward);
    }

    await user.save();

    res.json({
      message: 'Reward claimed successfully',
      reward: reward
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper functions
function initializeGamification(userId) {
  return {
    userId,
    level: 1,
    experience: 0,
    experienceToNext: 100,
    totalPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: new Date(),
    badges: [],
    achievements: [],
    rewards: [],
    stats: {
      tasksCompleted: 0,
      tasksCreated: 0,
      totalFocusTime: 0,
      averageTaskCompletion: 0,
      bestStreak: 0,
      totalPointsEarned: 0,
      badgesEarned: 0,
      achievementsUnlocked: 0,
      levelReached: 1,
      joinDate: new Date()
    },
    updatedAt: new Date()
  };
}

function calculateTaskPoints(metadata) {
  let points = 10; // Base points

  // Bonus for priority
  if (metadata.priority === 'urgent') points += 15;
  else if (metadata.priority === 'high') points += 10;
  else if (metadata.priority === 'medium') points += 5;

  // Bonus for completion time
  if (metadata.timeSpent && metadata.estimatedTime) {
    const ratio = metadata.timeSpent / metadata.estimatedTime;
    if (ratio <= 1.1) points += 5; // Completed within 10% of estimate
    else if (ratio <= 1.5) points += 2; // Completed within 50% of estimate
  }

  return points;
}

function calculateTaskExperience(metadata) {
  let experience = 20; // Base experience

  // Bonus for difficulty
  if (metadata.complexity === 'high') experience += 15;
  else if (metadata.complexity === 'medium') experience += 10;

  return experience;
}

function calculateExperienceForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

async function checkAchievements(gamification, userId) {
  const newAchievements = [];
  const configs = getAchievementConfigs();

  for (const config of configs) {
    // Check if already unlocked
    const existing = gamification.achievements.find(a => a.id === config.id);
    if (existing) continue;

    // Check requirements
    const requirementsMet = config.requirements.every(req => {
      switch (req.type) {
        case 'tasks_completed':
          return gamification.stats.tasksCompleted >= req.target;
        case 'streak_days':
          return gamification.currentStreak >= req.target;
        case 'points_earned':
          return gamification.totalPoints >= req.target;
        case 'level_reached':
          return gamification.level >= req.target;
        default:
          return false;
      }
    });

    if (requirementsMet) {
      newAchievements.push({
        id: config.id,
        name: config.name,
        description: config.description,
        icon: config.icon,
        category: config.category,
        points: config.points,
        experience: config.experience,
        requirements: config.requirements,
        unlockedAt: new Date(),
        progress: 100,
        isCompleted: true
      });
    }
  }

  return newAchievements;
}

async function checkBadges(gamification, userId) {
  const newBadges = [];
  const configs = getBadgeConfigs();

  for (const config of configs) {
    // Check if already unlocked
    const existing = gamification.badges.find(b => b.id === config.id);
    if (existing) continue;

    // Check requirements
    const requirementsMet = config.requirements.every(req => {
      switch (req.type) {
        case 'tasks_completed':
          return gamification.stats.tasksCompleted >= req.target;
        case 'streak_days':
          return gamification.longestStreak >= req.target;
        case 'level_reached':
          return gamification.level >= req.target;
        default:
          return false;
      }
    });

    if (requirementsMet) {
      newBadges.push({
        id: config.id,
        name: config.name,
        description: config.description,
        icon: config.icon,
        category: config.category,
        rarity: config.rarity,
        unlockedAt: new Date()
      });
    }
  }

  return newBadges;
}

function getLeaderboardSort(type) {
  switch (type) {
    case 'level':
      return { 'gamification.level': -1, 'gamification.experience': -1 };
    case 'streak':
      return { 'gamification.longestStreak': -1 };
    case 'points':
    default:
      return { 'gamification.totalPoints': -1 };
  }
}

function getLeaderboardScore(gamification, type) {
  switch (type) {
    case 'level':
      return gamification.level * 1000 + gamification.experience;
    case 'streak':
      return gamification.longestStreak;
    case 'points':
    default:
      return gamification.totalPoints;
  }
}

function getEventDescription(action, metadata) {
  switch (action) {
    case 'task_completed':
      return `Tâche "${metadata.title}" terminée`;
    case 'task_created':
      return `Nouvelle tâche créée: "${metadata.title}"`;
    case 'streak_maintained':
      return `Série de ${metadata.days} jours maintenue`;
    case 'daily_login':
      return 'Connexion quotidienne';
    default:
      return 'Action réalisée';
  }
}

function getAchievementConfigs() {
  return [
    {
      id: 'first_task',
      name: 'Premier pas',
      description: 'Terminez votre première tâche',
      icon: '🎯',
      category: 'getting_started',
      points: 50,
      experience: 25,
      requirements: [{ type: 'tasks_completed', target: 1 }]
    },
    {
      id: 'task_master',
      name: 'Maître des tâches',
      description: 'Terminez 100 tâches',
      icon: '👑',
      category: 'productivity',
      points: 500,
      experience: 250,
      requirements: [{ type: 'tasks_completed', target: 100 }]
    },
    {
      id: 'streak_warrior',
      name: 'Guerrier de la série',
      description: 'Maintenez une série de 30 jours',
      icon: '🔥',
      category: 'consistency',
      points: 300,
      experience: 150,
      requirements: [{ type: 'streak_days', target: 30 }]
    },
    {
      id: 'level_10',
      name: 'Ascension',
      description: 'Atteignez le niveau 10',
      icon: '🚀',
      category: 'progression',
      points: 200,
      experience: 100,
      requirements: [{ type: 'level_reached', target: 10 }]
    }
  ];
}

function getBadgeConfigs() {
  return [
    {
      id: 'early_bird',
      name: 'Lève-tôt',
      description: 'Complétez une tâche avant 8h',
      icon: '🌅',
      category: 'time',
      rarity: 'common',
      requirements: [{ type: 'tasks_completed', target: 1 }]
    },
    {
      id: 'night_owl',
      name: 'Hibou nocturne',
      description: 'Complétez une tâche après 22h',
      icon: '🦉',
      category: 'time',
      rarity: 'rare',
      requirements: [{ type: 'tasks_completed', target: 1 }]
    },
    {
      id: 'perfectionist',
      name: 'Perfectionniste',
      description: 'Terminez 50 tâches à temps',
      icon: '✨',
      category: 'quality',
      rarity: 'epic',
      requirements: [{ type: 'tasks_completed', target: 50 }]
    }
  ];
}

function getAvailableRewards() {
  return [
    {
      id: 'golden_theme',
      name: 'Thème Doré',
      description: 'Débloquez le thème doré exclusif',
      type: 'theme',
      icon: '👑',
      rarity: 'legendary',
      requirements: [{ type: 'level_reached', target: 25 }],
      isUnlocked: false
    },
    {
      id: 'productivity_expert',
      name: 'Expert Productivité',
      description: 'Titre spécial pour les utilisateurs experts',
      type: 'title',
      icon: '🏆',
      rarity: 'epic',
      requirements: [{ type: 'tasks_completed', target: 500 }],
      isUnlocked: false
    }
  ];
}

function checkRewardRequirements(gamification, reward) {
  return reward.requirements.every(req => {
    switch (req.type) {
      case 'level_reached':
        return gamification.level >= req.target;
      case 'tasks_completed':
        return gamification.stats.tasksCompleted >= req.target;
      case 'points_earned':
        return gamification.totalPoints >= req.target;
      default:
        return false;
    }
  });
}

module.exports = router;