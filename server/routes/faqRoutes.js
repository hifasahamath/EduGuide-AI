const express = require('express');
const router = express.Router();
const faqController = require('../controllers/faqController');
const authenticateUser = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.get('/', faqController.getFaqs);
router.get('/suggest', faqController.suggestFaq);
router.patch('/:id/increment', faqController.incrementAskCount);

// Admin only
router.use(authenticateUser, adminAuth);
router.post('/', faqController.addFaq);
router.get('/analytics', faqController.getAnalytics);
router.put('/:id', faqController.updateFaq);
router.delete('/:id', faqController.deleteFaq);

module.exports = router;
