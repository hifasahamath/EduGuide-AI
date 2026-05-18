/**
 * EduGuide AI — Controlled-Response Chat Controller
 *
 * Flow:
 *   User message
 *   → Intent Detection (nlpService)
 *   → Context Check (contextService)
 *   → Database Query (dbService)
 *   → Controlled Minimal Response
 *   → Update Context
 *
 * Rules:
 *   ✅ Answer ONLY the specific question
 *   ✅ Use database first, Gemini as fallback
 *   ✅ Maintain session context per user
 *   ❌ Never dump full course details unprompted
 */

const { nlpService } = require('../services/nlpService');
const dbService = require('../services/dbService');
const { geminiService } = require('../services/geminiService');
const { contextService } = require('../services/contextService');
const { trainingService } = require('../services/trainingService');
const { db } = require('../config/firebaseConfig');

const SESSIONS = 'chat_sessions';

// Load session context from Firestore into in-memory contextService
const loadSessionContext = async (chatId) => {
  try {
    const doc = await db.collection(SESSIONS).doc(chatId).get();
    if (doc.exists) {
      const data = doc.data();
      const ctx = contextService.getContext(chatId);
      // Merge stored context into memory
      if (data.context) {
        Object.assign(ctx, data.context);
      }
    }
  } catch (_) { }
};

// Persist updated context and append message to Firestore session
const persistSession = async (chatId, userId, userMsg, botReply, ctx, isFirst) => {
  try {
    const ref = db.collection(SESSIONS).doc(chatId);
    const doc = await ref.get();
    const existing = doc.exists ? (doc.data().messages || []) : [];

    const newMessages = [
      ...existing,
      { sender: 'user', text: userMsg, timestamp: new Date() },
      {
        sender: 'bot',
        text: botReply,
        timestamp: new Date(),
        // Analytics tracking — read by analyticsRoutes /insights
        detectedField: ctx.lastField || null,
        detectedCourse: ctx.lastCourse || null,
      }
    ];

    const update = {
      userId,
      messages: newMessages,
      context: {
        lastIntent: ctx.lastIntent,
        lastCourse: ctx.lastCourse,
        lastCourses: ctx.lastCourses || [],
        lastField: ctx.lastField,
      },
      updatedAt: new Date(),
    };

    // Auto-title from first user message
    if (isFirst) {
      update.title = userMsg.slice(0, 45) + (userMsg.length > 45 ? '...' : '');
    }

    if (doc.exists) {
      await ref.update(update);
    } else {
      await ref.set({ chatId, createdAt: new Date(), title: update.title || 'New Chat', ...update });
    }
  } catch (err) {
    console.warn('persistSession error:', err.message);
  }
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Format currency */
const lkr = (n) => `LKR ${Number(n).toLocaleString()}`;

/** Get a course by name — uses enhanced fuzzy matching from nlpService */
const findCourseByName = (courses, query) => nlpService.fuzzyFindCourse(courses, query);

/** Filter courses by field — checks field label, course name, and keywords */
const filterByField = (courses, field) => {
  if (!field) return courses;
  const f = field.toLowerCase();
  return courses.filter(c =>
    c.field?.toLowerCase().includes(f) ||
    c.name?.toLowerCase().includes(f) ||
    c.keywords?.join(' ').toLowerCase().includes(f)
  );
};

// ── Response Builders — each returns ONLY what was asked ──────────────────────

const COURSE_LIST_LIMIT = 10;

const buildCourseListResponse = (courses, field) => {
  if (!courses.length) return `I couldn't find any ${field || ''} courses in our database right now. Would you like me to suggest alternatives?`;
  const prefix = field ? `Here are the **${field}** courses we offer:` : `Here are some courses you can consider:`;
  const list = courses.slice(0, COURSE_LIST_LIMIT).map((c, i) => `${i + 1}. ${c.name}`).join('\n');
  const suffix = courses.length > COURSE_LIST_LIMIT ? `\n\n_...and ${courses.length - COURSE_LIST_LIMIT} more. Ask me to filter by type (Degree/Diploma) or fee._` : '';
  return `${prefix}\n\n${list}${suffix}\n\n_Ask me about fees, duration, location, or eligibility for any of these._`;
};

const buildFeeResponse = (course) => {
  if (!course) return null;
  const parts = [`The fee for **${course.name}** is **${lkr(course.totalFee)}**.`];
  if (course.registrationFee) parts.push(`Registration fee: ${lkr(course.registrationFee)}.`);
  if (course.installmentAvailable === 'Yes') {
    parts.push(course.installmentPlan ? `💳 Installment available: ${course.installmentPlan}.` : `💳 Installment payment is available.`);
  }
  return parts.join(' ');
};

const buildLocationResponse = (course) => {
  if (!course) return null;
  const parts = [`You can study **${course.name}** at **${course.university}**.`];
  if (course.city) parts.push(`Located in **${course.city}**.`);
  if (course.campusLocation) parts.push(`Address: ${course.campusLocation}.`);
  if (course.onlineAvailable === 'Yes') parts.push(`🌐 Also available online.`);
  return parts.join(' ');
};

const buildDurationResponse = (course) => {
  if (!course) return null;
  const parts = [`**${course.name}** takes **${course.duration || 'N/A'}** to complete.`];
  if (course.studyMode) parts.push(`Study mode: ${course.studyMode}.`);
  if (course.level) parts.push(`Level: ${course.level}.`);
  return parts.join(' ');
};

const buildEligibilityResponse = (course) => {
  if (!course) return null;
  const parts = [`To enroll in **${course.name}**:`];
  if (course.eligibility) parts.push(`📋 Required: ${course.eligibility}.`);
  if (course.minimumRequirements) parts.push(`Minimum: ${course.minimumRequirements}.`);
  if (!course.eligibility && !course.minimumRequirements) parts.push(`Eligibility details are not set yet. Please contact the institution directly.`);
  return parts.join('\n');
};

const buildSubjectResponse = (course) => {
  if (!course) return null;
  const subjects = Array.isArray(course.subjects) ? course.subjects : (course.subjects || '').split('|').map(s => s.trim()).filter(Boolean);
  if (!subjects.length) return `Detailed modules for **${course.name}** are not listed yet. Contact the institution for the full syllabus.`;
  return `**${course.name}** covers:\n${subjects.map(s => `• ${s}`).join('\n')}`;
};

const buildCareerResponse = (course) => {
  if (!course) return null;
  const jobs = Array.isArray(course.jobOpportunities) ? course.jobOpportunities : (course.jobOpportunities || '').split('|').map(s => s.trim()).filter(Boolean);
  const parts = [];
  if (jobs.length) parts.push(`After completing **${course.name}**, you can work as:\n${jobs.map(j => `💼 ${j}`).join('\n')}`);
  if (course.careerPath) parts.push(`\nCareer path: ${course.careerPath}`);
  if (!parts.length) return `Career information for **${course.name}** is not listed yet.`;
  return parts.join('');
};

const buildInstallmentResponse = (course) => {
  if (!course) return null;
  if (course.installmentAvailable !== 'Yes') return `**${course.name}** does not currently offer installment payment. Full fee: ${lkr(course.totalFee)}.`;
  const parts = [`✅ Yes, **${course.name}** offers installment payment.`];
  if (course.installmentPlan) parts.push(`Plan: ${course.installmentPlan}.`);
  if (course.registrationFee) parts.push(`Registration fee upfront: ${lkr(course.registrationFee)}.`);
  return parts.join(' ');
};

// NEW: Summary/details response — returned when user asks for "more info" / "details"
const buildDetailsResponse = (course) => {
  if (!course) return null;
  const lines = [`📚 **${course.name}**`];
  if (course.university) lines.push(`🏛 ${course.university}`);
  if (course.level) lines.push(`🎓 Level: ${course.level}`);
  if (course.duration) lines.push(`⏱ Duration: ${course.duration} (${course.studyMode || 'Full-time'})`);
  if (course.totalFee) lines.push(`💰 Fee: ${lkr(course.totalFee)}${course.installmentAvailable === 'Yes' ? ' _(installments available)_' : ''}`);
  if (course.city) lines.push(`📍 ${course.city}${course.onlineAvailable === 'Yes' ? ' · 🌐 Online available' : ''}`);
  if (course.eligibility) lines.push(`📋 Eligibility: ${course.eligibility}`);
  const jobs = Array.isArray(course.jobOpportunities)
    ? course.jobOpportunities.slice(0, 3)
    : (course.jobOpportunities || '').split('|').map(s => s.trim()).filter(Boolean).slice(0, 3);
  if (jobs.length) lines.push(`💼 Careers: ${jobs.join(', ')}`);
  lines.push(`\n_Ask me about subjects, eligibility, or career paths for more details._`);
  return lines.join('\n');
};

// ── Main Controller ────────────────────────────────────────────────────────────

const handleChat = async (req, res) => {
  try {
    const { message, userId = 'anonymous', chatId, preferences = {} } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

    // Determine session key — chatId isolates context, fallback to userId
    const sessionKey = chatId || userId;

    // Load persisted context from Firestore into memory (if not already loaded)
    if (chatId) await loadSessionContext(chatId);

    // 1. NLP Analysis
    const { intent, entities } = nlpService.analyze(message);

    // 2. Load session context
    const ctx = contextService.getContext(sessionKey);
    const isFirstMessage = ctx.turnCount === 0;

    // 3. Update context with this turn
    contextService.updateContext(sessionKey, { message, intent, entities });

    // 4. Resolve field
    const field = entities.field || ctx.lastField;
    if (field) contextService.updateContext(sessionKey, { lastField: field });

    // 5. Check TRAINING DB / FAQ first — skip for course-listing intents so live DB results are used
    const COURSE_DB_INTENTS = ['course_search', 'general_courses', 'short_input'];
    if (!COURSE_DB_INTENTS.includes(intent)) {
      const learned = await trainingService.findLearnedAnswer(message);
      if (learned.matched) {
        const reply = learned.response;
        if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage);
        return res.json({ reply, intent: 'trained_response', context: {} });
      }
    }

    // 6. Load all courses from DB
    const allCourses = await dbService.getAllCourses();

    // ── Handle RESET ──────────────────────────────────────────────────────────
    if (intent === 'reset') {
      contextService.clearContext(sessionKey);
      const reply = `Let's start fresh! 😊 What would you like to know? I can help with courses, fees, locations, eligibility, and more.`;
      if (chatId) await persistSession(chatId, userId, message, reply, {}, isFirstMessage);
      return res.json({ reply, intent, context: {} });
    }

    // ── Handle GREETING ───────────────────────────────────────────────────────
    if (intent === 'greeting') {
      return res.json({
        reply: `Hello! 👋 I'm EduGuide AI — your personal education consultant.\n\nI can help you with:\n• Course recommendations\n• Fees & installment plans\n• Eligibility requirements\n• Locations & universities\n• Career outcomes\n\nWhat would you like to explore today?`,
        intent,
        context: {}
      });
    }

    // ── Handle GENERAL COURSES ────────────────────────────────────────────────
    if (intent === 'general_courses') {
      const results = allCourses.slice(0, 6);
      const list = results.map((c, i) => `${i + 1}. ${c.name}`).join('\n');
      const suffix = allCourses.length > 6 ? `\n\n_...and many more. Tell me your field of interest (e.g. IT, Business)!_` : '';
      const reply = `Here are some of our popular courses:\n\n${list}${suffix}`;

      contextService.updateContext(sessionKey, {
        lastCourses: results.map(c => c.name),
        lastCourse: null
      });

      if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage);
      return res.json({ reply, intent, entities: {}, context: { courseCount: allCourses.length }, courses: results.slice(0, 6) });
    }

    // ── Handle COURSE SEARCH ──────────────────────────────────────────────────
    if (intent === 'course_search') {
      if (entities.unrecognizedField) {
        const reply = "I couldn't find courses related to that field. Please try another field.";
        if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage);
        return res.json({ reply, intent, entities, context: {} });
      }

      const matched = field ? filterByField(allCourses, field) : allCourses;

      // Filter by courseType if mentioned
      const filtered = entities.courseType
        ? matched.filter(c => c.courseType?.toLowerCase() === entities.courseType.toLowerCase())
        : matched;

      // Filter by budget if mentioned
      const budgetFiltered = entities.budget
        ? filtered.filter(c => c.totalFee && c.totalFee <= entities.budget)
        : filtered;

      const results = budgetFiltered.length ? budgetFiltered : filtered;

      if (field && results.length === 0) {
        const reply = "No courses found in this category in our database.";
        if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage);
        return res.json({ reply, intent, entities, context: { field } });
      }

      // Update context with the list
      contextService.updateContext(sessionKey, {
        lastCourses: results.slice(0, COURSE_LIST_LIMIT).map(c => c.name),
        lastCourse: results.length === 1 ? results[0].name : ctx.lastCourse,
      });

      const reply = buildCourseListResponse(results, field);
      if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage);
      return res.json({ reply, intent, entities, context: { field, courseCount: results.length }, courses: results.slice(0, COURSE_LIST_LIMIT) });
    }

    // ── Resolve "which course" for follow-up intents ──────────────────────────
    // Priority: 1) course hint in this message, 2) direct name match, 3) lastCourse from context
    // NOTE: Skip direct fuzzy match when user typed a field name (short_input + field entity)
    //       so "Business" doesn't match "BBA (Bachelor of Business Administration)" as a single course.
    const focusCourse = (() => {
      // Check if NLP extracted a course hint (alias like "BBA", "MBA")
      if (entities.courseHint) {
        const hintMatch = findCourseByName(allCourses, entities.courseHint);
        if (hintMatch) return hintMatch;
      }
      // Skip direct fuzzy match when a field keyword was detected (avoid "Business" → BBA match)
      if (!(intent === 'short_input' && entities.field)) {
        const directMatch = findCourseByName(allCourses, message);
        if (directMatch) return directMatch;
      }
      // Single course in last list
      if (ctx.lastCourses?.length === 1) return findCourseByName(allCourses, ctx.lastCourses[0]);
      // Last focused course
      if (ctx.lastCourse) return findCourseByName(allCourses, ctx.lastCourse);
      return null;
    })();

    // Update lastCourse in context if we resolved it
    if (focusCourse) {
      contextService.updateContext(sessionKey, { lastCourse: focusCourse.name });
    }

    // ── Clarification prompt if context is missing ────────────────────────────
    const DETAIL_INTENTS = ['fee_query', 'duration_query', 'location_query', 'eligibility_query', 'subject_query', 'career_query', 'installment_query', 'details_query'];
    const needsClarification = !focusCourse && DETAIL_INTENTS.includes(intent);
    if (needsClarification) {
      const clarify = ctx.lastCourses?.length > 0
        ? `Which course are you asking about? You can choose from:\n${ctx.lastCourses.map((n, i) => `${i + 1}. ${n}`).join('\n')}`
        : `I'm not sure which course you mean. Could you tell me the course name or field of study? (e.g. "IT courses", "BBA fees")`;
      const persist = async () => { if (chatId) await persistSession(chatId, userId, message, clarify, contextService.getContext(sessionKey), isFirstMessage); };
      await persist();
      return res.json({ reply: clarify, intent, context: {} });
    }

    // ── Handle specific follow-up intents ─────────────────────────────────────

    if (intent === 'fee_query') {
      const reply = buildFeeResponse(focusCourse);
      if (reply) { if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage); return res.json({ reply, intent, context: { course: focusCourse.name } }); }
    }

    if (intent === 'location_query') {
      const reply = buildLocationResponse(focusCourse);
      if (reply) { if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage); return res.json({ reply, intent, context: { course: focusCourse.name } }); }
    }

    if (intent === 'duration_query') {
      const reply = buildDurationResponse(focusCourse);
      if (reply) { if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage); return res.json({ reply, intent, context: { course: focusCourse.name } }); }
    }

    if (intent === 'eligibility_query') {
      const reply = buildEligibilityResponse(focusCourse);
      if (reply) { if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage); return res.json({ reply, intent, context: { course: focusCourse.name } }); }
    }

    if (intent === 'subject_query') {
      const reply = buildSubjectResponse(focusCourse);
      if (reply) { if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage); return res.json({ reply, intent, context: { course: focusCourse.name } }); }
    }

    if (intent === 'career_query') {
      const reply = buildCareerResponse(focusCourse);
      if (reply) { if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage); return res.json({ reply, intent, context: { course: focusCourse.name } }); }
    }

    if (intent === 'installment_query') {
      const reply = buildInstallmentResponse(focusCourse);
      if (reply) { if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage); return res.json({ reply, intent, context: { course: focusCourse.name } }); }
    }

    // ── Handle DETAILS query ──────────────────────────────────────────────────
    if (intent === 'details_query') {
      if (focusCourse) {
        const reply = buildDetailsResponse(focusCourse);
        if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage);
        return res.json({ reply, intent, context: { course: focusCourse.name }, courses: [focusCourse] });
      }
      // No course context — ask which one
      const prompt = ctx.lastCourses?.length > 0
        ? `Which course would you like details on?\n${ctx.lastCourses.map((n, i) => `${i + 1}. ${n}`).join('\n')}`
        : `Sure! Which course are you interested in? Tell me the course name or field (e.g. IT, Business).`;
      if (chatId) await persistSession(chatId, userId, message, prompt, contextService.getContext(sessionKey), isFirstMessage);
      return res.json({ reply: prompt, intent });
    }

    // ── Handle SHORT INPUT (e.g. "BBA", "MBA", "Cloud Computing", "Business", "IT") ──
    if (intent === 'short_input') {
      // PRIORITY 1: If input matches a known field → list ALL courses in that field
      if (entities.field) {
        const matched = filterByField(allCourses, entities.field);
        if (matched.length === 0) {
          const reply = "No courses found in this category in our database.";
          if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage);
          return res.json({ reply, intent: 'course_search', context: { field: entities.field } });
        }
        contextService.updateContext(sessionKey, {
          lastCourses: matched.slice(0, COURSE_LIST_LIMIT).map(c => c.name),
          lastField: entities.field
        });
        const reply = buildCourseListResponse(matched, entities.field);
        if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage);
        return res.json({ reply, intent: 'course_search', courses: matched.slice(0, COURSE_LIST_LIMIT) });
      }

      // PRIORITY 2: If a specific course name was matched → ask what they want to know
      if (focusCourse) {
        const reply = `I found **${focusCourse.name}**! What would you like to know?\n• 💰 Fees\n• ⏱ Duration\n• 📍 Location\n• 📋 Eligibility\n• 📚 Subjects\n• 💼 Career outcomes\n\nJust ask!`;
        if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage);
        return res.json({ reply, intent: 'course_selection', context: { course: focusCourse.name }, courses: [focusCourse] });
      }

      // Unknown short input
      const reply = "I couldn't find courses related to that field. Please try another field.";
      if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage);
      return res.json({ reply, intent: 'clarification' });
    }

    // ── Handle FOLLOWUP (very short messages referencing context) ─────────────
    if (intent === 'followup' && focusCourse) {
      const prevIntent = ctx.lastIntent;
      if (prevIntent && prevIntent !== 'followup' && prevIntent !== 'short_input') {
        const reply = {
          fee_query: buildFeeResponse, location_query: buildLocationResponse,
          duration_query: buildDurationResponse, eligibility_query: buildEligibilityResponse,
          subject_query: buildSubjectResponse, career_query: buildCareerResponse,
          installment_query: buildInstallmentResponse, details_query: buildDetailsResponse,
        }[prevIntent]?.(focusCourse);
        if (reply) { if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage); return res.json({ reply, intent: prevIntent, context: { course: focusCourse.name } }); }
      }
      // If we have a course but no previous intent — show details as default
      const reply = buildDetailsResponse(focusCourse);
      if (reply) { if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage); return res.json({ reply, intent: 'details_query', context: { course: focusCourse.name } }); }
    }

    // ── Comparison ─────────────────────────────────────────────────────────────
    if (intent === 'comparison') {
      const coursesToCompare = ctx.lastCourses?.slice(0, 3).map(name => findCourseByName(allCourses, name)).filter(Boolean);
      if (coursesToCompare?.length >= 2) {
        const rows = coursesToCompare.map(c => `**${c.name}**\n• Fee: ${c.totalFee ? lkr(c.totalFee) : 'N/A'} | Duration: ${c.duration || 'N/A'} | Mode: ${c.studyMode || 'N/A'}`);
        const reply = `Here's a quick comparison:\n\n${rows.join('\n\n')}`;
        if (chatId) await persistSession(chatId, userId, message, reply, contextService.getContext(sessionKey), isFirstMessage);
        return res.json({ reply, intent, courses: coursesToCompare });
      }
    }

    // ── Final Fallback ──────────────────────────────────────────────────────────────────────
    // Store unknown question in training collection for admin review
    await trainingService.storeUnknown(message, intent);
    const fallbackReply = trainingService.FALLBACK_MESSAGE;
    if (chatId) await persistSession(chatId, userId, message, fallbackReply, contextService.getContext(sessionKey), isFirstMessage);
    return res.json({ reply: fallbackReply, intent: 'fallback', context: {} });

  } catch (error) {
    console.error('Chat controller error:', error);
    return res.status(500).json({ reply: "I'm having a moment. Could you rephrase that or try again?", error: error.message });
  }
};

const getChatHistory = async (req, res) => {
  try {
    const { userId = 'default_user' } = req.query;
    const history = await dbService.getChatHistory(userId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get history' });
  }
};

module.exports = { handleChat, getChatHistory };
