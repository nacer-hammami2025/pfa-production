const mongoose = require('mongoose');

const PersistentNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['success', 'error', 'warning', 'info'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['task', 'productivity', 'motivation', 'reminder', 'admin'],
    default: 'admin'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  action: {
    label: String,
    callback: String
  },
  persistent: {
    type: Boolean,
    default: true
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 jours
  }
});

// Index pour les performances
PersistentNotificationSchema.index({ user: 1, createdAt: -1 });
PersistentNotificationSchema.index({ user: 1, read: 1 });
PersistentNotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Méthode pour créer une notification d'administration
PersistentNotificationSchema.statics.createAdminNotification = function(userId, type, title, message, options = {}) {
  return this.create({
    user: userId,
    type,
    title,
    message,
    category: options.category || 'admin',
    priority: options.priority || 'medium',
    action: options.action,
    persistent: options.persistent !== false,
    read: false
  });
};

module.exports = mongoose.model('PersistentNotification', PersistentNotificationSchema);