const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticateUser = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.use(authenticateUser);

router.post('/', chatController.handleChat);
router.get('/history', chatController.getChatHistory);
router.post('/sessions', chatController.createSession);
router.get('/sessions', chatController.getChatHistory); // Same as history
router.get('/sessions/:chatId', chatController.getSession);
router.delete('/sessions/:chatId', chatController.deleteSession);
router.patch('/sessions/:chatId/rename', chatController.renameSession);
router.patch('/sessions/:chatId/pin', chatController.pinSession);

// Admin Routes
router.get('/admin/sessions', adminAuth, chatController.getAllSessions);
router.patch('/admin/sessions/:chatId/resolve', adminAuth, chatController.markResolved);

module.exports = router;
