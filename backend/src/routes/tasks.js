const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// GET /api/tasks - list user's tasks with optional filtering
router.get('/', auth, async (req, res) => {
  try {
    const { search, completed, priority, category } = req.query;
    let query = { owner: req.user.id };

    // Apply filters
    if (completed !== undefined) {
      query.completed = completed === 'true';
    }

    if (priority) {
      query.priority = priority;
    }

    if (category) {
      query.category = category;
    }

    let tasks = await Task.find(query).sort({ createdAt: -1 });

    // Apply search filter if provided
    if (search) {
      const searchTerm = search.toLowerCase();
      tasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description && task.description.toLowerCase().includes(searchTerm)) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }

    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// GET /api/tasks/stats - get task statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const tasks = await Task.find({ owner: req.user.id });

    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const priorityStats = {
      low: tasks.filter(task => task.priority === 'low').length,
      medium: tasks.filter(task => task.priority === 'medium').length,
      high: tasks.filter(task => task.priority === 'high').length,
      urgent: tasks.filter(task => task.priority === 'urgent').length
    };

    const categoryStats = {
      work: tasks.filter(task => task.category === 'work').length,
      personal: tasks.filter(task => task.category === 'personal').length,
      shopping: tasks.filter(task => task.category === 'shopping').length,
      health: tasks.filter(task => task.category === 'health').length,
      education: tasks.filter(task => task.category === 'education').length,
      other: tasks.filter(task => task.category === 'other').length
    };

    const overdue = tasks.filter(task => {
      return task.dueDate && new Date(task.dueDate) < new Date() && !task.completed;
    }).length;

    res.json({
      total,
      completed,
      pending: total - completed,
      overdue,
      byPriority: priorityStats,
      byCategory: categoryStats,
      completionRate
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// GET /api/tasks/project/:projectId - get tasks for a specific project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;

    // Verify user has access to this project
    const Project = require('../models/Project');
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check if user is owner or member of the project
    const hasAccess = project.owner.toString() === req.user.id ||
                     project.members.some(member => member.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({ msg: 'Access denied to this project' });
    }

    // Get tasks for this project
    const tasks = await Task.find({ project: projectId })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// POST /api/tasks - create
router.post('/', auth, async (req, res) => {
  try {
    console.log('📝 Backend: Requête POST /api/tasks reçue');
    console.log('👤 User ID:', req.user.id);
    console.log('📋 Données reçues:', req.body);

    const { title, description, priority, category, dueDate, tags, project } = req.body;

    const taskData = {
      title,
      description,
      priority: priority || 'medium',
      category: category || 'other',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags: tags || [],
      owner: req.user.id,
      project: project || undefined
    };

    console.log('💾 Données à sauvegarder:', taskData);

    const task = new Task(taskData);
    await task.save();

    // If task is associated with a project, add it to the project's tasks array
    if (project) {
      const Project = require('../models/Project');
      await Project.findByIdAndUpdate(project, {
        $push: { tasks: task._id }
      });
    }

    console.log('✅ Tâche sauvegardée avec succès:', task._id);
    res.json(task);
  } catch (err) {
    console.error('❌ Erreur lors de la création de tâche:', err.message);
    res.status(500).send('Server error');
  }
});

// PUT /api/tasks/:id - update
router.put('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    if (task.owner.toString() !== req.user.id) return res.status(403).json({ msg: 'Forbidden' });

    const { title, description, completed, priority, category, dueDate, tags } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (typeof completed === 'boolean') task.completed = completed;
    if (priority !== undefined) task.priority = priority;
    if (category !== undefined) task.category = category;
    if (dueDate !== undefined) task.dueDate = dueDate ? new Date(dueDate) : undefined;
    if (tags !== undefined) task.tags = tags;

    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// PATCH /api/tasks/:id/toggle - toggle completion status
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    if (task.owner.toString() !== req.user.id) return res.status(403).json({ msg: 'Forbidden' });

    task.completed = !task.completed;
    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// PATCH /api/tasks/:id/status - update task status for Kanban
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    if (task.owner.toString() !== req.user.id) return res.status(403).json({ msg: 'Forbidden' });

    const { status } = req.body;
    if (!['todo', 'in-progress', 'done'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status. Must be: todo, in-progress, or done' });
    }

    task.status = status;
    // Auto-update completed based on status
    task.completed = status === 'done';

    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// GET /api/tasks/export - export tasks as CSV
router.get('/export', auth, async (req, res) => {
  try {
    const { search, completed, priority, category } = req.query;
    let query = { owner: req.user.id };

    // Apply filters
    if (completed !== undefined) {
      query.completed = completed === 'true';
    }

    if (priority) {
      query.priority = priority;
    }

    if (category) {
      query.category = category;
    }

    let tasks = await Task.find(query).sort({ createdAt: -1 });

    // Apply search filter if provided
    if (search) {
      const searchTerm = search.toLowerCase();
      tasks = tasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description && task.description.toLowerCase().includes(searchTerm)) ||
        (task.tags && task.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
      );
    }

    // Create CSV content
    let csv = 'Title,Description,Priority,Category,Due Date,Tags,Completed,Created At\n';

    tasks.forEach(task => {
      const row = [
        `"${task.title.replace(/"/g, '""')}"`,
        `"${(task.description || '').replace(/"/g, '""')}"`,
        task.priority,
        task.category,
        task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        `"${(task.tags || []).join(', ')}"`,
        task.completed ? 'Yes' : 'No',
        new Date(task.createdAt).toISOString().split('T')[0]
      ];
      csv += row.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="tasks-export-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// POST /api/tasks/:id/subtasks - Add subtask
router.post('/:id/subtasks', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    if (task.owner.toString() !== req.user.id) return res.status(403).json({ msg: 'Forbidden' });

    const subtask = {
      title: req.body.title,
      completed: false,
      createdAt: Date.now()
    };

    task.subtasks.push(subtask);
    await task.save();

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// PUT /api/tasks/:id/subtasks/:subtaskId - Update subtask
router.put('/:id/subtasks/:subtaskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    if (task.owner.toString() !== req.user.id) return res.status(403).json({ msg: 'Forbidden' });

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ msg: 'Subtask not found' });

    if (req.body.title !== undefined) subtask.title = req.body.title;
    if (req.body.completed !== undefined) subtask.completed = req.body.completed;

    await task.save();
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// DELETE /api/tasks/:id/subtasks/:subtaskId - Delete subtask
router.delete('/:id/subtasks/:subtaskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    if (task.owner.toString() !== req.user.id) return res.status(403).json({ msg: 'Forbidden' });

    task.subtasks.pull({ _id: req.params.subtaskId });
    await task.save();

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// POST /api/tasks/:id/comments - Add comment
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    if (task.owner.toString() !== req.user.id) return res.status(403).json({ msg: 'Forbidden' });

    const comment = {
      text: req.body.text,
      author: req.user.id,
      createdAt: Date.now()
    };

    task.comments.push(comment);
    await task.save();

    // Populate author for response
    await task.populate('comments.author', 'name email');
    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// DELETE /api/tasks/:id/comments/:commentId - Delete comment
router.delete('/:id/comments/:commentId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    if (task.owner.toString() !== req.user.id) return res.status(403).json({ msg: 'Forbidden' });

    const comment = task.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ msg: 'Comment not found' });

    // Only comment author can delete
    if (comment.author.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to delete this comment' });
    }

    task.comments.pull({ _id: req.params.commentId });
    await task.save();

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// POST /api/tasks/:id/attachments - Add attachment
router.post('/:id/attachments', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    if (task.owner.toString() !== req.user.id) return res.status(403).json({ msg: 'Forbidden' });

    const attachment = {
      filename: req.body.filename,
      url: req.body.url,
      size: req.body.size,
      mimetype: req.body.mimetype,
      uploadedAt: Date.now()
    };

    task.attachments.push(attachment);
    await task.save();

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// DELETE /api/tasks/:id/attachments/:attachmentId - Delete attachment
router.delete('/:id/attachments/:attachmentId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ msg: 'Task not found' });
    if (task.owner.toString() !== req.user.id) return res.status(403).json({ msg: 'Forbidden' });

    task.attachments.pull({ _id: req.params.attachmentId });
    await task.save();

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    // Use findByIdAndDelete instead of findById + remove
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ msg: 'Task not found' });
    }

    // Authorization check
    if (task.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Forbidden' });
    }

    res.json({ msg: 'Task removed' });
  } catch (err) {
    console.error('Error deleting task:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
