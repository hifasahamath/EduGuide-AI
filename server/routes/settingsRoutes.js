const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseConfig');

const COL = 'user_settings';

// GET /api/settings/:userId
router.get('/:userId', async (req, res) => {
  try {
    const doc = await db.collection(COL).doc(req.params.userId).get();
    res.json(doc.exists ? doc.data() : {});
  } catch { res.status(500).json({ error: 'Failed to load settings' }); }
});

// PUT /api/settings/:userId
router.put('/:userId', async (req, res) => {
  try {
    await db.collection(COL).doc(req.params.userId).set({ ...req.body, updatedAt: new Date() }, { merge: true });
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to save settings' }); }
});

// DELETE /api/settings/:userId/chats — clear all chats
router.delete('/:userId/chats', async (req, res) => {
  try {
    const snap = await db.collection('chat_sessions').where('userId', '==', req.params.userId).get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
    res.json({ success: true, deleted: snap.size });
  } catch { res.status(500).json({ error: 'Failed to clear chats' }); }
});

module.exports = router;
