const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const User = require('../models/User');

// AI-powered task prioritization
router.post('/prioritize', auth, async (req, res) => {
  try {
    const { taskIds } = req.body;

    // Get tasks with user context
    const tasks = await Task.find({
      _id: { $in: taskIds },
      owner: req.user.id
    });

    const prioritizedTasks = await Promise.all(
      tasks.map(async (task) => {
        const priority = await calculateTaskPriority(task, req.user.id);
        return {
          taskId: task._id,
          priority: priority.level,
          score: priority.score,
          factors: priority.factors
        };
      })
    );

    // Sort by priority score
    prioritizedTasks.sort((a, b) => b.score - a.score);

    res.json(prioritizedTasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Time estimation for tasks
router.post('/estimate/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.taskId,
      owner: req.user.id
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const estimation = await estimateTaskTime(task, req.user.id);

    res.json({
      taskId: task._id,
      estimatedHours: estimation.hours,
      confidence: estimation.confidence,
      factors: estimation.factors,
      breakdown: estimation.breakdown
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate optimal daily schedule
router.post('/schedule', auth, async (req, res) => {
  try {
    const { date, preferences } = req.body;

    // Get user's tasks for the date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const tasks = await Task.find({
      owner: req.user.id,
      $or: [
        { dueDate: { $gte: startOfDay, $lte: endOfDay } },
        { createdAt: { $gte: startOfDay, $lte: endOfDay } }
      ],
      completed: false
    });

    const schedule = await generateOptimalSchedule(tasks, date, preferences || {});

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get smart suggestions
router.get('/suggestions', auth, async (req, res) => {
  try {
    const suggestions = await generateSmartSuggestions(req.user.id);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Apply suggestion
router.post('/suggestions/:suggestionId/apply', auth, async (req, res) => {
  try {
    // Mark suggestion as applied
    // This would typically update a suggestions collection
    res.json({ message: 'Suggestion applied successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dismiss suggestion
router.post('/suggestions/:suggestionId/dismiss', auth, async (req, res) => {
  try {
    // Mark suggestion as dismissed
    res.json({ message: 'Suggestion dismissed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper functions for AI calculations
async function calculateTaskPriority(task, userId) {
  let score = 50; // Base score
  const factors = [];

  // Deadline factor
  if (task.dueDate) {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));

    let deadlineScore = 0;
    if (daysUntilDue < 0) {
      deadlineScore = 100; // Overdue
    } else if (daysUntilDue === 0) {
      deadlineScore = 90; // Due today
    } else if (daysUntilDue <= 1) {
      deadlineScore = 80; // Due tomorrow
    } else if (daysUntilDue <= 3) {
      deadlineScore = 70; // Due in 3 days
    } else if (daysUntilDue <= 7) {
      deadlineScore = 60; // Due this week
    }

    factors.push({
      name: 'deadline',
      weight: 0.4,
      value: deadlineScore / 100,
      impact: 'positive'
    });
    score += (deadlineScore - 50) * 0.4;
  }

  // Priority factor
  const priorityWeights = { low: 0, medium: 25, high: 50, urgent: 75 };
  const priorityScore = priorityWeights[task.priority] || 0;
  factors.push({
    name: 'urgency',
    weight: 0.3,
    value: priorityScore / 100,
    impact: 'positive'
  });
  score += (priorityScore - 25) * 0.3;

  // Complexity factor (based on description length and tags)
  const complexityScore = Math.min(task.description ? task.description.length / 10 : 0, 100);
  factors.push({
    name: 'complexity',
    weight: 0.2,
    value: complexityScore / 100,
    impact: 'positive'
  });
  score += (complexityScore - 50) * 0.2;

  // Dependencies factor (simplified - would check for dependent tasks)
  const dependencyScore = 0; // Placeholder
  factors.push({
    name: 'dependencies',
    weight: 0.1,
    value: dependencyScore / 100,
    impact: 'positive'
  });
  score += (dependencyScore - 50) * 0.1;

  // Normalize score
  score = Math.max(0, Math.min(100, score));

  // Determine priority level
  let level = 'low';
  if (score >= 75) level = 'urgent';
  else if (score >= 60) level = 'high';
  else if (score >= 40) level = 'medium';

  return {
    level,
    score: Math.round(score),
    factors
  };
}

async function estimateTaskTime(task, userId) {
  // Get historical data for similar tasks
  const similarTasks = await Task.find({
    owner: userId,
    title: { $regex: task.title.split(' ').slice(0, 2).join(' '), $options: 'i' },
    completed: true,
    actualHours: { $exists: true }
  }).limit(10);

  let estimatedHours = 1; // Default 1 hour
  let confidence = 0.3; // Low confidence
  const factors = [];

  if (similarTasks.length > 0) {
    // Calculate average time from similar tasks
    const totalHours = similarTasks.reduce((sum, t) => sum + (t.actualHours || 1), 0);
    estimatedHours = totalHours / similarTasks.length;
    confidence = Math.min(0.8, similarTasks.length / 10); // Higher confidence with more data

    factors.push({
      name: 'similar_tasks',
      weight: 0.6,
      value: estimatedHours,
      impact: 'direct'
    });
  }

  // Adjust based on task complexity
  const descriptionLength = task.description ? task.description.length : 0;
  const complexityMultiplier = 1 + (descriptionLength / 1000); // More text = more complex
  estimatedHours *= complexityMultiplier;

  factors.push({
    name: 'task_complexity',
    weight: 0.3,
    value: complexityMultiplier,
    impact: 'increase'
  });

  // Adjust based on priority
  const priorityMultipliers = { low: 0.8, medium: 1, high: 1.2, urgent: 1.5 };
  const priorityMultiplier = priorityMultipliers[task.priority] || 1;
  estimatedHours *= priorityMultiplier;

  factors.push({
    name: 'urgency',
    weight: 0.1,
    value: priorityMultiplier,
    impact: 'increase'
  });

  return {
    hours: Math.round(estimatedHours * 10) / 10, // Round to 1 decimal
    confidence,
    factors,
    breakdown: {
      baseEstimate: estimatedHours / complexityMultiplier / priorityMultiplier,
      complexityAdjustment: complexityMultiplier,
      priorityAdjustment: priorityMultiplier
    }
  };
}

async function generateOptimalSchedule(tasks, date, preferences) {
  const schedule = {
    date,
    slots: [],
    totalWorkHours: 0,
    totalBreakHours: 0,
    recommendations: []
  };

  // Default work hours: 9 AM - 5 PM
  const workStart = preferences.workStartTime || '09:00';
  const workEnd = preferences.workEndTime || '17:00';
  const maxWorkHours = preferences.maxDailyWorkHours || 8;

  const [startHour, startMin] = workStart.split(':').map(Number);
  const [endHour, endMin] = workEnd.split(':').map(Number);

  const startTime = new Date(date);
  startTime.setHours(startHour, startMin, 0, 0);

  const endTime = new Date(date);
  endTime.setHours(endHour, endMin, 0, 0);

  // Prioritize tasks
  const prioritizedTasks = await Promise.all(
    tasks.map(async (task) => ({
      ...task.toObject(),
      priority: await calculateTaskPriority(task, task.owner)
    }))
  );

  prioritizedTasks.sort((a, b) => b.priority.score - a.priority.score);

  // Generate time slots
  let currentTime = new Date(startTime);
  let totalWorkTime = 0;

  while (currentTime < endTime && totalWorkTime < maxWorkHours * 60) { // Convert to minutes
    const slotEnd = new Date(currentTime);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30); // 30-minute slots

    if (slotEnd > endTime) break;

    // Find best task for this slot
    const availableTask = prioritizedTasks.find(task =>
      !task.scheduled && task.priority.score > 20
    );

    const slot = {
      startTime: new Date(currentTime),
      endTime: new Date(slotEnd),
      taskId: availableTask ? availableTask._id : null,
      type: availableTask ? 'work' : 'break',
      priority: availableTask ? availableTask.priority.score : 0
    };

    schedule.slots.push(slot);

    if (availableTask) {
      availableTask.scheduled = true;
      totalWorkTime += 30;
    }

    currentTime = slotEnd;
  }

  schedule.totalWorkHours = totalWorkTime / 60;

  return schedule;
}

async function generateSmartSuggestions(userId) {
  const suggestions = [];

  // Get overdue tasks
  const overdueTasks = await Task.find({
    owner: userId,
    dueDate: { $lt: new Date() },
    completed: false
  });

  if (overdueTasks.length > 0) {
    suggestions.push({
      id: 'overdue_' + Date.now(),
      type: 'prioritize',
      title: 'Tâches en retard',
      description: `Vous avez ${overdueTasks.length} tâche(s) en retard. Priorisez-les maintenant.`,
      confidence: 0.9,
      createdAt: new Date()
    });
  }

  // Check for work-life balance
  const todayTasks = await Task.find({
    owner: userId,
    createdAt: {
      $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      $lt: new Date(new Date().setHours(23, 59, 59, 999))
    }
  });

  if (todayTasks.length > 10) {
    suggestions.push({
      id: 'overload_' + Date.now(),
      type: 'break',
      title: 'Trop de tâches aujourd\'hui',
      description: 'Vous avez beaucoup de tâches aujourd\'hui. Pensez à prendre une pause.',
      confidence: 0.7,
      createdAt: new Date()
    });
  }

  return suggestions;
}

module.exports = router;