const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const auth = require('../middleware/auth');

// Multer configuration for photo uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads/profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Upload profile photo
router.post('/profile/photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const photoUrl = `/uploads/profiles/${req.file.filename}`;
    
    await User.findByIdAndUpdate(req.user.id, { photoUrl });

    res.json({ 
      message: 'Photo uploaded successfully',
      photoUrl 
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ message: 'Error uploading photo' });
  }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
});

// Get MFA status
router.get('/mfa/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json({ enabled: user.mfaEnabled || false });
  } catch (error) {
    console.error('Error checking MFA status:', error);
    res.status(500).json({ message: 'Error checking MFA status' });
  }
});

// Setup MFA (generate QR code)
router.post('/mfa/setup', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `PFA App (${user.email})`
    });

    // Store temporary secret (not yet enabled)
    user.mfaTempSecret = secret.base32;
    await user.save();

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode
    });
  } catch (error) {
    console.error('Error setting up MFA:', error);
    res.status(500).json({ message: 'Error setting up MFA' });
  }
});

// Verify and enable MFA
router.post('/mfa/verify', auth, async (req, res) => {
  try {
    const { token, secret } = req.body;

    if (!token || !secret) {
      return res.status(400).json({ message: 'Token and secret are required' });
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Enable MFA
    const user = await User.findById(req.user.id);
    user.mfaSecret = secret;
    user.mfaEnabled = true;
    user.mfaTempSecret = undefined;
    await user.save();

    res.json({ message: 'MFA enabled successfully' });
  } catch (error) {
    console.error('Error verifying MFA:', error);
    res.status(500).json({ message: 'Error verifying MFA' });
  }
});

// Disable MFA
router.post('/mfa/disable', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    await user.save();

    res.json({ message: 'MFA disabled successfully' });
  } catch (error) {
    console.error('Error disabling MFA:', error);
    res.status(500).json({ message: 'Error disabling MFA' });
  }
});

// Update profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, bio, preferences } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (bio) updateData.bio = bio;

    // Handle preferences update
    if (preferences) {
      // Get current user to preserve existing preferences
      const currentUser = await User.findById(req.user.id);
      updateData.preferences = { ...currentUser.preferences };
      
      if (preferences.theme) updateData.preferences.theme = preferences.theme;
      if (preferences.notifications) {
        updateData.preferences.notifications = { 
          ...updateData.preferences.notifications, 
          ...preferences.notifications 
        };
      }
      if (preferences.timezone) updateData.preferences.timezone = preferences.timezone;
      if (preferences.language) updateData.preferences.language = preferences.language;
      if (preferences.autoSave !== undefined) updateData.preferences.autoSave = preferences.autoSave;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password -mfaSecret');

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Get profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -mfaSecret');
    res.json({ user });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ message: 'Error getting profile' });
  }
});

module.exports = router;
