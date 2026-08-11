const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authenticateUser = require('../middleware/auth');

// Apply auth middleware to all profile routes
router.use('/profile', authenticateUser);

router.get('/profile/:id', authController.getProfile);
router.put('/profile/:id', authController.updateProfile);
router.put('/profile/:id/password', authController.updatePassword);
router.put('/profile/:id/ai-settings', authController.updateAiSettings);
router.put('/profile/:id/notifications', authController.updateNotifications);
router.put('/profile/:id/contact', authController.updateContact);
router.get('/profile/:id/activity', authController.getActivityLog);
router.post('/profile/:id/activity', authController.logActivity);

module.exports = router;
