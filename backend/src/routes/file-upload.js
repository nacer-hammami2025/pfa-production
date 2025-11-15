const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Task = require('../models/Task');

// Configuration du stockage multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../uploads');
    
    // Créer le dossier uploads s'il n'existe pas
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Filtrage des types de fichiers
const fileFilter = (req, file, cb) => {
  // Types acceptés
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb('Erreur: Type de fichier non supporté!');
  }
};

// Configuration de multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 10MB limite
  fileFilter: fileFilter
});

// Upload de fichier pour une tâche
router.post('/upload/:taskId', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      // Supprimer le fichier uploadé si la tâche n'existe pas
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }

    // Vérifier que l'utilisateur a le droit de modifier cette tâche
    if (task.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    // Ajouter le fichier à la tâche
    if (!task.attachments) {
      task.attachments = [];
    }

    const attachment = {
      filename: req.file.originalname,
      filepath: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date()
    };

    task.attachments.push(attachment);
    await task.save();

    res.json({
      message: 'Fichier uploadé avec succès',
      attachment: attachment
    });
  } catch (error) {
    // Nettoyer le fichier en cas d'erreur
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: error.message });
  }
});

// Télécharger un fichier
router.get('/download/:taskId/:filename', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }

    // Vérifier l'accès
    if (task.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const attachment = task.attachments.find(a => a.filepath === req.params.filename);
    if (!attachment) {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }

    const filepath = path.join(__dirname, '../../uploads', req.params.filename);
    
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'Fichier physique non trouvé' });
    }

    res.download(filepath, attachment.filename);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Supprimer un fichier
router.delete('/delete/:taskId/:filename', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }

    // Vérifier l'accès
    if (task.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    const attachmentIndex = task.attachments.findIndex(a => a.filepath === req.params.filename);
    if (attachmentIndex === -1) {
      return res.status(404).json({ message: 'Fichier non trouvé' });
    }

    // Supprimer le fichier physique
    const filepath = path.join(__dirname, '../../uploads', req.params.filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Retirer de la base de données
    task.attachments.splice(attachmentIndex, 1);
    await task.save();

    res.json({ message: 'Fichier supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Lister tous les fichiers d'une tâche
router.get('/list/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }

    // Vérifier l'accès
    if (task.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    res.json({ attachments: task.attachments || [] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload multiple fichiers
router.post('/upload-multiple/:taskId', auth, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Aucun fichier fourni' });
    }

    const task = await Task.findById(req.params.taskId);
    
    if (!task) {
      // Supprimer tous les fichiers uploadés
      req.files.forEach(file => fs.unlinkSync(file.path));
      return res.status(404).json({ message: 'Tâche non trouvée' });
    }

    // Vérifier l'accès
    if (task.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      req.files.forEach(file => fs.unlinkSync(file.path));
      return res.status(403).json({ message: 'Accès non autorisé' });
    }

    // Initialiser le tableau des pièces jointes si nécessaire
    if (!task.attachments) {
      task.attachments = [];
    }

    // Ajouter tous les fichiers
    const newAttachments = req.files.map(file => ({
      filename: file.originalname,
      filepath: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      uploadedAt: new Date()
    }));

    task.attachments.push(...newAttachments);
    await task.save();

    res.json({
      message: `${req.files.length} fichier(s) uploadé(s) avec succès`,
      attachments: newAttachments
    });
  } catch (error) {
    // Nettoyer tous les fichiers en cas d'erreur
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
