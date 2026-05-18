const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseConfig');
const dbService = require('../services/dbService');

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Derive engagement score and active status from sessions */
const enrichUser = async (user) => {
  try {
    // Count all sessions for this user
    const sessionsSnap = await db.collection('chat_sessions').where('userId', '==', user.id).get();
    const sessions = sessionsSnap.docs.map(d => d.data());

    const totalChats = sessions.length;
    const totalMessages = sessions.reduce((a, s) => a + (s.messages?.length || 0), 0);

    // Most recent session
    sessions.sort((a, b) => {
      const ta = a.updatedAt?._seconds || a.createdAt?._seconds || 0;
      const tb = b.updatedAt?._seconds || b.createdAt?._seconds || 0;
      return tb - ta;
    });
    const lastSession = sessions[0];
    const lastActive = lastSession?.updatedAt || lastSession?.createdAt || null;

    // Extract last query and most searched topic
    const allMsgs = sessions.flatMap(s => s.messages || []);
    const userMsgs = allMsgs.filter(m => m.sender === 'user' || m.role === 'user').map(m => m.text);
    const lastQuery = userMsgs[userMsgs.length - 1] || null;

    // Most searched field from context
    const fieldCounts = {};
    sessions.forEach(s => {
      const field = s.context?.lastField;
      if (field) fieldCounts[field] = (fieldCounts[field] || 0) + 1;
    });
    const mostSearchedTopic = Object.entries(fieldCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    // Engagement score (0–100): based on chats + messages + recency
    const now = Date.now();
    const lastMs = lastActive?._seconds ? lastActive._seconds * 1000 : null;
    const daysSinceActive = lastMs ? Math.floor((now - lastMs) / 86400000) : 999;
    const recencyScore = Math.max(0, 40 - daysSinceActive * 4);
    const chatScore = Math.min(30, totalChats * 3);
    const msgScore = Math.min(30, Math.floor(totalMessages / 2));
    const engagementScore = Math.min(100, recencyScore + chatScore + msgScore);

    const isActive = daysSinceActive <= 7;

    // Activity log (last login device)
    let lastLogin = null, lastDevice = null;
    try {
      const actSnap = await db.collection('users').doc(user.id).collection('activity').get();
      const loginLogs = actSnap.docs
        .map(d => d.data())
        .filter(a => a.type === 'login')
        .sort((a, b) => {
          const ta = a.timestamp?._seconds || 0;
          const tb = b.timestamp?._seconds || 0;
          return tb - ta;
        });
      if (loginLogs[0]) {
        lastLogin = loginLogs[0].timestamp;
        lastDevice = loginLogs[0].device || null;
      }
    } catch { /* non-critical */ }

    // AI course suggestions based on most searched field
    const suggestedCourses = [];
    if (mostSearchedTopic) {
      try {
        const coursesSnap = await db.collection('courses')
          .where('field', '==', mostSearchedTopic)
          .get();
        coursesSnap.docs.slice(0, 3).forEach(d => suggestedCourses.push({ id: d.id, ...d.data() }));
      } catch { /* non-critical */ }
    }

    return {
      ...user,
      totalChats,
      totalMessages,
      lastActive,
      lastQuery,
      mostSearchedTopic,
      engagementScore,
      isActive,
      lastLogin,
      lastDevice,
      suggestedCourses,
    };
  } catch {
    return { ...user, totalChats: 0, totalMessages: 0, engagementScore: 0, isActive: false };
  }
};

// ── GET /api/users — list all users with basic enrichment ─────────────────────
router.get('/', async (req, res) => {
  try {
    const users = await dbService.getAllUsers();
    // Enrich in parallel (limit concurrency for large user sets)
    const enriched = await Promise.all(users.map(u => enrichUser(u)));
    res.json(enriched);
  } catch (err) {
    console.error('getUsers error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── GET /api/users/:id — single user full profile ─────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const user = await dbService.getUserProfile(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    delete user.password;
    const enriched = await enrichUser(user);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ── PUT /api/users/:id — update user fields ───────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, role, preferences } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (email !== undefined) update.email = email;
    if (phone !== undefined) update.phone = phone;
    if (role !== undefined) update.role = role;
    if (preferences !== undefined) update.preferences = preferences;
    update.updatedAt = new Date();

    await db.collection('users').doc(req.params.id).update(update);
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// ── PATCH /api/users/:id/block — toggle blocked ───────────────────────────────
router.patch('/:id/block', async (req, res) => {
  try {
    const { blocked } = req.body;
    await db.collection('users').doc(req.params.id).update({ blocked: !!blocked, updatedAt: new Date() });
    res.json({ message: blocked ? 'User blocked' : 'User unblocked' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update block status' });
  }
});

// ── PATCH /api/users/:id/role — change role ───────────────────────────────────
router.patch('/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'student', 'client'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
    await db.collection('users').doc(req.params.id).update({ role, updatedAt: new Date() });
    res.json({ message: 'Role updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// ── DELETE /api/users/:id ─────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await db.collection('users').doc(req.params.id).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
