const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');

// Store reset tokens temporarily (in production, use Redis or database)
const resetTokens = new Map();

// POST /api/auth/forgot-password
router.post(
  '/forgot-password',
  [
    check('email', 'Please include a valid email').isEmail(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: 'If an account with this email exists, a password reset link has been sent.' });
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Store token temporarily
      resetTokens.set(resetToken, { userId: user.id, email: user.email, expires: Date.now() + 3600000 });

      // In a real application, you would send an email here
      // For now, we'll just return the token for testing purposes
      console.log(`Password reset token for ${email}: ${resetToken}`);

      res.json({
        message: 'If an account with this email exists, a password reset link has been sent.',
        resetToken: resetToken // Remove this in production
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    check('token', 'Reset token is required').exists(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;
    try {
      // Check if token exists and is valid
      const tokenData = resetTokens.get(token);
      if (!tokenData || tokenData.expires < Date.now()) {
        return res.status(400).json({ errors: [{ msg: 'Invalid or expired reset token' }] });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded || decoded.userId !== tokenData.userId) {
        return res.status(400).json({ errors: [{ msg: 'Invalid reset token' }] });
      }

      // Update user password
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(400).json({ errors: [{ msg: 'User not found' }] });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      // Remove used token
      resetTokens.delete(token);

      res.json({ message: 'Password has been reset successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// POST /api/auth/register
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
  ],
  async (req, res) => {
    console.log('[REGISTER] Request received:', { name: req.body.name, email: req.body.email });
    
    // Check database connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('[REGISTER] Database not connected, readyState:', mongoose.connection.readyState);
      return res.status(503).json({ 
        message: 'Service temporarily unavailable - database connection error',
        details: 'Database connection not ready' 
      });
    }
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('[REGISTER] Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, role = 'user' } = req.body; // Default role is 'user'
    try {
      let user = await User.findOne({ email });
      if (user) {
        console.log('[REGISTER] User already exists:', email);
        return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      }

      user = new User({ name, email, password, role });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();
      
      console.log('[REGISTER] ✅ User created successfully:', email);

      const payload = { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' },
        (err, token) => {
          if (err) {
            console.error('[REGISTER] JWT error:', err);
            throw err;
          }
          console.log('[REGISTER] ✅ Token generated successfully');
          res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
        }
      );
    } catch (err) {
      console.error('[REGISTER] Error:', err.message);
      res.status(500).json({ message: 'Server error', details: err.message });
    }
  }
);

// POST /api/auth/login
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, requestedRole } = req.body;
    console.log('[LOGIN] Request received for:', email, '| Requested role:', requestedRole);
    
    // Check database connection
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.error('[LOGIN] Database not connected, readyState:', mongoose.connection.readyState);
      return res.status(503).json({ 
        message: 'Service temporarily unavailable - database connection error',
        details: 'Database connection not ready' 
      });
    }
    console.log('[LOGIN] Request received for:', email, '| Requested role:', requestedRole);
    
    try {
      const user = await User.findOne({ email });
      if (!user) {
        console.log('[LOGIN] User not found:', email);
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log('[LOGIN] Invalid password for:', email);
        return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      }

      // SÉCURITÉ CRITIQUE: Vérifier que le rôle demandé correspond au rôle réel
      if (requestedRole && requestedRole !== user.role) {
        console.log('[LOGIN] ⛔ ROLE MISMATCH: User', email, 'has role', user.role, 'but requested', requestedRole);
        return res.status(403).json({ 
          errors: [{ 
            msg: requestedRole === 'admin' 
              ? 'Accès refusé. Vous n\'avez pas les privilèges administrateur.' 
              : 'Ce compte est un compte administrateur. Veuillez utiliser l\'interface admin.'
          }] 
        });
      }

      const payload = { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' },
        (err, token) => {
          if (err) {
            console.error('[LOGIN] JWT Error:', err);
            return res.status(500).json({ message: 'Token generation error' });
          }
          console.log('[LOGIN] ✅ Login successful for:', email);
          res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
        }
      );
    } catch (err) {
      console.error('[LOGIN] Error:', err.message);
      res.status(500).json({ message: 'Server error', details: err.message });
    }
  }
);

module.exports = router;
