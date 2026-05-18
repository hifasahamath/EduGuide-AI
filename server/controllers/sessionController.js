/**
 * Session Controller — manages independent chat sessions in Firestore
 * Collection: chat_sessions/{chatId}
 *   - userId, title, createdAt, updatedAt, context, messages[]
 */

const { db } = require('../config/firebaseConfig');
const { v4: uuidv4 } = require('uuid');
const { trainingService } = require('../services/trainingService');

const SESSIONS = 'chat_sessions';

/** Create a new empty chat session */
const createSession = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const chatId = uuidv4();
    const now = new Date();

    await db.collection(SESSIONS).doc(chatId).set({
      chatId,
      userId,
      title: 'New Chat',
      createdAt: now,
      updatedAt: now,
      context: { lastIntent: null, lastCourse: null, lastCourses: [], lastField: null },
      messages: [],
      status: 'active'
    });

    res.json({ chatId, title: 'New Chat', createdAt: now });
  } catch (err) {
    console.error('createSession error:', err);
    res.status(500).json({ error: 'Failed to create session' });
  }
};

/** Get all sessions for a user (latest first) */
const getSessions = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const snapshot = await db.collection(SESSIONS)
      .where('userId', '==', userId)
      .limit(50)
      .get();

    const sessions = snapshot.docs
      .map(doc => {
        const d = doc.data();
        const msgs = d.messages || [];
        const lastUserMsg = [...msgs].reverse().find(m => m.sender === 'user' || m.role === 'user');
        const lastBotMsg = [...msgs].reverse().find(m => m.sender === 'bot' || m.role === 'ai');
        return {
          chatId: doc.id,
          title: d.title || 'New Chat',
          createdAt: d.createdAt,
          updatedAt: d.updatedAt,
          messageCount: msgs.length,
          pinned: d.pinned || false,
          lastPreview: lastUserMsg?.text || '',
          lastBotPreview: lastBotMsg?.text?.slice(0, 120) || '',
        };
      })
      .sort((a, b) => {
        // Pinned first, then by updatedAt
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        const ta = a.updatedAt?._seconds || 0;
        const tb = b.updatedAt?._seconds || 0;
        return tb - ta;
      });

    res.json(sessions);
  } catch (err) {
    console.error('getSessions error:', err);
    res.status(500).json({ error: 'Failed to load sessions' });
  }
};

/** [ADMIN] Get ALL sessions across all users with filters + stats */
const getAllSessions = async (req, res) => {
  try {
    const { dateFilter, statusFilter } = req.query;
    const snapshot = await db.collection(SESSIONS).get();
    const now = Date.now();
    const dayMs = 86400000;

    let sessions = snapshot.docs.map(doc => {
      const d = doc.data();
      const msgs = d.messages || [];
      const lastMsg = msgs[msgs.length - 1];

      // Spam: user sent same message 3+ times
      const userMsgs = msgs
        .filter(m => m.sender === 'user' || m.role === 'user')
        .map(m => m.text?.toLowerCase().trim());
      const freq = {};
      userMsgs.forEach(t => { if (t) freq[t] = (freq[t] || 0) + 1; });
      const isSpam = Object.values(freq).some(c => c >= 3);

      // Status
      const hasFallback = msgs.some(m => m.intent === 'fallback');
      const status = d.status === 'resolved' ? 'resolved'
        : hasFallback ? 'failed'
          : msgs.length > 1 ? 'resolved'
            : 'pending';

      const detectedField = d.context?.lastField || msgs.find(m => m.detectedField)?.detectedField || null;
      const detectedCourse = d.context?.lastCourse || msgs.find(m => m.detectedCourse)?.detectedCourse || null;

      return {
        chatId: doc.id,
        userId: d.userId || 'anonymous',
        title: d.title || 'New Chat',
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
        messageCount: msgs.length,
        lastMessage: lastMsg?.text || '',
        lastSender: lastMsg?.sender || lastMsg?.role || '',
        status,
        isSpam,
        detectedField,
        detectedCourse,
        messages: msgs,
      };
    });

    // Date filter
    const filterByDate = (sessions, cutoff) => sessions.filter(s => {
      const ts = s.createdAt?._seconds ? s.createdAt._seconds * 1000 : null;
      return ts && ts >= cutoff;
    });
    if (dateFilter === 'today') {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      sessions = filterByDate(sessions, start.getTime());
    } else if (dateFilter === 'week') {
      sessions = filterByDate(sessions, now - 7 * dayMs);
    } else if (dateFilter === 'month') {
      sessions = filterByDate(sessions, now - 30 * dayMs);
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      sessions = sessions.filter(s => s.status === statusFilter);
    }

    // Sort latest first
    sessions.sort((a, b) => {
      const ta = a.updatedAt?._seconds || a.createdAt?._seconds || 0;
      const tb = b.updatedAt?._seconds || b.createdAt?._seconds || 0;
      return tb - ta;
    });

    // Stats across ALL sessions (unfiltered)
    const allSessions = snapshot.docs.map(d => d.data());
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const chatsToday = allSessions.filter(s => {
      const ts = s.createdAt?._seconds ? s.createdAt._seconds * 1000 : null;
      return ts && ts >= todayStart.getTime();
    }).length;
    const totalMsgs = allSessions.reduce((acc, s) => acc + (s.messages?.length || 0), 0);
    const avgMsgs = allSessions.length > 0 ? (totalMsgs / allSessions.length).toFixed(1) : 0;

    res.json({
      sessions,
      stats: {
        total: snapshot.size,
        chatsToday,
        avgMsgsPerChat: parseFloat(avgMsgs),
        spamCount: sessions.filter(s => s.isSpam).length,
        activeUsers: new Set(snapshot.docs.map(d => d.data().userId).filter(Boolean)).size,
      }
    });
  } catch (err) {
    console.error('getAllSessions error:', err);
    res.status(500).json({ error: 'Failed to load sessions' });
  }
};

/** [ADMIN] Mark a session as resolved */
const markResolved = async (req, res) => {
  try {
    const { chatId } = req.params;
    await db.collection(SESSIONS).doc(chatId).update({ status: 'resolved', updatedAt: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark resolved' });
  }
};

/** [ADMIN] Send a message to the training queue */
const sendToTraining = async (req, res) => {
  try {
    const { question, intent } = req.body;
    if (!question) return res.status(400).json({ error: 'question required' });
    const id = await trainingService.storeUnknown(question, intent || null);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send to training' });
  }
};

/** Get a single session with all messages */
const getSession = async (req, res) => {
  try {
    const { chatId } = req.params;
    const doc = await db.collection(SESSIONS).doc(chatId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Session not found' });
    res.json(doc.data());
  } catch (err) {
    res.status(500).json({ error: 'Failed to load session' });
  }
};

/** Delete a session */
const deleteSession = async (req, res) => {
  try {
    const { chatId } = req.params;
    await db.collection(SESSIONS).doc(chatId).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
};

/** Rename a session */
const renameSession = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;
    await db.collection(SESSIONS).doc(chatId).update({ title, updatedAt: new Date() });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to rename session' });
  }
};

/** Pin / Unpin a session */
const pinSession = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { pinned } = req.body;
    await db.collection(SESSIONS).doc(chatId).update({ pinned: !!pinned, updatedAt: new Date() });
    res.json({ success: true, pinned: !!pinned });
  } catch (err) {
    res.status(500).json({ error: 'Failed to pin session' });
  }
};

module.exports = {
  createSession, getSessions, getSession, deleteSession,
  renameSession, pinSession, getAllSessions, markResolved, sendToTraining
};
