const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authenticateUser = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Optional auth middleware for chat message generation (allows guest exploration)
const authenticateOptional = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ') || req.body?.isGuest || req.body?.userId === 'guest') {
    req.user = { id: 'guest', role: 'user', isGuest: true, ai_settings: { llmProvider: 'gemini', mode: 'smart' } };
    return next();
  }
  return authenticateUser(req, res, next);
};

// Chat generation (accessible to registered users and guests)
router.post('/', authenticateOptional, chatController.handleChat);

// Database-persisted session management (requires authenticated user)
router.get('/history', authenticateUser, chatController.getChatHistory);
router.post('/sessions', authenticateUser, chatController.createSession);
router.get('/sessions', authenticateUser, chatController.getChatHistory); // Same as history
router.get('/sessions/:chatId', authenticateUser, chatController.getSession);
router.delete('/sessions/:chatId', authenticateUser, chatController.deleteSession);
router.patch('/sessions/:chatId/rename', authenticateUser, chatController.renameSession);
router.patch('/sessions/:chatId/pin', authenticateUser, chatController.pinSession);

// Admin Routes
router.get('/admin/sessions', authenticateUser, adminAuth, chatController.getAllSessions);
router.patch('/admin/sessions/:chatId/resolve', authenticateUser, adminAuth, chatController.markResolved);

module.exports = router;

