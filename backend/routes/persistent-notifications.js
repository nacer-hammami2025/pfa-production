const express = require('express');
const router = express.Router();
const PersistentNotification = require('../models/PersistentNotification');
const { authenticateToken } = require('../middleware/auth');

// Get user's persistent notifications
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const notifications = await PersistentNotification.find({
      user: req.user.userId
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    const total = await PersistentNotification.countDocuments({ user: req.user.userId });

    res.json({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user notifications:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des notifications'
    });
  }
});

// Get unread notifications count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await PersistentNotification.countDocuments({
      user: req.user.userId,
      read: false
    });

    res.json({ count });
  } catch (error) {
    console.error('Error counting unread notifications:', error);
    res.status(500).json({
      message: 'Erreur lors du comptage des notifications non lues'
    });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const notification = await PersistentNotification.findOne({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!notification) {
      return res.status(404).json({
        message: 'Notification non trouvée'
      });
    }

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json({
      message: 'Notification marquée comme lue'
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour de la notification'
    });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const notification = await PersistentNotification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId
    });

    if (!notification) {
      return res.status(404).json({
        message: 'Notification non trouvée'
      });
    }

    res.json({
      message: 'Notification supprimée avec succès'
    });

  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      message: 'Erreur lors de la suppression de la notification'
    });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticateToken, async (req, res) => {
  try {
    await PersistentNotification.updateMany(
      { user: req.user.userId, read: false },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.json({
      message: 'Toutes les notifications ont été marquées comme lues'
    });

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      message: 'Erreur lors de la mise à jour des notifications'
    });
  }
});

module.exports = router;