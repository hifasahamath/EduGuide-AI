const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authenticateUser = require('../middleware/auth');

router.use(authenticateUser);

router.get('/:userId', settingsController.getSettings);
router.put('/:userId', settingsController.saveSettings);
router.delete('/:userId/chats', settingsController.clearAllChats);
router.get('/:userId/export', settingsController.exportData);

module.exports = router;
