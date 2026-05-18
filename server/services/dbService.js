const { db } = require('../config/firebaseConfig');

const dbService = {
  // === Authentication & User Profile ===
  authenticateUser: async (email, password) => {
    try {
      const snapshot = await db.collection('users').where('email', '==', email).get();
      if (snapshot.empty) return null;

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      // In a real app, use bcrypt. For this demo, plain text or simple hash comparison
      if (userData.password === password) {
        return { id: userDoc.id, ...userData };
      }
      return null;
    } catch (error) {
      console.error('Error authenticating user:', error);
      throw error;
    }
  },

  registerUser: async (userData) => {
    try {
      // Check if email exists
      const existing = await db.collection('users').where('email', '==', userData.email).get();
      if (!existing.empty) return { success: false, error: 'Email already exists' };

      const docRef = await db.collection('users').add({
        ...userData,
        createdAt: new Date().toISOString()
      });
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  getUserProfile: async (userId) => {
    try {
      const doc = await db.collection('users').doc(userId).get();
      if (!doc.exists) return null;
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  updateUserProfile: async (userId, updateData) => {
    try {
      await db.collection('users').doc(userId).update(updateData);
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  // === Chat History ===
  // ---------------- COURSES ----------------
  findCourses: async (entities) => {
    let coursesRef = db.collection('courses');
    const snapshot = await coursesRef.get();
    let courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    if (entities.field) {
      courses = courses.filter(c => c.field && c.field.toLowerCase().includes(entities.field.toLowerCase()));
    }
    if (entities.budget) {
      courses = courses.filter(c => c.fee <= entities.budget);
    }
    return courses;
  },

  getAllCourses: async () => {
    const snapshot = await db.collection('courses').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  addCourse: async (data) => {
    const docRef = await db.collection('courses').add(data);
    return { id: docRef.id, ...data };
  },

  updateCourse: async (id, data) => {
    await db.collection('courses').doc(id).update(data);
    return { id, ...data };
  },

  deleteCourse: async (id) => {
    await db.collection('courses').doc(id).delete();
  },

  // ---------------- FAQ ----------------
  getAllFaqs: async () => {
    const snapshot = await db.collection('faq').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  findFaq: async (query) => {
    const faqs = await dbService.getAllFaqs();
    const bestMatch = faqs.find(f => {
      const qTokens = query.toLowerCase().split(' ');
      const fTokens = f.question.toLowerCase().split(' ');
      const matchCount = qTokens.filter(t => fTokens.includes(t)).length;
      return matchCount > 2;
    });
    return bestMatch ? bestMatch.answer : null;
  },

  addFaq: async (data) => {
    const docRef = await db.collection('faq').add(data);
    return { id: docRef.id, ...data };
  },

  updateFaq: async (id, data) => {
    await db.collection('faq').doc(id).update(data);
    return { id, ...data };
  },

  deleteFaq: async (id) => {
    await db.collection('faq').doc(id).delete();
  },

  // ---------------- TRAINING ----------------
  saveTrainingData: async (userInput, response) => {
    await db.collection('training').add({
      user_input: userInput,
      response: response,
      status: 'pending', // Added status for admin to review
      created_at: new Date()
    });
  },

  getPendingTraining: async () => {
    const snapshot = await db.collection('training').where('status', '==', 'pending').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  respondToTraining: async (id, response) => {
    await db.collection('training').doc(id).update({
      response: response,
      status: 'learned',
      updated_at: new Date()
    });
  },

  // ---------------- CHAT HISTORY ----------------
  saveChatHistory: async (userId, message, reply) => {
    await db.collection('chat_history').add({
      user_id: userId,
      message,
      reply,
      timestamp: new Date()
    });
  },

  getChatHistory: async (userId) => {
    let query = db.collection('chat_history');
    if (userId) {
      query = query.where('user_id', '==', userId);
    }
    const snapshot = await query.get();

    let history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    history.sort((a, b) => {
      const timeA = a.timestamp ? a.timestamp.toDate().getTime() : 0;
      const timeB = b.timestamp ? b.timestamp.toDate().getTime() : 0;
      return timeB - timeA; // Descending
    });
    return history;
  },

  // ---------------- USERS ----------------
  getAllUsers: async () => {
    const snapshot = await db.collection('users').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // ---------------- ANALYTICS ----------------
  getAnalytics: async () => {
    const courses = await dbService.getAllCourses();
    const history = await dbService.getChatHistory(); // gets all
    const users = await dbService.getAllUsers();
    const pendingTraining = await dbService.getPendingTraining();

    // Most searched fields (simple counting from history)
    const fieldCount = {};
    const popularCourses = {};

    history.forEach(h => {
      // Very naive extraction for demo
      const msg = h.message.toLowerCase();
      courses.forEach(c => {
        if (c.field && msg.includes(c.field.toLowerCase())) {
          fieldCount[c.field] = (fieldCount[c.field] || 0) + 1;
        }
        if (msg.includes(c.name.toLowerCase())) {
          popularCourses[c.name] = (popularCourses[c.name] || 0) + 1;
        }
      });
    });

    return {
      totalUsers: users.length,
      totalCourses: courses.length,
      totalConversations: history.length,
      unansweredQuestions: pendingTraining.length,
      mostSearchedFields: Object.keys(fieldCount).map(k => ({ name: k, count: fieldCount[k] })),
      popularCourses: Object.keys(popularCourses).map(k => ({ name: k, count: popularCourses[k] }))
    };
  },

  // === Save a conversation turn to Firestore ===
  saveConversation: async (userId, message, reply) => {
    try {
      await db.collection('chat_history').add({
        user_id: userId,
        message,
        reply,
        timestamp: new Date()
      });
    } catch (error) {
      console.warn('Could not save conversation:', error.message);
    }
  }
};

module.exports = dbService;
