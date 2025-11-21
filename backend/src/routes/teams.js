const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Team = require('../models/Team');

// Create a new team
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const team = new Team({
      name,
      description,
      owner: req.user.id,
      members: [{ user: req.user.id, role: 'owner' }]
    });
    await team.save();
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all teams for the current user
router.get('/', auth, async (req, res) => {
  try {
    const teams = await Team.find({
      $or: [
        { owner: req.user.id },
        { 'members.user': req.user.id }
      ]
    }).populate('members.user', 'username email');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific team
router.get('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members.user', 'username email')
      .populate('tasks.assignedTo', 'username email')
      .populate('tasks.comments.user', 'username email');
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a team
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a team
router.delete('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }
    res.json({ message: 'Team deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a member to a team
router.post('/:id/members', auth, async (req, res) => {
  try {
    const { userId, role } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check if user is already a member
    const existingMember = team.members.find(member => member.user.toString() === userId);
    if (existingMember) {
      return res.status(400).json({ message: 'User is already a member of this team' });
    }

    team.members.push({ user: userId, role: role || 'member' });
    await team.save();
    await team.populate('members.user', 'username email');
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove a member from a team
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    team.members = team.members.filter(member => member.user.toString() !== req.params.userId);
    await team.save();
    await team.populate('members.user', 'username email');
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a shared task
router.post('/:id/tasks', auth, async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const newTask = {
      title,
      description,
      assignedTo,
      priority: priority || 'medium',
      dueDate,
      status: 'pending',
      createdBy: req.user.id
    };

    team.tasks.push(newTask);
    await team.save();
    await team.populate('tasks.assignedTo', 'username email');
    await team.populate('tasks.createdBy', 'username email');
    res.status(201).json(team.tasks[team.tasks.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a shared task
router.put('/:id/tasks/:taskId', auth, async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate, status } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const task = team.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.title = title || task.title;
    task.description = description || task.description;
    task.assignedTo = assignedTo || task.assignedTo;
    task.priority = priority || task.priority;
    task.dueDate = dueDate || task.dueDate;
    task.status = status || task.status;

    await team.save();
    await team.populate('tasks.assignedTo', 'username email');
    await team.populate('tasks.createdBy', 'username email');
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a shared task
router.delete('/:id/tasks/:taskId', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    team.tasks.pull(req.params.taskId);
    await team.save();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a comment to a task
router.post('/:id/tasks/:taskId/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const task = team.tasks.id(req.params.taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const newComment = {
      content,
      user: req.user.id,
      createdAt: new Date()
    };

    task.comments.push(newComment);
    await team.save();
    await team.populate('tasks.comments.user', 'username email');
    res.status(201).json(task.comments[task.comments.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get team activity
router.get('/:id/activity', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get recent activity from tasks and comments
    const activity = [];

    team.tasks.forEach(task => {
      activity.push({
        type: 'task_created',
        taskId: task._id,
        title: task.title,
        user: task.createdBy,
        timestamp: task.createdAt
      });

      task.comments.forEach(comment => {
        activity.push({
          type: 'comment_added',
          taskId: task._id,
          taskTitle: task.title,
          commentId: comment._id,
          user: comment.user,
          timestamp: comment.createdAt
        });
      });
    });

    // Sort by timestamp descending
    activity.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(activity.slice(0, 50)); // Return last 50 activities
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;