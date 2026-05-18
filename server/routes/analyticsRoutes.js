const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseConfig');

/**
 * GET /api/analytics/dashboard
 * Fast, lightweight data for the main dashboard cards.
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [usersSnap, coursesSnap, sessionsSnap, pendingSnap, trainedSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('courses').get(),
      db.collection('chat_sessions').get(),
      db.collection('training').where('status', '==', 'pending').get(),
      db.collection('training').where('status', '==', 'trained').get(),
    ]);

    const totalUsers = usersSnap.size;
    const totalCourses = coursesSnap.size;
    const totalChats = sessionsSnap.size;
    const pendingTraining = pendingSnap.size;
    const trainedCount = trainedSnap.size;

    // Today's sessions
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    let chatsToday = 0;
    sessionsSnap.docs.forEach(doc => {
      const d = doc.data();
      const ts = d.createdAt?._seconds ? d.createdAt._seconds * 1000
        : d.createdAt?.toDate ? d.createdAt.toDate().getTime() : null;
      if (ts && ts >= todayStart.getTime()) chatsToday++;
    });

    // AI health from sessions — count intents
    let totalMessages = 0, fallbackCount = 0;
    const fieldCounts = {}, courseCounts = {}, intentCounts = {};
    const recentSessions = [];

    sessionsSnap.docs.forEach(doc => {
      const d = doc.data();
      recentSessions.push({ id: doc.id, ...d });

      const msgs = d.messages || [];
      msgs.forEach(m => {
        if (m.sender === 'bot' || m.role === 'bot') {
          totalMessages++;
          const intent = m.intent || 'unknown';
          intentCounts[intent] = (intentCounts[intent] || 0) + 1;
          if (intent === 'fallback') fallbackCount++;
        }
        if (m.detectedField) fieldCounts[m.detectedField] = (fieldCounts[m.detectedField] || 0) + 1;
        if (m.detectedCourse) courseCounts[m.detectedCourse] = (courseCounts[m.detectedCourse] || 0) + 1;
      });
    });

    const aiAccuracy = totalMessages > 0
      ? Math.round(((totalMessages - fallbackCount) / totalMessages) * 100) : 0;
    const fallbackRate = totalMessages > 0
      ? Math.round((fallbackCount / totalMessages) * 100) : 0;
    const trainingCompletion = (pendingTraining + trainedCount) > 0
      ? Math.round((trainedCount / (pendingTraining + trainedCount)) * 100) : 100;

    // Recent sessions (last 5)
    const recent = recentSessions
      .sort((a, b) => {
        const ta = a.updatedAt?._seconds || a.createdAt?._seconds || 0;
        const tb = b.updatedAt?._seconds || b.createdAt?._seconds || 0;
        return tb - ta;
      })
      .slice(0, 5)
      .map(s => ({
        id: s.id,
        title: s.title || 'New Chat',
        userId: s.userId,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        messageCount: (s.messages || []).length,
        lastMessage: (s.messages || []).slice(-1)[0]?.text || '',
      }));

    res.json({
      totalUsers,
      totalCourses,
      totalChats,
      chatsToday,
      pendingTraining,
      trainedCount,
      aiAccuracy,
      fallbackRate,
      trainingCompletion,
      recentSessions: recent,
    });
  } catch (err) {
    console.error('dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics/insights
 * Full deep-analytics payload for the Analytics page.
 */
router.get('/insights', async (req, res) => {
  try {
    const [sessionsSnap, pendingSnap, trainedSnap, unknownSnap] = await Promise.all([
      db.collection('chat_sessions').get(),
      db.collection('training').where('status', '==', 'pending').get(),
      db.collection('training').where('status', '==', 'trained').get(),
      db.collection('training').get(),
    ]);

    // ── Build per-session message analysis ──────────────────
    const dailyChatMap = {};
    const hourMap = {};
    const fieldCounts = {};
    const courseCounts = {};
    const intentCounts = {};
    let totalMessages = 0, fallbackCount = 0, trainedResponseCount = 0;
    let totalDepth = 0;

    // NLP field keyword map (mirrors nlpService FIELD_MAP)
    const FIELD_KEYWORDS = {
      'IT': ['it', 'software', 'computing', 'programming', 'coding', 'tech', 'technology', 'computer', 'data', 'cyber', 'network', 'web', 'cloud', 'information technology'],
      'Business': ['business', 'management', 'marketing', 'finance', 'accounting', 'commerce', 'mba', 'bba'],
      'Engineering': ['engineering', 'mechanical', 'civil', 'electrical', 'electronic'],
      'Health': ['medicine', 'medical', 'nursing', 'health', 'doctor', 'nurse', 'mlt'],
      'Law': ['law', 'legal'],
      'Arts': ['arts', 'design', 'creative', 'media', 'psychology'],
      'Aviation': ['pilot', 'aviation'],
    };

    const detectFieldFromText = (text) => {
      const t = (text || '').toLowerCase();
      for (const [field, keywords] of Object.entries(FIELD_KEYWORDS)) {
        if (keywords.some(kw => t.includes(kw))) return field;
      }
      return null;
    };

    sessionsSnap.docs.forEach(doc => {
      const d = doc.data();
      const msgs = d.messages || [];
      const tsRaw = d.createdAt?._seconds ? d.createdAt._seconds * 1000
        : d.createdAt?.toDate ? d.createdAt.toDate().getTime() : null;

      if (tsRaw) {
        // Daily
        const day = new Date(tsRaw).toISOString().slice(0, 10);
        dailyChatMap[day] = (dailyChatMap[day] || 0) + 1;
        // Hour
        const hour = new Date(tsRaw).getHours();
        hourMap[hour] = (hourMap[hour] || 0) + 1;
      }

      totalDepth += msgs.length;

      // Track whether message-level data was found for this session
      let sessionHasFieldData = false;
      let sessionHasCourseData = false;

      msgs.forEach(m => {
        if (m.sender === 'bot' || m.role === 'bot') {
          totalMessages++;
          const intent = m.intent || 'unknown';
          intentCounts[intent] = (intentCounts[intent] || 0) + 1;
          if (intent === 'fallback') fallbackCount++;
          if (intent === 'trained_response') trainedResponseCount++;
        }

        // Message-level analytics (new sessions — detectedField/detectedCourse set by chatController)
        if (m.detectedField) {
          fieldCounts[m.detectedField] = (fieldCounts[m.detectedField] || 0) + 1;
          sessionHasFieldData = true;
        }
        if (m.detectedCourse) {
          courseCounts[m.detectedCourse] = (courseCounts[m.detectedCourse] || 0) + 1;
          sessionHasCourseData = true;
        }

        // Also scan user message text for field keywords (works for all sessions)
        if (m.sender === 'user' || m.role === 'user') {
          const detected = detectFieldFromText(m.text || '');
          if (detected) {
            fieldCounts[detected] = (fieldCounts[detected] || 0) + 1;
            sessionHasFieldData = true;
          }
        }
      });

      // Fallback: use session-level context for older sessions with no message-level data
      if (!sessionHasFieldData && d.context?.lastField) {
        fieldCounts[d.context.lastField] = (fieldCounts[d.context.lastField] || 0) + 1;
      }
      if (!sessionHasCourseData && d.context?.lastCourse) {
        courseCounts[d.context.lastCourse] = (courseCounts[d.context.lastCourse] || 0) + 1;
      }
    });

    // ── Daily chat trend (last 7 days) ──────────────────────
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      weeklyTrend.push({ day: label, date: key, chats: dailyChatMap[key] || 0 });
    }

    // ── Peak hours (0–23) ────────────────────────────────────
    const peakHours = Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, '0')}:00`,
      sessions: hourMap[h] || 0,
    }));

    // ── AI Metrics ───────────────────────────────────────────
    const aiAccuracy = totalMessages > 0
      ? Math.round(((totalMessages - fallbackCount) / totalMessages) * 100) : 0;
    const fallbackRate = totalMessages > 0
      ? Math.round((fallbackCount / totalMessages) * 100) : 0;
    const trainedResponseRate = totalMessages > 0
      ? Math.round((trainedResponseCount / totalMessages) * 100) : 0;

    // ── Training metrics ─────────────────────────────────────
    const pendingCount = pendingSnap.size;
    const trainedCount = trainedSnap.size;
    const totalTraining = unknownSnap.size;
    const trainingCompletion = totalTraining > 0
      ? Math.round((trainedCount / totalTraining) * 100) : 100;

    // ── Top pending (unanswered) sorted by occurrences ───────
    const topPending = pendingSnap.docs
      .map(d => ({ ...d.data(), id: d.id }))
      .sort((a, b) => (b.occurrences || 1) - (a.occurrences || 1))
      .slice(0, 8)
      .map(d => ({ question: d.user_input || d.question, occurrences: d.occurrences || 1 }));

    // ── Field & Course popularity ────────────────────────────
    const topFields = Object.entries(fieldCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const topCourses = Object.entries(courseCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // ── Intent breakdown ─────────────────────────────────────
    const intentBreakdown = Object.entries(intentCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ── Avg conversation depth ───────────────────────────────
    const avgDepth = sessionsSnap.size > 0
      ? (totalDepth / sessionsSnap.size).toFixed(1) : 0;

    // ── Smart insights ───────────────────────────────────────
    const smartInsights = [];
    if (pendingCount > 5) {
      const top = topPending[0];
      if (top) smartInsights.push(`💡 "${top.question}" has been asked ${top.occurrences} times with no answer — train it now.`);
    }
    if (fallbackRate > 20) smartInsights.push(`⚠️ Fallback rate is ${fallbackRate}% — consider expanding NLP patterns or training more questions.`);
    if (topFields[0] && !topCourses.length) smartInsights.push(`📚 Users frequently search for "${topFields[0].name}" courses but no course mentions were logged.`);
    if (trainingCompletion < 50) smartInsights.push(`🧠 Training is only ${trainingCompletion}% complete — answer pending questions to improve AI accuracy.`);
    if (smartInsights.length === 0) smartInsights.push('✅ System is performing well! Keep monitoring for new training patterns.');

    res.json({
      // Overview
      totalSessions: sessionsSnap.size,
      totalMessages,
      avgDepth: parseFloat(avgDepth),
      pendingTraining: pendingCount,
      trainedCount,
      trainingCompletion,
      // AI Performance
      aiAccuracy,
      fallbackRate,
      trainedResponseRate,
      intentBreakdown,
      // Trends
      weeklyTrend,
      peakHours,
      // Behavior
      topFields,
      topCourses,
      // Training
      topPending,
      // Insights
      smartInsights,
    });
  } catch (err) {
    console.error('insights error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/analytics  (backward compat — kept for old callers)
 */
router.get('/', async (req, res) => {
  try {
    const [usersSnap, coursesSnap, sessionsSnap, pendingSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('courses').get(),
      db.collection('chat_sessions').get(),
      db.collection('training').where('status', '==', 'pending').get(),
    ]);
    res.json({
      totalUsers: usersSnap.size,
      totalCourses: coursesSnap.size,
      totalConversations: sessionsSnap.size,
      unansweredQuestions: pendingSnap.size,
      mostSearchedFields: [],
      popularCourses: [],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
