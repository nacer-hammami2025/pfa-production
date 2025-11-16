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
  labelNames: ['status'] // completed, pending, in_progress
});

const projectsTotal = new promClient.Gauge({
  name: 'pfa_projects_total',
  help: 'Total number of projects in the system'
});

const mongoConnections = new promClient.Gauge({
  name: 'mongodb_connections_current',
  help: 'Current MongoDB connections'
});

const responseTime = new promClient.Histogram({
  name: 'pfa_response_time_seconds',
  help: 'Response time for PFA operations',
  labelNames: ['operation']
});

// Register the custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestsTotal);
register.registerMetric(activeUsers);
register.registerMetric(tasksTotal);
register.registerMetric(projectsTotal);
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
    
    // Update task metrics
    const Task = require('../models/Task');
    if (mongoose.connection.readyState === 1) {
      const completedTasks = await Task.countDocuments({ completed: true });
      const pendingTasks = await Task.countDocuments({ completed: false });
      
      tasksTotal.labels('completed').set(completedTasks);
      tasksTotal.labels('pending').set(pendingTasks);
    }
    
    // Update project metrics
    const Project = require('../models/Project');
    if (mongoose.connection.readyState === 1) {
      const totalProjects = await Project.countDocuments();
      projectsTotal.set(totalProjects);
    }
    
    // MongoDB connection metrics
    if (mongoose.connection.readyState === 1) {
      mongoConnections.set(mongoose.connection.readyState);
    }
    
  } catch (error) {
    console.error('Error updating business metrics:', error);
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

module.exports = {
  register,
  metricsMiddleware,
  metricsHandler,
  metrics: {
    httpRequestDuration,
    httpRequestsTotal,
    activeUsers,
    tasksTotal,
    projectsTotal,
    mongoConnections,
    responseTime
  }
};