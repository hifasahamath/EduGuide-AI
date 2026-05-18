const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/profile/:id', authController.getProfile);
router.put('/profile/:id', authController.updateProfile);
router.put('/profile/:id/password', authController.changePassword);
router.put('/profile/:id/ai-settings', authController.updateAiSettings);
router.put('/profile/:id/notifications', authController.updateNotifications);
router.put('/profile/:id/contact', authController.updateContact);
router.get('/profile/:id/activity', authController.getActivityLog);
router.post('/profile/:id/activity', authController.logActivity);

module.exports = router;
