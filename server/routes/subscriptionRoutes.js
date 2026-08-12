const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const authenticateUser = require('../middleware/auth');

router.use(authenticateUser);

router.get('/', subscriptionController.getPlans);
router.post('/', subscriptionController.createPlan);
router.put('/:id', subscriptionController.updatePlan);
router.delete('/:id', subscriptionController.deletePlan);

module.exports = router;
