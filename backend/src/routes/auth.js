const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const { trackUserActivity } = require('../middleware/metrics');

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

    const { name, email, password } = req.body; // Remove role from user input for security
    const role = 'user'; // Force default role to 'user' for security - only admins can create admin accounts
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
          trackUserActivity('register');
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

      // VALIDATION CRITIQUE: Vérifier que le rôle demandé correspond au rôle réel
      if (requestedRole && requestedRole !== user.role) {
        console.log('[LOGIN] ❌ SECURITY BREACH ATTEMPT - User:', email, 'Real role:', user.role, 'Requested role:', requestedRole);
        return res.status(403).json({ 
          errors: [{ 
            msg: 'Accès refusé. Vous ne pouvez pas vous connecter avec ce type de compte.',
            details: `Votre compte est de type "${user.role}" mais vous tentez de vous connecter comme "${requestedRole}".`
          }] 
        });
      }

      // Vérifier si MFA est activé
      if (user.mfaEnabled && user.mfaSecret) {
        console.log('[LOGIN] MFA required for:', email);
        return res.json({
          mfaRequired: true,
          user: { id: user.id, name: user.name, email: user.email, role: user.role },
          message: 'MFA verification required'
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
          trackUserActivity('login');
          res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
        }
      );
    } catch (err) {
      console.error('[LOGIN] Error:', err.message);
      res.status(500).json({ message: 'Server error', details: err.message });
    }
  }
);

// Middleware pour vérifier le token JWT
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// GET /api/auth/me - Get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// POST /api/auth/setup-mfa
router.post('/setup-mfa', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Générer un secret TOTP
    const secret = speakeasy.generateSecret({
      name: `PFA App (${user.email})`,
      issuer: 'PFA Productivity'
    });

    // Sauvegarder temporairement le secret
    user.mfaTempSecret = secret.base32;
    await user.save();

    // Générer le QR code
    const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

    res.json({
      message: 'MFA setup initiated',
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntry: secret.base32
    });
  } catch (err) {
    console.error('MFA setup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/verify-mfa
router.post('/verify-mfa', auth, async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'MFA token is required' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.mfaTempSecret) {
      return res.status(400).json({ message: 'MFA setup not initiated' });
    }

    // Vérifier le token
    const verified = speakeasy.totp.verify({
      secret: user.mfaTempSecret,
      encoding: 'base32',
      token: token,
      window: 2 // Tolérance de 2 périodes (30 secondes)
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid MFA token' });
    }

    // Activer le MFA
    user.mfaEnabled = true;
    user.mfaSecret = user.mfaTempSecret;
    user.mfaTempSecret = '';
    await user.save();

    res.json({ message: 'MFA enabled successfully' });
  } catch (err) {
    console.error('MFA verification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/disable-mfa
router.post('/disable-mfa', auth, async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: 'Password is required to disable MFA' });
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // Désactiver le MFA
    user.mfaEnabled = false;
    user.mfaSecret = '';
    user.mfaTempSecret = '';
    await user.save();

    res.json({ message: 'MFA disabled successfully' });
  } catch (err) {
    console.error('MFA disable error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/auth/verify-mfa-login
router.post('/verify-mfa-login', async (req, res) => {
  const { email, mfaToken } = req.body;

  if (!email || !mfaToken) {
    return res.status(400).json({ message: 'Email and MFA token are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!user.mfaEnabled || !user.mfaSecret) {
      return res.status(400).json({ message: 'MFA not enabled for this account' });
    }

    // Vérifier le token MFA
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token: mfaToken,
      window: 2 // Tolérance de 2 périodes (30 secondes)
    });

    if (!verified) {
      return res.status(400).json({ message: 'Invalid MFA token' });
    }

    // Générer le token JWT final
    const payload = { user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('MFA login verification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// OAuth Routes

// Google OAuth configuration
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

// Google OAuth Client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { token, action = 'login' } = req.body;
  
  if (!token) {
    return res.status(400).json({ errors: [{ msg: 'Google token is required' }] });
  }

  try {
    console.log('[GOOGLE_OAUTH] Processing Google OAuth request, action:', action);
    
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.status(400).json({ errors: [{ msg: 'Email not found in Google profile' }] });
    }

    // Check if user exists
    let user = await User.findOne({ 
      $or: [
        { email },
        { googleId }
      ]
    });

    if (action === 'register') {
      if (user) {
        return res.status(400).json({ 
          errors: [{ msg: 'Un compte existe déjà avec cette adresse email' }] 
        });
      }

      // Create new user for registration
      user = new User({
        name,
        email,
        googleId,
        avatar: picture,
        role: 'user',
        password: 'oauth_google', // Placeholder password for OAuth users
        emailVerified: true // Google emails are already verified
      });

      // Hash placeholder password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      
      await user.save();
      console.log('[GOOGLE_OAUTH] ✅ User registered via Google:', email);
    } else {
      // Login action
      if (!user) {
        return res.status(400).json({ 
          errors: [{ msg: 'Aucun compte trouvé. Veuillez vous inscrire d\'abord.' }] 
        });
      }

      // Update Google ID if not set
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      
      console.log('[GOOGLE_OAUTH] ✅ User logged in via Google:', email);
    }

    // Generate JWT token
    const jwtPayload = { 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    };
    
    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token: jwtToken,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        avatar: user.avatar 
      }
    });
  } catch (err) {
    console.error('[GOOGLE_OAUTH] Error:', err);
    if (err.message.includes('Invalid token')) {
      return res.status(400).json({ errors: [{ msg: 'Token Google invalide' }] });
    }
    res.status(500).json({ errors: [{ msg: 'Erreur serveur lors de l\'authentification Google' }] });
  }
});

// POST /api/auth/microsoft
router.post('/microsoft', async (req, res) => {
  const { code, action = 'login' } = req.body;
  
  if (!code) {
    return res.status(400).json({ errors: [{ msg: 'Microsoft authorization code is required' }] });
  }

  try {
    console.log('[MICROSOFT_OAUTH] Processing Microsoft OAuth request, action:', action);
    
    // Exchange authorization code for access token
    const tokenResponse = await axios.post('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: `${process.env.CLIENT_URL}/oauth/callback`
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token } = tokenResponse.data;

    // Get user info from Microsoft Graph API
    const userResponse = await axios.get('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const { id: microsoftId, displayName: name, mail: email, userPrincipalName } = userResponse.data;
    const userEmail = email || userPrincipalName;

    if (!userEmail) {
      return res.status(400).json({ errors: [{ msg: 'Email not found in Microsoft profile' }] });
    }

    // Check if user exists
    let user = await User.findOne({ 
      $or: [
        { email: userEmail },
        { microsoftId }
      ]
    });

    if (action === 'register') {
      if (user) {
        return res.status(400).json({ 
          errors: [{ msg: 'Un compte existe déjà avec cette adresse email' }] 
        });
      }

      // Create new user for registration
      user = new User({
        name,
        email: userEmail,
        microsoftId,
        role: 'user',
        password: 'oauth_microsoft', // Placeholder password for OAuth users
        emailVerified: true // Microsoft emails are already verified
      });

      // Hash placeholder password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt);
      
      await user.save();
      console.log('[MICROSOFT_OAUTH] ✅ User registered via Microsoft:', userEmail);
    } else {
      // Login action
      if (!user) {
        return res.status(400).json({ 
          errors: [{ msg: 'Aucun compte trouvé. Veuillez vous inscrire d\'abord.' }] 
        });
      }

      // Update Microsoft ID if not set
      if (!user.microsoftId) {
        user.microsoftId = microsoftId;
        await user.save();
      }
      
      console.log('[MICROSOFT_OAUTH] ✅ User logged in via Microsoft:', userEmail);
    }

    // Generate JWT token
    const jwtPayload = { 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      } 
    };
    
    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token: jwtToken,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role 
      }
    });
  } catch (err) {
    console.error('[MICROSOFT_OAUTH] Error:', err);
    if (err.response) {
      console.error('[MICROSOFT_OAUTH] Response error:', err.response.data);
    }
    res.status(500).json({ errors: [{ msg: 'Erreur serveur lors de l\'authentification Microsoft' }] });
  }
});

module.exports = router;
