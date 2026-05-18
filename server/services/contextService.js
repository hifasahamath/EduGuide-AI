/**
 * Enhanced Context Service
 * Stores per-user session with full conversation memory:
 *   lastIntent, lastCourse, lastCourses[], lastField, history[]
 */

const sessions = {};

const DEFAULT_SESSION = () => ({
  lastIntent: null,
  lastCourse: null,       // Single course in focus, e.g. "BSc Software Engineering"
  lastCourses: [],        // List of courses returned in last course_search
  lastField: null,        // e.g. "IT", "Business"
  lastEntities: {},
  history: [],
  turnCount: 0
});

const getContext = (userId) => {
  if (!sessions[userId]) sessions[userId] = DEFAULT_SESSION();
  return sessions[userId];
};

const updateContext = (userId, updates) => {
  if (!sessions[userId]) sessions[userId] = DEFAULT_SESSION();
  const s = sessions[userId];

  if (updates.message) s.history.push(updates.message);
  if (updates.intent && updates.intent !== 'unknown') s.lastIntent = updates.intent;
  if (updates.lastCourse !== undefined) s.lastCourse = updates.lastCourse;
  if (updates.lastCourses !== undefined) s.lastCourses = updates.lastCourses;
  if (updates.lastField !== undefined) s.lastField = updates.lastField;
  if (updates.entities) s.lastEntities = { ...s.lastEntities, ...updates.entities };
  s.turnCount++;
};

const clearContext = (userId) => {
  sessions[userId] = DEFAULT_SESSION();
};

module.exports = { contextService: { getContext, updateContext, clearContext } };
