const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const authenticateUser = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

router.get('/', courseController.getCourses);

// Admin only routes
router.use(authenticateUser, adminAuth);
router.post('/', courseController.addCourse);
router.put('/:id', courseController.updateCourse);
router.delete('/:id', courseController.deleteCourse);
router.post('/bulk', courseController.bulkImportCourses);

module.exports = router;
