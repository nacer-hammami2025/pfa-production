const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const auth = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');
const User = require('../models/User');
const Team = require('../models/Team');
const Task = require('../models/Task');
const RolePermission = require('../models/RolePermission');

// Route pour récupérer le résumé du tableau de bord admin
router.get('/dashboard-summary', [auth, requireAdmin], async (req, res) => {
  try {
    // Récupérer les statistiques des utilisateurs
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.countDocuments({ lastLogin: { $gt: thirtyDaysAgo } });

    // Récupérer les statistiques des équipes
    const totalTeams = await Team.countDocuments();
    const teams = await Team.find();
    const totalTeamMembers = teams.reduce((acc, team) => acc + (team.members?.length || 0), 0);

    // Récupérer les statistiques des tâches
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ completed: true });

    // Récupérer les utilisateurs récents
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email role createdAt');

    // Récupérer les équipes récentes
    const recentTeams = await Team.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('name members updatedAt');

    // Calculer les statistiques hebdomadaires
    const weeklyStats = {
      registrations: Array(7).fill(0),
      tasksCompleted: Array(7).fill(0)
    };

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRegistrations = await User.find({ createdAt: { $gte: sevenDaysAgo } });
    recentRegistrations.forEach(user => {
      const dayIndex = Math.floor((new Date().setHours(0, 0, 0, 0) - user.createdAt.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) {
        weeklyStats.registrations[6 - dayIndex]++;
      }
    });

    const recentTasks = await Task.find({ completed: true, updatedAt: { $gte: sevenDaysAgo } });
    recentTasks.forEach(task => {
      const dayIndex = Math.floor((new Date().setHours(0, 0, 0, 0) - task.updatedAt.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) {
        weeklyStats.tasksCompleted[6 - dayIndex]++;
      }
    });

    res.json({
      totals: {
        users: totalUsers,
        admins: totalAdmins,
        activeUsers,
        teams: totalTeams,
        teamMembers: totalTeamMembers,
        tasks: totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks
      },
      weeklyStats,
      recentUsers,
      recentTeams
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).send('Server Error');
  }
});

const defaultPermissions = {
  admin: [
    {
      key: 'manageUsers',
      label: 'Manage Users',
      description: 'Create, update, and remove user accounts',
      enabled: true
    },
    {
      key: 'manageTeams',
      label: 'Manage Teams',
      description: 'Create teams and adjust membership',
      enabled: true
    },
    {
      key: 'managePermissions',
      label: 'Manage Permissions',
      description: 'Adjust role-based permissions across the workspace',
      enabled: true
    },
    {
      key: 'viewAnalytics',
      label: 'View Analytics',
      description: 'Access organization-wide reports and dashboards',
      enabled: true
    }
  ],
  user: [
    {
      key: 'createTasks',
      label: 'Create Tasks',
      description: 'Create and manage personal tasks',
      enabled: true
    },
    {
      key: 'collaborateTeams',
      label: 'Collaborate with Teams',
      description: 'Join teams and collaborate on shared tasks',
      enabled: true
    },
    {
      key: 'accessAI',
      label: 'Access AI Features',
      description: 'Use AI suggestions, summaries, and productivity boosters',
      enabled: true
    },
    {
      key: 'manageUsers',
      label: 'Manage Users',
      description: 'Create or update other users in the organization',
      enabled: false
    }
  ]
};

async function ensureDefaultRolePermissions() {
  const roles = Object.keys(defaultPermissions);
  const results = [];

  for (const role of roles) {
    let config = await RolePermission.findOne({ role });
    if (!config) {
      config = await RolePermission.create({ role, permissions: defaultPermissions[role] });
    }
    results.push(config);
  }

  return results;
}

function sanitiseUser(user) {
  if (!user) return user;
  const { password, ...safe } = user.toObject ? user.toObject() : user;
  return safe;
}

router.use(auth, requireAdmin);

router.get('/dashboard/summary', async (req, res) => {
  try {
    const [totalUsers, adminUsers, recentUsers, totalTeams, recentTeams] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt'),
      Team.countDocuments(),
      Team.find().sort({ updatedAt: -1 }).limit(5).select('name members updatedAt')
    ]);

    const activeUsers = await User.countDocuments({ lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } });
    const memberCountAggregation = await Team.aggregate([
      { $unwind: { path: '$members', preserveNullAndEmptyArrays: true } },
      { $group: { _id: null, count: { $sum: 1 } } }
    ]);
    const totalTeamMembers = memberCountAggregation[0]?.count || 0;

    res.json({
      totals: {
        users: totalUsers,
        admins: adminUsers,
        activeUsers,
        teams: totalTeams,
        teamMembers: totalTeamMembers
      },
      recentUsers,
      recentTeams
    });
  } catch (error) {
    console.error('[ADMIN] dashboard summary error', error);
    res.status(500).json({ message: 'Unable to fetch dashboard summary' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('[ADMIN] list users error', error);
    res.status(500).json({ message: 'Unable to fetch users' });
  }
});

router.post('/users', [auth, requireAdmin], async (req, res) => {
  console.log('[ADMIN] POST /users - Request received:', { name: req.body.name, email: req.body.email, role: req.body.role });
  try {
    const { name, email, password, role = 'user' } = req.body;
    if (!name || !email || !password) {
      console.log('[ADMIN] Validation failed: missing fields');
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      console.log('[ADMIN] User already exists:', email);
      return res.status(409).json({ message: 'A user with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashedPassword, role });
    console.log('[ADMIN] ✅ User created successfully:', email);
    res.status(201).json(sanitiseUser(user));
  } catch (error) {
    console.error('[ADMIN] ❌ Create user error:', error.message);
    res.status(500).json({ message: 'Unable to create user', details: error.message });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;

    const update = {};
    if (name) update.name = name;
    if (email) update.email = email;
    if (role) update.role = role;

    const user = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('[ADMIN] update user error', error);
    res.status(500).json({ message: 'Unable to update user' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ message: 'Admins cannot delete their own account while logged in' });
    }

    await user.deleteOne();
    res.json({ message: 'User removed successfully' });
  } catch (error) {
    console.error('[ADMIN] delete user error', error);
    res.status(500).json({ message: 'Unable to delete user' });
  }
});

router.get('/teams', async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('owner', 'name email role')
      .populate('members.user', 'name email role')
      .sort({ createdAt: -1 });
    res.json(teams);
  } catch (error) {
    console.error('[ADMIN] list teams error', error);
    res.status(500).json({ message: 'Unable to fetch teams' });
  }
});

router.post('/teams', [auth, requireAdmin], async (req, res) => {
  console.log('[ADMIN] POST /teams - Request received:', { name: req.body.name, ownerId: req.body.ownerId, memberIds: req.body.memberIds });
  try {
    const { name, description, ownerId, memberIds = [] } = req.body;
    if (!name) {
      console.log('[ADMIN] Validation failed: team name is required');
      return res.status(400).json({ message: 'Team name is required' });
    }

    const owner = ownerId || req.user.id;
    console.log('[ADMIN] Creating team with owner:', owner);
    
    const team = new Team({
      name,
      description,
      owner,
      members: [{ user: owner, role: 'owner' }]
    });

    if (Array.isArray(memberIds)) {
      const uniqueMembers = [...new Set(memberIds.filter((member) => member !== owner))];
      console.log('[ADMIN] Adding members:', uniqueMembers);
      uniqueMembers.forEach((memberId) => {
        team.members.push({ user: memberId, role: 'member' });
      });
    }

    await team.save();
    await team.populate('owner', 'name email role');
    await team.populate('members.user', 'name email role');

    console.log('[ADMIN] ✅ Team created successfully:', name);
    res.status(201).json(team);
  } catch (error) {
    console.error('[ADMIN] ❌ Create team error:', error.message);
    res.status(500).json({ message: 'Unable to create team', details: error.message });
  }
});

router.patch('/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, ownerId, memberIds } = req.body;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const currentOwnerId = team.owner?.toString();

    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (ownerId) {
      team.owner = ownerId;
      const ownerMember = team.members.find((member) => member.role === 'owner');
      if (ownerMember) {
        ownerMember.user = ownerId;
      } else {
        team.members.push({ user: ownerId, role: 'owner' });
      }
    }

    if (Array.isArray(memberIds)) {
      const uniqueMembers = [...new Set(memberIds.filter(Boolean))];
      const ownerToUse = (ownerId || team.owner)?.toString();

      const existingRoles = new Map(team.members.map((member) => [member.user.toString(), member.role]));

      const members = [];
      if (ownerToUse) {
        members.push({ user: ownerToUse, role: 'owner' });
      }

      uniqueMembers.forEach((memberId) => {
        const memberString = memberId.toString();
        if (ownerToUse && memberString === ownerToUse) {
          return;
        }
        const role = existingRoles.get(memberString) || 'member';
        members.push({ user: memberId, role });
      });

      team.members = members;
    }

    await team.save();
    await team.populate('owner', 'name email role');
    await team.populate('members.user', 'name email role');

    res.json(team);
  } catch (error) {
    console.error('[ADMIN] update team error', error);
    res.status(500).json({ message: 'Unable to update team' });
  }
});

router.delete('/teams/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    await team.deleteOne();
    res.json({ message: 'Team removed successfully' });
  } catch (error) {
    console.error('[ADMIN] delete team error', error);
    res.status(500).json({ message: 'Unable to delete team' });
  }
});

// Ajouter un membre à une équipe
router.post('/teams/:id/members', [auth, requireAdmin], async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Vérifier si l'utilisateur est déjà membre
    const isMember = team.members.some(m => m.user.toString() === userId);
    if (isMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Ajouter le membre
    team.members.push({ user: userId, role: 'member' });
    await team.save();

    // Récupérer l'équipe avec les données complètes
    const updatedTeam = await Team.findById(id)
      .populate('owner', 'name email role')
      .populate('members.user', 'name email role');

    res.json(updatedTeam);
  } catch (error) {
    console.error('[ADMIN] add team member error', error);
    res.status(500).json({ message: 'Unable to add member to team' });
  }
});

// Retirer un membre d'une équipe
router.delete('/teams/:id/members/:userId', [auth, requireAdmin], async (req, res) => {
  try {
    const { id, userId } = req.params;

    const team = await Team.findById(id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Retirer le membre
    team.members = team.members.filter(m => m.user.toString() !== userId);
    await team.save();

    // Récupérer l'équipe avec les données complètes
    const updatedTeam = await Team.findById(id)
      .populate('owner', 'name email role')
      .populate('members.user', 'name email role');

    res.json(updatedTeam);
  } catch (error) {
    console.error('[ADMIN] remove team member error', error);
    res.status(500).json({ message: 'Unable to remove member from team' });
  }
});

router.get('/permissions', async (req, res) => {
  try {
    const configs = await ensureDefaultRolePermissions();
    res.json(configs);
  } catch (error) {
    console.error('[ADMIN] list permissions error', error);
    res.status(500).json({ message: 'Unable to load role permissions' });
  }
});

router.patch('/permissions/:role', async (req, res) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Unsupported role' });
    }

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: 'Permissions payload must be an array' });
    }

    const config = await RolePermission.findOne({ role });
    if (!config) {
      return res.status(404).json({ message: 'Role permission configuration not found' });
    }

    const permissionMap = new Map(config.permissions.map((cap) => [cap.key, cap]));

    permissions.forEach((incoming) => {
      if (!incoming || !incoming.key) {
        return;
      }
      const existing = permissionMap.get(incoming.key);
      if (existing) {
        if (incoming.enabled !== undefined) {
          existing.enabled = incoming.enabled;
        }
        if (incoming.label) existing.label = incoming.label;
        if (incoming.description) existing.description = incoming.description;
      } else {
        permissionMap.set(incoming.key, {
          key: incoming.key,
          label: incoming.label || incoming.key,
          description: incoming.description || '',
          enabled: !!incoming.enabled
        });
      }
    });

    config.permissions = Array.from(permissionMap.values());
    await config.save();

    res.json(config);
  } catch (error) {
    console.error('[ADMIN] update permissions error', error);
    res.status(500).json({ message: 'Unable to update role permissions' });
  }
});

// Point de terminaison temporaire pour lister les utilisateurs
router.get('/list-users', async (req, res) => {
  try {
    // Test simple sans base de données
    res.json([{ name: 'Test User', email: 'test@example.com', role: 'user' }]);
  } catch (err) {
    res.status(500).json({ msg: 'Erreur', error: err.message });
  }
});

module.exports = router;
