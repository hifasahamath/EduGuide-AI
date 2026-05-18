const express = require('express');
const router = express.Router();
const { db } = require('../config/firebaseConfig');

const COL = 'faqs';

// Normalize text for duplicate detection / matching
const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

// ── GET /api/faqs — return all with analytics ─────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const snap = await db.collection(COL).get();
    const faqs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // Sort by askCount desc so most asked come first
    faqs.sort((a, b) => (b.askCount || 0) - (a.askCount || 0));
    res.json(faqs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
});

// ── POST /api/faqs — add with duplicate check ─────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { question, answer, intent, keywords } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'Question and answer are required' });

    // Duplicate check
    const snap = await db.collection(COL).get();
    const normNew = normalize(question);
    const dupe = snap.docs.find(d => normalize(d.data().question) === normNew);
    if (dupe) return res.status(409).json({ error: 'A similar question already exists', existing: { id: dupe.id, ...dupe.data() } });

    const keywordArr = Array.isArray(keywords)
      ? keywords
      : (keywords || '').split(',').map(k => k.trim()).filter(Boolean);

    const doc = {
      question: question.trim(),
      answer: answer.trim(),
      intent: intent || 'general',
      keywords: keywordArr,
      askCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const ref = await db.collection(COL).add(doc);
    res.status(201).json({ id: ref.id, ...doc });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add FAQ' });
  }
});

// ── PUT /api/faqs/:id ─────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const { question, answer, intent, keywords } = req.body;
    const keywordArr = Array.isArray(keywords)
      ? keywords
      : (keywords || '').split(',').map(k => k.trim()).filter(Boolean);

    const update = {
      question: (question || '').trim(),
      answer: (answer || '').trim(),
      intent: intent || 'general',
      keywords: keywordArr,
      updatedAt: new Date(),
    };
    await db.collection(COL).doc(req.params.id).update(update);
    res.json({ id: req.params.id, ...update });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
});

// ── DELETE /api/faqs/:id ──────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await db.collection(COL).doc(req.params.id).delete();
    res.json({ message: 'FAQ deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
});

// ── GET /api/faqs/suggest?q=... — auto-suggest while typing ──────────────────
router.get('/suggest', async (req, res) => {
  try {
    const q = normalize(req.query.q || '');
    if (!q || q.length < 2) return res.json([]);
    const snap = await db.collection(COL).get();
    const results = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(faq => {
        const norm = normalize(faq.question);
        const kwMatch = (faq.keywords || []).some(k => normalize(k).includes(q));
        return norm.includes(q) || kwMatch;
      })
      .slice(0, 5)
      .map(f => ({ id: f.id, question: f.question, intent: f.intent }));
    res.json(results);
  } catch (err) {
    res.json([]);
  }
});

// ── PATCH /api/faqs/:id/increment — track ask count ──────────────────────────
router.patch('/:id/increment', async (req, res) => {
  try {
    const ref = db.collection(COL).doc(req.params.id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ error: 'Not found' });
    await ref.update({ askCount: (doc.data().askCount || 0) + 1 });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to increment' });
  }
});

// ── GET /api/faqs/analytics — summary ────────────────────────────────────────
router.get('/analytics', async (req, res) => {
  try {
    const snap = await db.collection(COL).get();
    const faqs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const total = faqs.length;
    const withIntent = faqs.filter(f => f.intent && f.intent !== 'general').length;
    const withKeywords = faqs.filter(f => f.keywords?.length > 0).length;
    const topAsked = [...faqs].sort((a, b) => (b.askCount || 0) - (a.askCount || 0)).slice(0, 5);
    const intentBreakdown = {};
    faqs.forEach(f => { const k = f.intent || 'general'; intentBreakdown[k] = (intentBreakdown[k] || 0) + 1; });

    // Training stats
    const trainSnap = await db.collection('training').get();
    const training = trainSnap.docs.map(d => d.data());
    const unanswered = training.filter(t => !t.answer || t.status === 'pending').length;
    const answered = training.filter(t => t.answer && t.status === 'trained').length;

    res.json({ total, withIntent, withKeywords, topAsked, intentBreakdown, unanswered, answered });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

module.exports = router;
