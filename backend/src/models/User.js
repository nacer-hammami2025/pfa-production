const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  phone: { type: String, default: '' },
  bio: { type: String, default: '' },
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: { type: String, default: '' },
  mfaTempSecret: { type: String, default: '' },
  preferences: {
    theme: { type: String, enum: ['light', 'dark'], default: 'light' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      reminders: { type: Boolean, default: true },
      taskDue: { type: Boolean, default: true },
      teamActivity: { type: Boolean, default: true },
      achievements: { type: Boolean, default: true }
    },
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'en' },
    autoSave: { type: Boolean, default: true }
  },
  stats: {
    tasksCompleted: { type: Number, default: 0 },
    totalTasks: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 }
  },
  lastLogin: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  role: { type: String, enum: ['user', 'admin'], default: 'user' }
});

module.exports = mongoose.model('User', UserSchema);
