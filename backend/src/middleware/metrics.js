const express = require('express');
const promClient = require('prom-client');

// Create a Registry to register the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'pfa-backend'
});

// Enable the collection of default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics for PFA application
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

const activeUsers = new promClient.Gauge({
  name: 'pfa_active_users_total',
  help: 'Number of currently active users'
});

const tasksTotal = new promClient.Gauge({
  name: 'pfa_tasks_total',
  help: 'Total number of tasks in the system',
  labelNames: ['status']
});

const projectsTotal = new promClient.Gauge({
  name: 'pfa_projects_total',
  help: 'Total number of projects in the system'
});

const teamsTotal = new promClient.Gauge({
  name: 'pfa_teams_total',
  help: 'Total number of teams in the system'
});

const notificationsTotal = new promClient.Counter({
  name: 'pfa_notifications_total',
  help: 'Total number of notifications sent',
  labelNames: ['type']
});

const userActivityTotal = new promClient.Counter({
  name: 'pfa_user_activity_total',
  help: 'Total user activity events',
  labelNames: ['action']
});

const mongoConnections = new promClient.Gauge({
  name: 'mongodb_connections_current',
  help: 'Current MongoDB connections'
});

const responseTime = new promClient.Histogram({
  name: 'pfa_response_time_seconds',
  help: 'Response time for PFA operations',
  labelNames: ['operation'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Register the custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeUsers);
register.registerMetric(tasksTotal);
register.registerMetric(projectsTotal);
register.registerMetric(teamsTotal);
register.registerMetric(notificationsTotal);
register.registerMetric(userActivityTotal);
register.registerMetric(mongoConnections);
register.registerMetric(responseTime);

// Middleware to collect HTTP metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};

// Function to update business metrics
const updateBusinessMetrics = async () => {
  try {
    const mongoose = require('mongoose');
    
    if (mongoose.connection.readyState !== 1) {
      console.log('[METRICS] Database not connected, skipping business metrics update');
      return;
    }
    
    // Update task metrics by status
    try {
      const Task = require('../models/Task');
      const todoTasks = await Task.countDocuments({ status: 'TODO' });
      const inProgressTasks = await Task.countDocuments({ status: 'IN_PROGRESS' });
      const doneTasks = await Task.countDocuments({ status: 'DONE' });
      const completedTasks = await Task.countDocuments({ completed: true });
      const pendingTasks = await Task.countDocuments({ completed: false });
      
      tasksTotal.labels('TODO').set(todoTasks);
      tasksTotal.labels('IN_PROGRESS').set(inProgressTasks);
      tasksTotal.labels('DONE').set(doneTasks);
      tasksTotal.labels('completed').set(completedTasks);
      tasksTotal.labels('pending').set(pendingTasks);
    } catch (err) {
      // Task model might not be loaded yet
    }
    
    // Update project metrics
    try {
      const Project = require('../models/Project');
      const totalProjects = await Project.countDocuments();
      projectsTotal.set(totalProjects);
    } catch (err) {
      // Project model might not be loaded yet
    }
    
    // Update team metrics
    try {
      const Team = require('../models/Team');
      const totalTeams = await Team.countDocuments();
      const activeTeams = await Team.countDocuments({ isActive: true });
      teamsTotal.set(totalTeams);
    } catch (err) {
      // Team model might not be loaded yet
    }
    
    // Update active users count
    try {
      const User = require('../models/User');
      const totalUsers = await User.countDocuments();
      const activeUsersCount = await User.countDocuments({ 
        lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
      });
      activeUsers.set(activeUsersCount);
    } catch (err) {
      // User model might not be loaded yet
    }
    
    // MongoDB connection metrics
    mongoConnections.set(mongoose.connection.readyState);
    
  } catch (error) {
    console.error('[METRICS] Error updating business metrics:', error.message);
  }
};

// Update business metrics every 30 seconds
setInterval(updateBusinessMetrics, 30000);

// Metrics endpoint
const metricsHandler = async (req, res) => {
  try {
    // Update metrics before serving
    await updateBusinessMetrics();
    
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    console.error('Error serving metrics:', error);
    res.status(500).send('Error generating metrics');
  }
};

// Helper functions to track specific metrics
const trackNotification = (type = 'general') => {
  notificationsTotal.labels(type).inc();
};

const trackUserActivity = (action = 'unknown') => {
  userActivityTotal.labels(action).inc();
};

const trackResponseTime = (operation, duration) => {
  responseTime.labels(operation).observe(duration);
};

module.exports = {
  register,
  metricsMiddleware,
  metricsHandler,
  updateBusinessMetrics,
  trackNotification,
  trackUserActivity,
  trackResponseTime,
  metrics: {
    httpRequestDuration,
    httpRequestsTotal,
    activeUsers,
    tasksTotal,
    projectsTotal,
    teamsTotal,
    notificationsTotal,
    userActivityTotal,
    mongoConnections,
    responseTime
  }
};
