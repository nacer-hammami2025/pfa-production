const express = require('express');
const router = express.Router();
const TimeEntry = require('../models/TimeEntry');
const ProductivityStats = require('../models/ProductivityStats');
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// Start time tracking for a task
router.post('/start/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Check if task exists and belongs to user
    const task = await Task.findOne({ _id: taskId, owner: userId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user already has an active time entry
    const activeEntry = await TimeEntry.findOne({
      userId,
      isActive: true
    });

    if (activeEntry) {
      return res.status(400).json({
        message: 'You already have an active time tracking session',
        activeEntry: activeEntry._id
      });
    }

    // Create new time entry
    const timeEntry = new TimeEntry({
      userId,
      taskId,
      startTime: new Date(),
      isActive: true,
      description: req.body.description || '',
      tags: req.body.tags || []
    });

    await timeEntry.save();

    // Update task to indicate it's being tracked
    await Task.findByIdAndUpdate(taskId, {
      isTracking: true,
      lastTrackedAt: new Date()
    });

    res.json({
      message: 'Time tracking started',
      timeEntry: {
        id: timeEntry._id,
        startTime: timeEntry.startTime,
        taskId: timeEntry.taskId
      }
    });
  } catch (error) {
    console.error('Error starting time tracking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Stop time tracking
router.post('/stop/:entryId', auth, async (req, res) => {
  try {
    const { entryId } = req.params;
    const userId = req.user.id;

    const timeEntry = await TimeEntry.findOne({
      _id: entryId,
      userId,
      isActive: true
    });

    if (!timeEntry) {
      return res.status(404).json({ message: 'Active time entry not found' });
    }

    // Stop the time entry
    timeEntry.endTime = new Date();
    timeEntry.isActive = false;
    await timeEntry.save();

    // Update task
    await Task.findByIdAndUpdate(timeEntry.taskId, {
      isTracking: false,
      $inc: { actualHours: timeEntry.duration / 60 } // Convert minutes to hours
    });

    // Update productivity stats
    await updateProductivityStats(userId, timeEntry.startTime);

    res.json({
      message: 'Time tracking stopped',
      timeEntry: {
        id: timeEntry._id,
        duration: timeEntry.duration,
        startTime: timeEntry.startTime,
        endTime: timeEntry.endTime
      }
    });
  } catch (error) {
    console.error('Error stopping time tracking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active time entry for user
router.get('/active', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const activeEntry = await TimeEntry.findOne({
      userId,
      isActive: true
    }).populate('taskId', 'title');

    if (!activeEntry) {
      return res.json({ activeEntry: null });
    }

    res.json({
      activeEntry: {
        id: activeEntry._id,
        taskId: activeEntry.taskId._id,
        taskTitle: activeEntry.taskId.title,
        startTime: activeEntry.startTime,
        description: activeEntry.description
      }
    });
  } catch (error) {
    console.error('Error getting active entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get time entries for a specific period
router.get('/entries', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, taskId } = req.query;

    let query = { userId };

    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (taskId) {
      query.taskId = taskId;
    }

    const entries = await TimeEntry.find(query)
      .populate('taskId', 'title category')
      .sort({ startTime: -1 })
      .limit(100);

    res.json({ entries });
  } catch (error) {
    console.error('Error getting time entries:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get productivity statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { date, period = 'day' } = req.query;

    let startDate, endDate;

    if (date) {
      startDate = new Date(date);
    } else {
      startDate = new Date();
    }

    // Calculate date range based on period
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - startDate.getDay());
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        break;
      case 'month':
        startDate.setDate(1);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
        break;
      default: // day
        endDate = new Date(startDate);
        endDate.setHours(23, 59, 59, 999);
        startDate.setHours(0, 0, 0, 0);
    }

    // Get time entries for the period
    const entries = await TimeEntry.find({
      userId,
      startTime: { $gte: startDate, $lte: endDate }
    });

    // Calculate statistics
    const stats = {
      totalTimeTracked: entries.reduce((sum, entry) => sum + (entry.duration || 0), 0),
      totalSessions: entries.length,
      averageSessionLength: entries.length > 0 ?
        entries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / entries.length : 0,
      productiveTime: entries.reduce((sum, entry) => sum + (entry.productivity ? entry.duration * (entry.productivity / 100) : entry.duration), 0),
      date: startDate.toISOString().split('T')[0],
      period
    };

    res.json({ stats });
  } catch (error) {
    console.error('Error getting productivity stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Manual time entry creation
router.post('/manual', auth, async (req, res) => {
  try {
    const { taskId, startTime, endTime, description, tags } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!taskId || !startTime || !endTime) {
      return res.status(400).json({ message: 'Task ID, start time, and end time are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Check if task exists and belongs to user
    const task = await Task.findOne({ _id: taskId, owner: userId });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Create manual time entry
    const timeEntry = new TimeEntry({
      userId,
      taskId,
      startTime: start,
      endTime: end,
      isManual: true,
      description: description || '',
      tags: tags || []
    });

    await timeEntry.save();

    // Update task actual hours
    await Task.findByIdAndUpdate(taskId, {
      $inc: { actualHours: timeEntry.duration / 60 }
    });

    res.json({
      message: 'Manual time entry created',
      timeEntry: {
        id: timeEntry._id,
        duration: timeEntry.duration,
        startTime: timeEntry.startTime,
        endTime: timeEntry.endTime
      }
    });
  } catch (error) {
    console.error('Error creating manual time entry:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to update productivity stats
async function updateProductivityStats(userId, date) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all entries for the day
    const entries = await TimeEntry.find({
      userId,
      startTime: { $gte: startOfDay, $lte: endOfDay }
    });

    // Calculate stats
    const totalTimeTracked = entries.reduce((sum, entry) => sum + (entry.duration || 0), 0);
    const totalSessions = entries.length;
    const averageSessionLength = totalSessions > 0 ? totalTimeTracked / totalSessions : 0;

    // Simple productivity calculation (can be enhanced with AI)
    const productiveTime = entries.reduce((sum, entry) => {
      // Consider sessions > 25 minutes as potentially productive
      return sum + (entry.duration > 25 ? entry.duration : entry.duration * 0.7);
    }, 0);

    const overallProductivity = totalTimeTracked > 0 ?
      Math.min(100, (productiveTime / totalTimeTracked) * 100) : 0;

    // Update or create stats
    await ProductivityStats.findOneAndUpdate(
      { userId, date: startOfDay },
      {
        totalTimeTracked,
        activeTime: totalTimeTracked,
        productiveTime,
        overallProductivity: Math.round(overallProductivity),
        averageSessionLength: Math.round(averageSessionLength),
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error('Error updating productivity stats:', error);
  }
}

module.exports = router;