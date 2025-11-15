const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  completed: { type: Boolean, default: false },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['work', 'personal', 'shopping', 'health', 'education', 'other'],
    default: 'other'
  },
  dueDate: { type: Date },
  tags: [{ type: String }],
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Time tracking fields
  estimatedHours: { type: Number, min: 0 }, // Estimated time in hours
  actualHours: { type: Number, min: 0, default: 0 }, // Actual time spent in hours
  timeEntries: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TimeEntry' }], // References to time entries
  isTracking: { type: Boolean, default: false }, // Currently being tracked
  lastTrackedAt: { type: Date }, // Last time tracking was active

  // Sub-tasks
  subtasks: [{
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],

  // Comments
  comments: [{
    text: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now }
  }],

  // Attachments
  attachments: [{
    filename: { type: String, required: true },
    filepath: { type: String }, // Chemin du fichier local
    url: { type: String }, // URL pour stockage cloud
    size: { type: Number },
    mimetype: { type: String },
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Project
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', TaskSchema);
