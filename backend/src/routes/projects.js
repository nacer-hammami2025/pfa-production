const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Task = require('../models/Task');

// GET /api/projects - List user's projects
router.get('/', auth, async (req, res) => {
  try {
    const User = require('../models/User');
    const currentUser = await User.findById(req.user.id);
    
    let projects;
    if (currentUser.role === 'admin') {
      // Admin can see all projects
      projects = await Project.find({})
        .populate('owner', 'name email')
        .populate('members', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // Regular user sees only their projects
      projects = await Project.find({
        $or: [
          { owner: req.user.id },
          { members: req.user.id }
        ]
      })
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });
    }

    res.json(projects);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// GET /api/projects/:id - Get project details
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .populate('tasks');

    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Check access
    const hasAccess = project.owner._id.toString() === req.user.id ||
                     project.members.some(m => m._id.toString() === req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// POST /api/projects - Create project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, members, startDate, endDate, priority, color } = req.body;

    const project = new Project({
      name,
      description,
      owner: req.user.id,
      members: members || [],
      startDate,
      endDate,
      priority,
      color
    });

    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');

    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    // Only owner can update
    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const { name, description, members, status, priority, startDate, endDate, color } = req.body;

    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (members !== undefined) project.members = members;
    if (status !== undefined) project.status = status;
    if (priority !== undefined) project.priority = priority;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (color !== undefined) project.color = color;

    await project.save();
    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');

    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    // Remove project reference from tasks
    await Task.updateMany(
      { project: req.params.id },
      { $unset: { project: "" } }
    );

    await Project.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Project deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// POST /api/projects/:id/milestones - Add milestone
router.post('/:id/milestones', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const milestone = {
      title: req.body.title,
      description: req.body.description,
      dueDate: req.body.dueDate,
      completed: false
    };

    project.milestones.push(milestone);
    await project.save();

    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// PUT /api/projects/:id/milestones/:milestoneId - Update milestone
router.put('/:id/milestones/:milestoneId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    const milestone = project.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ msg: 'Milestone not found' });
    }

    if (req.body.title !== undefined) milestone.title = req.body.title;
    if (req.body.description !== undefined) milestone.description = req.body.description;
    if (req.body.dueDate !== undefined) milestone.dueDate = req.body.dueDate;
    if (req.body.completed !== undefined) {
      milestone.completed = req.body.completed;
      milestone.completedAt = req.body.completed ? new Date() : null;
    }

    await project.save();
    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// DELETE /api/projects/:id/milestones/:milestoneId - Delete milestone
router.delete('/:id/milestones/:milestoneId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    if (project.owner.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized' });
    }

    project.milestones.pull({ _id: req.params.milestoneId });
    await project.save();

    res.json(project);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// POST /api/projects/:id/tasks - Add task to project
router.post('/:id/tasks', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    const hasAccess = project.owner.toString() === req.user.id ||
                     project.members.some(m => m.toString() === req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const task = new Task({
      ...req.body,
      owner: req.user.id,
      project: req.params.id
    });

    await task.save();
    
    project.tasks.push(task._id);
    await project.updateProgress();
    await project.save();

    res.json(task);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// GET /api/projects/:id/stats - Get project statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('tasks');
    if (!project) {
      return res.status(404).json({ msg: 'Project not found' });
    }

    const hasAccess = project.owner.toString() === req.user.id ||
                     project.members.some(m => m._id.toString() === req.user.id);
    if (!hasAccess) {
      return res.status(403).json({ msg: 'Access denied' });
    }

    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.completed).length;
    const overdueTasks = project.tasks.filter(t => 
      t.dueDate && new Date(t.dueDate) < new Date() && !t.completed
    ).length;

    const completedMilestones = project.milestones.filter(m => m.completed).length;
    const totalMilestones = project.milestones.length;

    res.json({
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      overdueTasks,
      progress: project.progress,
      totalMilestones,
      completedMilestones,
      members: project.members.length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
