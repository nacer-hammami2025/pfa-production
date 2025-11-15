const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'task_due',
      'task_overdue',
      'task_assigned',
      'task_completed',
      'team_invitation',
      'team_activity',
      'achievement_unlocked',
      'reminder',
      'system_update',
      'deadline_approaching'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    taskId: mongoose.Schema.Types.ObjectId,
    teamId: mongoose.Schema.Types.ObjectId,
    achievementId: String,
    dueDate: Date,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    }
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  sent: {
    type: Boolean,
    default: false
  },
  sentAt: Date,
  scheduledFor: Date,
  channels: [{
    type: String,
    enum: ['in_app', 'email', 'push'],
    default: ['in_app']
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
});

// Index pour les performances
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, read: 1 });
NotificationSchema.index({ scheduledFor: 1, sent: 1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Méthodes statiques
NotificationSchema.statics.createTaskDueNotification = function(userId, taskId, taskTitle, dueDate) {
  return this.create({
    user: userId,
    type: 'task_due',
    title: 'Task Due Soon',
    message: `Your task "${taskTitle}" is due ${dueDate.toLocaleDateString()}`,
    data: { taskId, dueDate, priority: 'high' },
    channels: ['in_app', 'email', 'push'],
    scheduledFor: new Date(dueDate.getTime() - 24 * 60 * 60 * 1000) // 24h avant
  });
};

NotificationSchema.statics.createAchievementNotification = function(userId, achievementTitle, description) {
  return this.create({
    user: userId,
    type: 'achievement_unlocked',
    title: 'Achievement Unlocked! 🏆',
    message: `${achievementTitle}: ${description}`,
    data: { achievementId: achievementTitle, priority: 'medium' },
    channels: ['in_app', 'push']
  });
};

NotificationSchema.statics.createTeamActivityNotification = function(userId, teamName, activity, actorName) {
  return this.create({
    user: userId,
    type: 'team_activity',
    title: 'Team Activity',
    message: `${actorName} ${activity} in ${teamName}`,
    data: { teamId: teamName, priority: 'low' },
    channels: ['in_app']
  });
};

module.exports = mongoose.model('Notification', NotificationSchema);