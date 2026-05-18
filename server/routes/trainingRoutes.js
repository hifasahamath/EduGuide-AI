const express = require('express');
const router = express.Router();
const { trainingService } = require('../services/trainingService');

// GET /api/training/pending — all pending unanswered questions
router.get('/pending', async (req, res) => {
  try {
    const pending = await trainingService.getPending();
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending training' });
  }
});

// GET /api/training/trained — all trained Q&A pairs
router.get('/trained', async (req, res) => {
  try {
    const trained = await trainingService.getTrained();
    res.json(trained);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trained data' });
  }
});

// POST /api/training/respond — admin provides answer → marks as trained
router.post('/respond', async (req, res) => {
  try {
    const { id, response } = req.body;
    if (!id || !response?.trim()) {
      return res.status(400).json({ error: 'Missing id or response' });
    }
    const ok = await trainingService.markTrained(id, response);
    if (ok) res.json({ success: true, message: 'Answer saved! The chatbot will now use this response.' });
    else res.status(500).json({ error: 'Failed to save response' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to respond to training' });
  }
});

// DELETE /api/training/:id — delete a training entry
router.delete('/:id', async (req, res) => {
  try {
    const ok = await trainingService.deleteTraining(req.params.id);
    res.json({ success: ok });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete training entry' });
  }
});

module.exports = router;
