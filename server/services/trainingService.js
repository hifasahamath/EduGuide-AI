/**
 * Training Service — EduGuide AI Self-Learning System
 *
 * Responsibilities:
 * 1. Check learned answers BEFORE falling back to AI
 * 2. Store unanswered questions (deduplication)
 * 3. Mark questions as trained when admin answers them
 *
 * PRIORITY ORDER for findLearnedAnswer:
 *   1. FAQs collection  (Manage FAQ page → `faqs` Firestore collection)
 *   2. Training collection  (Training page → `training` Firestore collection)
 *
 * FAQ CONFIDENCE SCORING:
 *   Exact question match      → +100  (returns immediately)
 *   Full keyword match        → +40   (all keyword tokens found in message)
 *   Partial keyword match     → +10   (some keyword tokens found)
 *   Intent / category match   → +20
 *   Fuzzy similarity ≥ 0.75  → +30
 *   MINIMUM THRESHOLD         → 50    (below this = no match, falls through)
 */

const { db } = require('../config/firebaseConfig');

const COLLECTION = 'training';
const FALLBACK_MESSAGE = "Sorry, I couldn't clearly understand your question. Please contact our customer care agent at 0754864688 for further assistance.";

// ── Minimum confidence score required to return a FAQ answer ─────────────────
const FAQ_MIN_SCORE = 50;

// ── Text normalizer ───────────────────────────────────────────────────────────
const normalize = (text) =>
  (text || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

// ── Token overlap similarity (0 to 1) ─────────────────────────────────────────
const similarity = (a, b) => {
  const tokA = new Set(normalize(a).split(' ').filter(w => w.length > 2));
  const tokB = new Set(normalize(b).split(' ').filter(w => w.length > 2));
  if (!tokA.size || !tokB.size) return 0;
  let overlap = 0;
  tokA.forEach(t => { if (tokB.has(t)) overlap++; });
  return overlap / Math.max(tokA.size, tokB.size);
};

// ── Fuzzy match via string-similarity package (graceful fallback) ─────────────
let stringSimilarity = null;
try { stringSimilarity = require('string-similarity'); } catch (_) { }

const fuzzyScore = (a, b) => {
  if (stringSimilarity && typeof stringSimilarity.compareTwoStrings === 'function') {
    return stringSimilarity.compareTwoStrings(normalize(a), normalize(b));
  }
  return similarity(a, b);
};

// ── Detect rough intent/category from user message ───────────────────────────
// Maps normalized message words to a category label used for +20 bonus scoring
const CATEGORY_SIGNALS = {
  developer: ['developer', 'developers', 'creator', 'built', 'made', 'team', 'founder', 'development'],
  contact: ['contact', 'phone', 'email', 'reach', 'call', 'address', 'support'],
  fees: ['fee', 'fees', 'cost', 'price', 'payment', 'how much', 'lkr', 'rupee'],
  courses: ['course', 'courses', 'degree', 'diploma', 'certificate', 'study', 'program'],
  admissions: ['apply', 'admission', 'enroll', 'register', 'join', 'eligibility', 'qualify'],
  general: ['who', 'what', 'about', 'eduguide', 'chatbot', 'ai', 'assistant', 'bot'],
};

const detectCategory = (norm) => {
  const words = norm.split(' ');
  for (const [cat, signals] of Object.entries(CATEGORY_SIGNALS)) {
    if (signals.some(s => norm.includes(s))) return cat;
  }
  return 'general';
};

// ── Core FAQ scoring function ─────────────────────────────────────────────────
const scoreFaqMatch = (faq, norm, userCategory) => {
  let score = 0;
  const normQ = normalize(faq.question || '');
  const keywords = Array.isArray(faq.keywords) ? faq.keywords : [];
  const faqCategory = faq.category || faq.intent || 'general';

  // ── Rule 1: Exact normalized question match → max confidence ────────────────
  if (normQ === norm) return 100;

  // ── Rule 2: Includes — message contains full question or vice versa ──────────
  if (normQ.length > 3 && (norm.includes(normQ) || normQ.includes(norm))) {
    score += 60;
  }

  // ── Rule 3: Keyword scoring ──────────────────────────────────────────────────
  for (const kw of keywords) {
    const normKw = normalize(kw);
    if (!normKw || normKw.length < 2) continue;

    const kwTokens = normKw.split(' ').filter(w => w.length > 1);
    if (kwTokens.length === 0) continue;

    const matchedTokens = kwTokens.filter(t => norm.includes(t));
    const matchRatio = matchedTokens.length / kwTokens.length;

    if (matchRatio === 1) {
      // All tokens in keyword are present in user message — full match
      score += 40;
    } else if (matchRatio >= 0.5) {
      // At least half the keyword tokens matched — partial match
      score += 10;
    }
    // Prevent runaway score from many partial keyword hits
    if (score >= 80) break;
  }

  // ── Rule 4: Intent / category bonus ─────────────────────────────────────────
  if (faqCategory === userCategory) {
    score += 20;
  }

  // ── Rule 5: Fuzzy string similarity (threshold raised to 0.75) ──────────────
  const fuzzy = fuzzyScore(norm, normQ);
  if (fuzzy >= 0.75) {
    score += 30;
  }

  return score;
};

// ── Main FAQ matcher — returns best { faq, score } or null ───────────────────
const matchFaq = (faqs, norm) => {
  const userCategory = detectCategory(norm);
  let bestFaq = null;
  let bestScore = 0;

  for (const faq of faqs) {
    if (!faq.answer) continue;
    const score = scoreFaqMatch(faq, norm, userCategory);

    // Exact match — return immediately, no need to scan further
    if (score === 100) return { faq, score: 100 };

    if (score > bestScore) {
      bestScore = score;
      bestFaq = faq;
    }
  }

  // Only return a match if confidence meets minimum threshold
  if (bestFaq && bestScore >= FAQ_MIN_SCORE) {
    return { faq: bestFaq, score: bestScore };
  }

  return null; // confidence too low — fall through to course logic
};

// ════════════════════════════════════════════════════════════════════════════════
const trainingService = {
  FALLBACK_MESSAGE,

  /**
   * findLearnedAnswer
   *
   * Checks in order:
   *   1. `faqs` Firestore collection  — scored matching (must reach threshold ≥ 50)
   *   2. `training` Firestore collection — trained Q&A pairs
   *
   * Returns { matched: true, response, score, source } | { matched: false }
   */
  findLearnedAnswer: async (userInput) => {
    try {
      const norm = normalize(userInput);

      // ── PRIORITY 1: faqs collection ───────────────────────────────────────────
      const faqSnap = await db.collection('faqs').get();
      const faqs = faqSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const faqResult = matchFaq(faqs, norm);

      if (faqResult) {
        // Increment askCount for admin analytics (non-blocking, best-effort)
        db.collection('faqs').doc(faqResult.faq.id)
          .update({ askCount: (faqResult.faq.askCount || 0) + 1 })
          .catch(() => { });
        return {
          matched: true,
          response: faqResult.faq.answer,
          score: faqResult.score,
          source: 'faq'
        };
      }

      // ── PRIORITY 2: training collection ──────────────────────────────────────
      const snapshot = await db.collection(COLLECTION)
        .where('status', '==', 'trained')
        .get();

      let best = null;
      let bestScore = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (!data.response) return;

        // Exact normalized match
        if (normalize(data.user_input) === norm) {
          best = { id: doc.id, ...data };
          bestScore = 1.0;
          return;
        }

        // Token-overlap similarity (threshold 55%)
        const score = similarity(userInput, data.user_input);
        if (score > bestScore && score >= 0.55) {
          bestScore = score;
          best = { id: doc.id, ...data };
        }
      });

      if (best) {
        return { matched: true, response: best.response, score: bestScore, source: 'training' };
      }

      return { matched: false };
    } catch (err) {
      console.warn('trainingService.findLearnedAnswer error:', err.message);
      return { matched: false };
    }
  },

  /**
   * storeUnknown — save unanswered question with deduplication.
   */
  storeUnknown: async (userInput, detectedIntent = null) => {
    try {
      const norm = normalize(userInput);
      if (!norm) return null;

      // Check for near-duplicate in pending items
      const snapshot = await db.collection(COLLECTION)
        .where('status', '==', 'pending')
        .get();

      for (const doc of snapshot.docs) {
        const existing = normalize(doc.data().user_input || '');
        if (existing === norm || similarity(userInput, doc.data().user_input) >= 0.80) {
          await doc.ref.update({
            occurrences: (doc.data().occurrences || 1) + 1,
            last_seen: new Date()
          });
          return doc.id;
        }
      }

      // New unknown question
      const docRef = await db.collection(COLLECTION).add({
        user_input: userInput,
        normalized_input: norm,
        detected_intent: detectedIntent,
        response: null,
        status: 'pending',
        occurrences: 1,
        createdAt: new Date(),
        last_seen: new Date()
      });

      return docRef.id;
    } catch (err) {
      console.warn('trainingService.storeUnknown error:', err.message);
      return null;
    }
  },

  /**
   * markTrained — admin saves a response for a pending question.
   */
  markTrained: async (docId, response) => {
    try {
      await db.collection(COLLECTION).doc(docId).update({
        response: response.trim(),
        status: 'trained',
        trainedAt: new Date()
      });
      return true;
    } catch (err) {
      console.warn('trainingService.markTrained error:', err.message);
      return false;
    }
  },

  /**
   * getPending — all unanswered questions for admin dashboard.
   */
  getPending: async () => {
    try {
      const snapshot = await db.collection(COLLECTION)
        .where('status', '==', 'pending')
        .get();

      return snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.occurrences || 1) - (a.occurrences || 1));
    } catch (err) {
      console.warn('trainingService.getPending error:', err.message);
      return [];
    }
  },

  /**
   * getTrained — all trained Q&A pairs for admin view.
   */
  getTrained: async () => {
    try {
      const snapshot = await db.collection(COLLECTION)
        .where('status', '==', 'trained')
        .get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      return [];
    }
  },

  /**
   * deleteTraining — remove a training record.
   */
  deleteTraining: async (docId) => {
    try {
      await db.collection(COLLECTION).doc(docId).delete();
      return true;
    } catch { return false; }
  }
};

module.exports = { trainingService };
