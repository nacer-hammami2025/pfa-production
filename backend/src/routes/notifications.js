const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { trackNotification, trackUserActivity } = require('../middleware/metrics');

// Middleware d'authentification requis pour toutes les routes
router.use(auth);

// GET /api/notifications - Récupérer les notifications de l'utilisateur
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unread === 'true';

    const query = { user: req.user.id };
    if (unreadOnly) {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('user', 'name email');

    const total = await Notification.countDocuments(query);

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// GET /api/notifications/unread-count - Compter les notifications non lues
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      read: false
    });

    res.json({ count });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// PUT /api/notifications/:id/read - Marquer une notification comme lue
router.put('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    res.json(notification);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    res.status(500).send('Server error');
  }
});

// PUT /api/notifications/read-all - Marquer toutes les notifications comme lues
router.put('/read-all', async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// DELETE /api/notifications/:id - Supprimer une notification
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!notification) {
      return res.status(404).json({ msg: 'Notification not found' });
    }

    res.json({ msg: 'Notification deleted' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Notification not found' });
    }
    res.status(500).send('Server error');
  }
});

// PUT /api/notifications/preferences - Mettre à jour les préférences de notifications
router.put('/preferences', [
  check('notifications.email', 'Email preference must be boolean').optional().isBoolean(),
  check('notifications.push', 'Push preference must be boolean').optional().isBoolean(),
  check('notifications.reminders', 'Reminders preference must be boolean').optional().isBoolean(),
  check('notifications.taskDue', 'Task due preference must be boolean').optional().isBoolean(),
  check('notifications.teamActivity', 'Team activity preference must be boolean').optional().isBoolean(),
  check('notifications.achievements', 'Achievements preference must be boolean').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { preferences: req.body } },
      { new: true }
    ).select('preferences');

    res.json(user.preferences);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// GET /api/notifications/preferences - Récupérer les préférences de notifications
router.get('/preferences', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('preferences');
    res.json(user.preferences);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// POST /api/notifications/test - Créer une notification de test (pour développement)
router.post('/test', async (req, res) => {
  try {
    const notification = await Notification.create({
      user: req.user.id,
      type: 'system_update',
      title: 'Test Notification',
      message: 'This is a test notification to verify the system is working.',
      data: { priority: 'low' },
      channels: ['in_app']
    });

    trackNotification('system_update');
    trackUserActivity('notification_send');

    res.json({
      message: 'Test notification created',
      notification
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;