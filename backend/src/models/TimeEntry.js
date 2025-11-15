const mongoose = require('mongoose');

const TimeEntrySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // in minutes
  description: { type: String },
  isManual: { type: Boolean, default: false }, // true if manually entered, false if auto-tracked
  isActive: { type: Boolean, default: false }, // true if currently tracking
  tags: [{ type: String }],
  productivity: { type: Number, min: 0, max: 100 }, // AI-calculated productivity score
  interruptions: { type: Number, default: 0 }, // number of interruptions during session
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for efficient queries
TimeEntrySchema.index({ userId: 1, startTime: -1 });
TimeEntrySchema.index({ taskId: 1, startTime: -1 });
TimeEntrySchema.index({ userId: 1, taskId: 1 });

// Pre-save middleware to calculate duration
TimeEntrySchema.pre('save', function(next) {
  if (this.endTime && this.startTime) {
    this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60)); // Convert to minutes
  }
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('TimeEntry', TimeEntrySchema);