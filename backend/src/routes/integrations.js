const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const { google } = require('googleapis');
const axios = require('axios');

// Get user's integrations
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('integrations');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.integrations || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Google Calendar Integration
router.post('/google-calendar/connect', auth, async (req, res) => {
  try {
    const { code } = req.body;

    // Exchange authorization code for access token
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.FRONTEND_URL}/integrations/google-calendar/callback`
    );

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user profile
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const profile = await oauth2.userinfo.get();

    // Save integration
    const user = await User.findById(req.user.id);
    if (!user.integrations) user.integrations = {};

    user.integrations.googleCalendar = {
      connected: true,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
      email: profile.data.email,
      connectedAt: new Date()
    };

    await user.save();

    res.json({
      message: 'Google Calendar connected successfully',
      integration: user.integrations.googleCalendar
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sync tasks to Google Calendar
router.post('/google-calendar/sync', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const integration = user.integrations?.googleCalendar;

    if (!integration || !integration.connected) {
      return res.status(400).json({ message: 'Google Calendar not connected' });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken,
      expiry_date: integration.expiryDate
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get user's tasks
    const Task = require('../models/Task');
    const tasks = await Task.find({ userId: req.user.id, completed: false });

    // Create calendar events for tasks
    const events = [];
    for (const task of tasks) {
      if (task.dueDate) {
        const event = {
          summary: task.title,
          description: task.description,
          start: {
            dateTime: new Date(task.dueDate).toISOString(),
            timeZone: 'UTC',
          },
          end: {
            dateTime: new Date(new Date(task.dueDate).getTime() + (task.estimatedHours || 1) * 60 * 60 * 1000).toISOString(),
            timeZone: 'UTC',
          },
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 },
              { method: 'popup', minutes: 60 },
            ],
          },
        };

        const createdEvent = await calendar.events.insert({
          calendarId: 'primary',
          resource: event,
        });

        events.push({
          taskId: task._id,
          eventId: createdEvent.data.id,
          syncedAt: new Date()
        });
      }
    }

    // Update sync status
    integration.lastSync = new Date();
    integration.syncedEvents = events;
    await user.save();

    res.json({
      message: 'Tasks synced to Google Calendar',
      syncedCount: events.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Microsoft Outlook Integration
router.post('/outlook/connect', auth, async (req, res) => {
  try {
    const { code } = req.body;

    // Exchange code for tokens
    const tokenResponse = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      client_id: process.env.OUTLOOK_CLIENT_ID,
      client_secret: process.env.OUTLOOK_CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.FRONTEND_URL}/integrations/outlook/callback`
    });

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // Get user profile
    const profileResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    // Save integration
    const user = await User.findById(req.user.id);
    if (!user.integrations) user.integrations = {};

    user.integrations.outlook = {
      connected: true,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiryDate: Date.now() + (expires_in * 1000),
      email: profileResponse.data.mail,
      connectedAt: new Date()
    };

    await user.save();

    res.json({
      message: 'Outlook connected successfully',
      integration: user.integrations.outlook
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Slack Integration
router.post('/slack/connect', auth, async (req, res) => {
  try {
    const { code } = req.body;

    // Exchange code for access token
    const tokenResponse = await axios.post('https://slack.com/api/oauth.v2.access', {
      client_id: process.env.SLACK_CLIENT_ID,
      client_secret: process.env.SLACK_CLIENT_SECRET,
      code: code,
      redirect_uri: `${process.env.FRONTEND_URL}/integrations/slack/callback`
    });

    const { access_token, team, authed_user } = tokenResponse.data;

    // Save integration
    const user = await User.findById(req.user.id);
    if (!user.integrations) user.integrations = {};

    user.integrations.slack = {
      connected: true,
      accessToken: access_token,
      teamId: team.id,
      teamName: team.name,
      userId: authed_user.id,
      connectedAt: new Date()
    };

    await user.save();

    res.json({
      message: 'Slack connected successfully',
      integration: user.integrations.slack
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send notification to Slack
router.post('/slack/notify', auth, async (req, res) => {
  try {
    const { message, channel } = req.body;
    const user = await User.findById(req.user.id);
    const integration = user.integrations?.slack;

    if (!integration || !integration.connected) {
      return res.status(400).json({ message: 'Slack not connected' });
    }

    // Send message to Slack
    await axios.post('https://slack.com/api/chat.postMessage', {
      channel: channel || '#general',
      text: message
    }, {
      headers: { Authorization: `Bearer ${integration.accessToken}` }
    });

    res.json({ message: 'Notification sent to Slack' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Trello Integration
router.post('/trello/connect', auth, async (req, res) => {
  try {
    const { token } = req.body;

    // Verify token and get user info
    const memberResponse = await axios.get('https://api.trello.com/1/members/me', {
      params: {
        key: process.env.TRELLO_API_KEY,
        token: token
      }
    });

    // Save integration
    const user = await User.findById(req.user.id);
    if (!user.integrations) user.integrations = {};

    user.integrations.trello = {
      connected: true,
      apiToken: token,
      userId: memberResponse.data.id,
      username: memberResponse.data.username,
      connectedAt: new Date()
    };

    await user.save();

    res.json({
      message: 'Trello connected successfully',
      integration: user.integrations.trello
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sync tasks to Trello
router.post('/trello/sync', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const integration = user.integrations?.trello;

    if (!integration || !integration.connected) {
      return res.status(400).json({ message: 'Trello not connected' });
    }

    // Get user's boards
    const boardsResponse = await axios.get('https://api.trello.com/1/members/me/boards', {
      params: {
        key: process.env.TRELLO_API_KEY,
        token: integration.apiToken
      }
    });

    // Use first board or create new one
    let boardId = boardsResponse.data[0]?.id;

    if (!boardId) {
      // Create new board
      const boardResponse = await axios.post('https://api.trello.com/1/boards', {
        name: 'TaskFlow Pro Tasks',
        defaultLists: false
      }, {
        params: {
          key: process.env.TRELLO_API_KEY,
          token: integration.apiToken
        }
      });
      boardId = boardResponse.data.id;

      // Create lists
      await axios.post(`https://api.trello.com/1/boards/${boardId}/lists`, {
        name: 'À faire'
      }, {
        params: {
          key: process.env.TRELLO_API_KEY,
          token: integration.apiToken
        }
      });

      await axios.post(`https://api.trello.com/1/boards/${boardId}/lists`, {
        name: 'En cours'
      }, {
        params: {
          key: process.env.TRELLO_API_KEY,
          token: integration.apiToken
        }
      });

      await axios.post(`https://api.trello.com/1/boards/${boardId}/lists`, {
        name: 'Terminé'
      }, {
        params: {
          key: process.env.TRELLO_API_KEY,
          token: integration.apiToken
        }
      });
    }

    // Get lists
    const listsResponse = await axios.get(`https://api.trello.com/1/boards/${boardId}/lists`, {
      params: {
        key: process.env.TRELLO_API_KEY,
        token: integration.apiToken
      }
    });

    const todoList = listsResponse.data.find(list => list.name === 'À faire');
    const doingList = listsResponse.data.find(list => list.name === 'En cours');
    const doneList = listsResponse.data.find(list => list.name === 'Terminé');

    // Get user's tasks
    const Task = require('../models/Task');
    const tasks = await Task.find({ userId: req.user.id });

    // Sync tasks to Trello
    for (const task of tasks) {
      let listId;
      if (task.completed) {
        listId = doneList?.id;
      } else if (task.status === 'in_progress') {
        listId = doingList?.id;
      } else {
        listId = todoList?.id;
      }

      if (listId) {
        await axios.post(`https://api.trello.com/1/cards`, {
          name: task.title,
          desc: task.description,
          idList: listId,
          due: task.dueDate ? new Date(task.dueDate).toISOString() : null
        }, {
          params: {
            key: process.env.TRELLO_API_KEY,
            token: integration.apiToken
          }
        });
      }
    }

    // Update sync status
    integration.lastSync = new Date();
    await user.save();

    res.json({ message: 'Tasks synced to Trello' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Disconnect integration
router.delete('/:provider', auth, async (req, res) => {
  try {
    const { provider } = req.params;
    const user = await User.findById(req.user.id);

    if (user.integrations && user.integrations[provider]) {
      user.integrations[provider] = { connected: false };
      await user.save();
    }

    res.json({ message: `${provider} disconnected successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;