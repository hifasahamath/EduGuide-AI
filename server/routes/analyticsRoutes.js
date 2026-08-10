const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authenticateUser = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.use(authenticateUser, adminAuth);

router.get('/', analyticsController.getLegacyCounts);
router.get('/dashboard', analyticsController.getDashboard);
router.get('/insights', analyticsController.getInsights);

module.exports = router;
