const express = require('express');
const router = express.Router();
const TeamCreationRequest = require('../models/TeamCreationRequest');
const Team = require('../models/Team');
const User = require('../models/User');
const PersistentNotification = require('../models/PersistentNotification');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Create a new team creation request
router.post('/request', authenticateToken, async (req, res) => {
  try {
    const { teamName, teamDescription } = req.body;

    if (!teamName || teamName.trim().length < 3) {
      return res.status(400).json({
        message: 'Le nom de l\'équipe doit contenir au moins 3 caractères'
      });
    }

    // Check if user already has a pending request for this team name
    const existingRequest = await TeamCreationRequest.findOne({
      requester: req.user.userId,
      teamName: teamName.trim(),
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        message: 'Vous avez déjà une demande en attente pour cette équipe'
      });
    }

    // Create the request
    const request = new TeamCreationRequest({
      requester: req.user.userId,
      teamName: teamName.trim(),
      teamDescription: teamDescription ? teamDescription.trim() : ''
    });

    await request.save();

    // Create notification for admins
    const admins = await User.find({ role: 'admin' });
    const notifications = admins.map(admin => ({
      user: admin._id,
      type: 'info',
      title: 'Nouvelle demande de création d\'équipe',
      message: `${req.user.username} souhaite créer l\'équipe "${teamName}"`,
      category: 'admin',
      priority: 'high',
      action: {
        label: 'Voir la demande',
        callback: '/admin/team-requests'
      },
      persistent: true,
      read: false
    }));

    await PersistentNotification.insertMany(notifications);

    res.status(201).json({
      message: 'Demande de création d\'équipe soumise avec succès',
      request: {
        _id: request._id,
        teamName: request.teamName,
        teamDescription: request.teamDescription,
        status: request.status,
        createdAt: request.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating team creation request:', error);
    res.status(500).json({
      message: 'Erreur lors de la création de la demande'
    });
  }
});

// Get user's own team creation requests
router.get('/my-requests', authenticateToken, async (req, res) => {
  try {
    const requests = await TeamCreationRequest.find({
      requester: req.user.userId
    })
    .populate('reviewedBy', 'username email')
    .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des demandes'
    });
  }
});

// Get all team creation requests (admin only)
router.get('/requests', authenticateToken, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const skip = (page - 1) * limit;

    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const total = await TeamCreationRequest.countDocuments(query);
    const requests = await TeamCreationRequest.find(query)
      .populate('requester', 'username email')
      .populate('reviewedBy', 'username email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching team creation requests:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération des demandes'
    });
  }
});

// Get pending requests count (for admin dashboard)
router.get('/requests/count', authenticateToken, isAdmin, async (req, res) => {
  try {
    const count = await TeamCreationRequest.countDocuments({ status: 'pending' });
    res.json({ count });
  } catch (error) {
    console.error('Error counting pending requests:', error);
    res.status(500).json({
      message: 'Erreur lors du comptage des demandes'
    });
  }
});

// Get a specific team creation request
router.get('/requests/:id', authenticateToken, async (req, res) => {
  try {
    const request = await TeamCreationRequest.findById(req.params.id)
      .populate('requester', 'username email')
      .populate('reviewedBy', 'username email');

    if (!request) {
      return res.status(404).json({
        message: 'Demande non trouvée'
      });
    }

    // Check if user is the requester or an admin
    if (request.requester._id.toString() !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'Accès non autorisé'
      });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching team creation request:', error);
    res.status(500).json({
      message: 'Erreur lors de la récupération de la demande'
    });
  }
});

// Approve or reject a team creation request (admin only)
router.put('/requests/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { action, reviewComment } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        message: 'Action invalide. Utilisez "approve" ou "reject"'
      });
    }

    const request = await TeamCreationRequest.findById(req.params.id)
      .populate('requester', 'username email');

    if (!request) {
      return res.status(404).json({
        message: 'Demande non trouvée'
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        message: 'Cette demande a déjà été traitée'
      });
    }

    // Update the request
    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.reviewedBy = req.user.userId;
    request.reviewComment = reviewComment ? reviewComment.trim() : '';
    request.reviewedAt = new Date();

    await request.save();

    let team = null;

    // If approved, create the team
    if (action === 'approve') {
      team = new Team({
        name: request.teamName,
        description: request.teamDescription,
        owner: request.requester._id,
        members: [{
          user: request.requester._id,
          role: 'owner',
          joinedAt: new Date()
        }],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      await team.save();
    }

    // Create notification for the requester
    const notificationMessage = action === 'approve'
      ? `Votre demande de création d'équipe "${request.teamName}" a été approuvée. L'équipe a été créée avec succès !`
      : `Votre demande de création d'équipe "${request.teamName}" a été rejetée.${reviewComment ? ` Raison : ${reviewComment}` : ''}`;

    const userNotification = new PersistentNotification({
      user: request.requester._id,
      type: action === 'approve' ? 'success' : 'warning',
      title: `Demande d'équipe ${action === 'approve' ? 'approuvée' : 'rejetée'}`,
      message: notificationMessage,
      category: 'admin',
      priority: 'high',
      persistent: true,
      read: false
    });

    await userNotification.save();

    res.json({
      message: `Demande ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`,
      request: {
        _id: request._id,
        teamName: request.teamName,
        status: request.status,
        reviewedBy: {
          _id: req.user.userId,
          username: req.user.username,
          email: req.user.email
        },
        reviewComment: request.reviewComment,
        reviewedAt: request.reviewedAt
      },
      team: team ? {
        _id: team._id,
        name: team.name,
        description: team.description
      } : null
    });

  } catch (error) {
    console.error('Error reviewing team creation request:', error);
    res.status(500).json({
      message: 'Erreur lors du traitement de la demande'
    });
  }
});

module.exports = router;