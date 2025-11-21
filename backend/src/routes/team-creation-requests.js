const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const TeamCreationRequest = require('../../models/TeamCreationRequest');
const Team = require('../../models/Team');
const User = require('../../models/User');
const Notification = require('../../models/Notification');

// Create a team creation request
router.post('/request', auth, async (req, res) => {
  try {
    const { teamName, teamDescription } = req.body;

    // Check if user already has a pending request for this team name
    const existingRequest = await TeamCreationRequest.findOne({
      requester: req.user.id,
      teamName: teamName,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({
        message: 'Vous avez déjà une demande en attente pour cette équipe.'
      });
    }

    // Create the request
    const request = new TeamCreationRequest({
      requester: req.user.id,
      teamName,
      teamDescription
    });

    await request.save();

    // Find all admins to notify them
    const admins = await User.find({ role: 'admin' });

    // Create notifications for all admins
    const notifications = admins.map(admin => ({
      user: admin._id,
      type: 'team_creation_request',
      title: 'Nouvelle demande de création d\'équipe',
      message: `${req.user.username} souhaite créer l'équipe "${teamName}"`,
      data: {
        requestId: request._id,
        requesterId: req.user.id,
        requesterName: req.user.username,
        teamName: teamName
      },
      priority: 'high',
      read: false
    }));

    await Notification.insertMany(notifications);

    // Populate the request with user info for response
    await request.populate('requester', 'username email');

    res.status(201).json({
      message: 'Demande de création d\'équipe soumise avec succès.',
      request
    });
  } catch (error) {
    console.error('Error creating team creation request:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la demande.' });
  }
});

// Get team creation requests (for admins)
router.get('/requests', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé.' });
    }

    const { status, page = 1, limit = 10 } = req.query;
    const query = status ? { status } : {};

    const requests = await TeamCreationRequest.find(query)
      .populate('requester', 'username email')
      .populate('reviewedBy', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await TeamCreationRequest.countDocuments(query);

    res.json({
      requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching team creation requests:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des demandes.' });
  }
});

// Get user's own team creation requests
router.get('/my-requests', auth, async (req, res) => {
  try {
    const requests = await TeamCreationRequest.find({ requester: req.user.id })
      .populate('reviewedBy', 'username email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching user team creation requests:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de vos demandes.' });
  }
});

// Approve or reject a team creation request (admin only)
router.put('/requests/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé.' });
    }

    const { id } = req.params;
    const { action, reviewComment } = req.body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action invalide.' });
    }

    const request = await TeamCreationRequest.findById(id)
      .populate('requester', 'username email');

    if (!request) {
      return res.status(404).json({ message: 'Demande non trouvée.' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Cette demande a déjà été traitée.' });
    }

    // Update the request
    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.reviewedBy = req.user.id;
    request.reviewComment = reviewComment;
    request.reviewedAt = new Date();

    await request.save();

    // If approved, create the team
    let createdTeam = null;
    if (action === 'approve') {
      const team = new Team({
        name: request.teamName,
        description: request.teamDescription,
        owner: request.requester._id,
        members: [{ user: request.requester._id, role: 'owner' }]
      });

      createdTeam = await team.save();
    }

    // Create notification for the requester
    const notificationMessage = action === 'approve'
      ? `Votre demande de création de l'équipe "${request.teamName}" a été approuvée. L'équipe a été créée avec succès.`
      : `Votre demande de création de l'équipe "${request.teamName}" a été rejetée.${reviewComment ? ` Raison: ${reviewComment}` : ''}`;

    const userNotification = new Notification({
      user: request.requester._id,
      type: action === 'approve' ? 'team_creation_approved' : 'team_creation_rejected',
      title: action === 'approve' ? 'Équipe créée avec succès' : 'Demande d\'équipe rejetée',
      message: notificationMessage,
      data: {
        requestId: request._id,
        teamName: request.teamName,
        teamId: createdTeam?._id,
        reviewComment: reviewComment,
        reviewerName: req.user.username
      },
      priority: 'normal',
      read: false
    });

    await userNotification.save();

    // Populate the updated request
    await request.populate('reviewedBy', 'username email');

    res.json({
      message: `Demande ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès.`,
      request,
      team: createdTeam
    });
  } catch (error) {
    console.error('Error processing team creation request:', error);
    res.status(500).json({ message: 'Erreur lors du traitement de la demande.' });
  }
});

// Get a specific team creation request
router.get('/requests/:id', auth, async (req, res) => {
  try {
    const request = await TeamCreationRequest.findById(req.params.id)
      .populate('requester', 'username email')
      .populate('reviewedBy', 'username email');

    if (!request) {
      return res.status(404).json({ message: 'Demande non trouvée.' });
    }

    // Check if user is admin or the requester
    if (req.user.role !== 'admin' && request.requester._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès non autorisé.' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching team creation request:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de la demande.' });
  }
});

module.exports = router;