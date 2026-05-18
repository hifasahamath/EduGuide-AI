/**
 * Enhanced NLP Service — EduGuide AI
 * Handles flexible language, short inputs, fuzzy matching, synonyms
 */

// ── Field → standard label map ─────────────────────────────
const FIELD_MAP = {
  'it': 'IT', 'software': 'IT', 'computing': 'IT', 'programming': 'IT',
  'coding': 'IT', 'tech': 'IT', 'technology': 'IT', 'computer': 'IT',
  'data': 'IT', 'cyber': 'IT', 'network': 'IT', 'web': 'IT', 'cloud': 'IT',
  'information technology': 'IT',
  'business': 'Business', 'management': 'Business', 'marketing': 'Business',
  'finance': 'Business', 'accounting': 'Business', 'commerce': 'Business',
  'mba': 'Business', 'bba': 'Business', 'hnd business': 'Business',
  'engineering': 'Engineering', 'mechanical': 'Engineering', 'civil': 'Engineering',
  'electrical': 'Engineering', 'electronic': 'Engineering',
  'medicine': 'Health', 'medical': 'Health', 'nursing': 'Health', 'health': 'Health',
  'doctor': 'Health', 'nurse': 'Health', 'mlt': 'Health', 'medical lab': 'Health',
  'law': 'Law', 'legal': 'Law',
  'arts': 'Arts', 'design': 'Arts', 'creative': 'Arts', 'media': 'Arts',
  'psychology': 'Arts',
  'pilot': 'Aviation', 'aviation': 'Aviation',
};

// ── Known short-hand course name aliases ───────────────────
// Key = what user types, Value = partial course name to fuzzy-match
const COURSE_ALIASES = {
  'bba': 'BBA', 'mba': 'MBA', 'bsc it': 'BSc Information Technology',
  'bsc software': 'BSc Software', 'hnd': 'HND', 'hnd computing': 'HND Computing',
  'cloud': 'Cloud Computing', 'networking': 'Networking', 'web development': 'Web Development',
  'beng': 'BEng', 'ai engineering': 'AI Engineering', 'software engineering': 'Software Engineering',
  'banking': 'Banking', 'hr management': 'HR Management', 'event management': 'Event Management',
  'bsc nursing': 'BSc Nursing', 'bsc accounting': 'BSc Accounting', 'bsc psychology': 'BSc Psychology',
};

// ── Preprocess ─────────────────────────────────────────────
const preprocess = (text) => text.toLowerCase().replace(/[^\w\s\/]/g, '').split(/\s+/).filter(Boolean);

// ── Intent detection with full synonym coverage ────────────
const detectIntent = (text) => {
  const t = text.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|good morning|good evening|good afternoon|greetings|howdy)\b/.test(t)) return 'greeting';

  // Reset
  if (/\b(reset|restart|start over|new topic|clear|forget it)\b/.test(t)) return 'reset';

  // Comparison
  if (/\b(compare|comparison|difference|vs\b|versus|better than|which is better|which one|contrast)\b/.test(t)) return 'comparison';

  // Fee / Cost
  if (/\b(fee|fees|cost|price|how much|payment|lkr|rupee|rupees|expensive|cheap|afford|tuition|charge)\b/.test(t)) return 'fee_query';

  // Duration
  if (/\b(duration|how long|length|period|months|years|semesters|how many years|how many months|time to complete)\b/.test(t)) return 'duration_query';

  // Location / Institute
  if (/\b(where|location|place|campus|address|city|institute|university|college|study at|located|near me)\b/.test(t)) return 'location_query';

  // Eligibility
  if (/eligib|qualify|qualif|requirement|qualification|a\/l pass|o\/l pass|al pass|ol pass|minimum|criteria|entry requirement|can i apply|can i join|can i enroll/.test(t)) return 'eligibility_query';

  // Subjects / Modules
  if (/subject|module|syllabus|curriculum|what do i learn|what will i study|what is taught|topics|units|papers/.test(t)) return 'subject_query';

  // Career / Jobs
  if (/career|jobs?|salary|employ|opportunit|prospect|future|what (can|will) i (do|work|become)|roles?|profession/.test(t)) return 'career_query';

  // Installment
  if (/installment|instalment|pay in|monthly payment|part payment|can i pay|payment plan|pay monthly/.test(t)) return 'installment_query';

  // Details / More info (new!)
  if (/\b(details?|more info|full info|full detail|tell me more|more about|explain|describe|overview|summary|show me|give me info|info about|information about|know more|learn more|what about|about this|about the)\b/.test(t)) return 'details_query';

  // General Courses (no specific field mentioned)
  if (/^(what courses do you have|all courses|available courses|list courses|list all courses|show me all courses|courses available|what are the courses|suggest courses|any courses)$/i.test(t) ||
    /^(what|list|show|all|available|any) (courses|programs|degrees|diplomas)$/i.test(t) ||
    /^courses$/i.test(t)) {
    return 'general_courses';
  }

  // Course search / suggestion (field specific)
  if (/\b(course|courses|degree|diploma|certificate|study|suggest|recommend|show|list|available|offer|programs?|what courses|any course)\b/.test(t)) return 'course_search';

  // Very short input — could be course name or follow-up
  if (t.trim().split(/\s+/).length <= 3) return 'short_input';

  return 'unknown';
};

// ── Entity extraction ──────────────────────────────────────
const extractEntities = (text, intent) => {
  const entities = {};
  const t = text.toLowerCase().trim();

  // Check course alias first
  for (const [alias, courseName] of Object.entries(COURSE_ALIASES)) {
    if (t === alias || t.includes(alias)) {
      entities.courseHint = courseName;
      break;
    }
  }

  // Detect field of study
  for (const [keyword, field] of Object.entries(FIELD_MAP)) {
    if (t.includes(keyword)) {
      entities.field = field;
      break;
    }
  }

  // Budget detection
  const budgetMatch = t.match(/(under|less than|below|around|about)\s*([\d,.]+\s*(?:k|m|000)?)/i);
  if (budgetMatch) {
    let raw = budgetMatch[2].replace(/,/g, '').toLowerCase();
    let amount = parseFloat(raw.replace(/k$/, '000').replace(/m$/, '000000'));
    if (!isNaN(amount)) entities.budget = amount;
  }

  // Course type
  if (/\bdegree\b/.test(t)) entities.courseType = 'Degree';
  if (/\bdiploma\b/.test(t)) entities.courseType = 'Diploma';
  if (/\bcertificate\b/.test(t)) entities.courseType = 'Certificate';
  if (/\bmasters?\b/.test(t)) entities.courseType = 'Masters';

  // Unrecognized field detection for course_search intent
  if (!entities.field && !entities.courseHint && intent === 'course_search') {
    const genericWords = new Set(['course', 'courses', 'degree', 'diploma', 'certificate', 'study', 'suggest', 'recommend', 'show', 'list', 'available', 'offer', 'programs', 'program', 'what', 'any', 'i', 'want', 'to', 'do', 'a', 'an', 'looking', 'for', 'can', 'you', 'give', 'me', 'some', 'options', 'please', 'is', 'are', 'there', 'about', 'in', 'the', 'of', 'and', 'or', 'with']);
    const words = t.split(/\s+/).map(w => w.replace(/[^\w]/g, ''));
    const hasSpecificWord = words.some(w => w.length > 2 && !genericWords.has(w));
    if (hasSpecificWord) {
      entities.unrecognizedField = true;
    }
  }

  return entities;
};

// ── Fuzzy course name match ────────────────────────────────
// Returns best matching course from list using partial matching
const fuzzyFindCourse = (courses, query) => {
  if (!query || !courses?.length) return null;
  const q = query.toLowerCase().trim();

  // 1. Exact name match
  const exact = courses.find(c => c.name?.toLowerCase() === q);
  if (exact) return exact;

  // 2. Name contains query
  const contains = courses.find(c => c.name?.toLowerCase().includes(q));
  if (contains) return contains;

  // 3. Query contains course name  
  const reverse = courses.find(c => q.includes(c.name?.toLowerCase() || ''));
  if (reverse) return reverse;

  // 4. Match by acronym or abbreviation (e.g. "bba" → "BBA (Bachelor...)")
  const words = q.split(/\s+/);
  const acronym = courses.find(c => {
    const nameLower = c.name?.toLowerCase() || '';
    return words.every(w => nameLower.includes(w));
  });
  if (acronym) return acronym;

  // 5. Match by keyword / alias hint
  const COURSE_ALIASES_LOWER = Object.entries(COURSE_ALIASES);
  for (const [alias, hint] of COURSE_ALIASES_LOWER) {
    if (q.includes(alias)) {
      const match = courses.find(c => c.name?.toLowerCase().includes(hint.toLowerCase()));
      if (match) return match;
    }
  }

  return null;
};

// ── Main analyze export ─────────────────────────────────────
const nlpService = {
  preprocess,
  detectIntent,
  extractEntities,
  fuzzyFindCourse,
  COURSE_ALIASES,
  FIELD_MAP,

  analyze: (text) => {
    const tokens = preprocess(text);
    const intent = detectIntent(text);
    const entities = extractEntities(text, intent);
    return { text, tokens, intent, entities };
  }
};

module.exports = { nlpService };
