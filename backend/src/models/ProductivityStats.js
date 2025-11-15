const mongoose = require('mongoose');

const ProductivityStatsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true }, // Date for the stats (YYYY-MM-DD)

  // Time tracking metrics
  totalTimeTracked: { type: Number, default: 0 }, // Total minutes tracked
  activeTime: { type: Number, default: 0 }, // Time spent actively working
  breakTime: { type: Number, default: 0 }, // Time spent on breaks
  productiveTime: { type: Number, default: 0 }, // Time considered productive by AI

  // Task completion metrics
  tasksCompleted: { type: Number, default: 0 },
  tasksCreated: { type: Number, default: 0 },
  averageTaskCompletionTime: { type: Number, default: 0 }, // in minutes

  // Productivity scores
  overallProductivity: { type: Number, min: 0, max: 100, default: 0 },
  focusScore: { type: Number, min: 0, max: 100, default: 0 }, // Based on uninterrupted work sessions
  consistencyScore: { type: Number, min: 0, max: 100, default: 0 }, // Based on regular work patterns

  // Work patterns
  workStartTime: { type: String }, // Average start time (HH:mm)
  workEndTime: { type: String }, // Average end time (HH:mm)
  peakProductivityHour: { type: Number, min: 0, max: 23 }, // Hour of day with highest productivity

  // Interruptions and distractions
  totalInterruptions: { type: Number, default: 0 },
  averageSessionLength: { type: Number, default: 0 }, // Average work session length in minutes

  // Goals and achievements
  dailyGoalMinutes: { type: Number, default: 480 }, // 8 hours default
  goalAchievement: { type: Number, min: 0, max: 100, default: 0 }, // Percentage of goal achieved

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Compound indexes for efficient queries
ProductivityStatsSchema.index({ userId: 1, date: -1 });
ProductivityStatsSchema.index({ userId: 1, date: -1, overallProductivity: -1 });

// Pre-save middleware
ProductivityStatsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.dailyGoalMinutes > 0) {
    this.goalAchievement = Math.min(100, (this.totalTimeTracked / this.dailyGoalMinutes) * 100);
  }
  next();
});

module.exports = mongoose.model('ProductivityStats', ProductivityStatsSchema);