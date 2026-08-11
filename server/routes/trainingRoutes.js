const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const authenticateUser = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../middleware/upload');

// All training routes require admin auth
router.use(authenticateUser, adminAuth);

// Q&A Training
router.get('/pending', trainingController.getPending);
router.get('/trained', trainingController.getTrained);
router.post('/add', trainingController.addPending);
router.post('/respond', trainingController.respond);
router.delete('/:id', trainingController.deleteTraining);

// Document Uploads (Multi-modal)
router.get('/documents', trainingController.getDocuments);
router.post('/documents/upload', upload.single('file'), trainingController.uploadDocument);
router.delete('/documents/:id', trainingController.deleteDocument);

module.exports = router;
