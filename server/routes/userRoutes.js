const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticateUser = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.use(authenticateUser, adminAuth);

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);
router.put('/:id', userController.updateUser);
router.patch('/:id/block', userController.blockUser);
router.patch('/:id/role', userController.changeRole);
router.delete('/:id', userController.deleteUser);

module.exports = router;
