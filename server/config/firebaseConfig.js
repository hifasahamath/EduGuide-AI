require('dotenv').config();
const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

let db;

try {
  // ── Priority 1: Individual environment variables (Vercel / any cloud) ──────
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Vercel stores \n as literal \\n — replace them back
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      }),
    });
    db = getFirestore();
    console.log('✅ Firebase initialized via environment variables.');
  }
  // ── Priority 2: Full JSON blob in env var (alternative cloud approach) ─────
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    db = getFirestore();
    console.log('✅ Firebase initialized via FIREBASE_SERVICE_ACCOUNT_JSON env var.');
  }
  // ── Priority 3: Local JSON file (development) ─────────────────────────────
  else {
    // Always resolve relative to THIS file's directory (__dirname = server/config/)
    // so it works regardless of where `node` is invoked from
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      ? require('path').resolve(__dirname, '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH.replace(/^\.\//, ''))
      : require('path').resolve(__dirname, '..', 'serviceAccountKey.json');

    console.log('🔍 Looking for service account file at:', serviceAccountPath);

    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      db = getFirestore();
      console.log('✅ Firebase initialized with service account file.');
    } else {
      throw new Error(
        `No Firebase credentials found.\n` +
        `  Tried file: ${serviceAccountPath}\n` +
        `  Fix: Set FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY\n` +
        `  OR:  Place serviceAccountKey.json in the /server directory`
      );
    }
  }
} catch (error) {
  console.warn('⚠️  Firebase initialization failed. Using in-memory mock DB.\n   Reason:', error.message);

  const MOCK_DB_PATH = require('path').join(__dirname, '../mock_database.json');

  let memoryDB = { courses: [], training: [], faqs: [], faq: [], chat_history: [], users: [] };

  if (fs.existsSync(MOCK_DB_PATH)) {
    try { memoryDB = JSON.parse(fs.readFileSync(MOCK_DB_PATH, 'utf-8')); } catch (e) { }
  }

  const saveMockDB = () => {
    try { fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(memoryDB, null, 2)); } catch (e) { }
  };

  // Build a mock subcollection that supports .add() and .get()
  const mockSubcollection = (parentName, parentId, subName) => ({
    add: async (data) => {
      const key = `${parentName}__${parentId}__${subName}`;
      if (!memoryDB[key]) memoryDB[key] = [];
      const id = 'mock_' + Math.random().toString(36).substr(2, 9);
      memoryDB[key].push({ id, ...data });
      saveMockDB();
      return { id };
    },
    get: async () => {
      const key = `${parentName}__${parentId}__${subName}`;
      const docs = (memoryDB[key] || []).map(d => ({ id: d.id, data: () => d }));
      return { empty: docs.length === 0, docs };
    },
  });

  db = {
    collection: (name) => ({
      where: (field, op, value) => ({
        get: async () => {
          const docs = (memoryDB[name] || [])
            .filter(d => op === '==' ? d[field] === value : true)
            .map(d => ({ id: d.id, data: () => d, exists: true }));
          return { empty: docs.length === 0, docs };
        },
        where: () => ({ get: async () => ({ empty: true, docs: [] }) }),
      }),
      doc: (id) => ({
        get: async () => {
          const item = (memoryDB[name] || []).find(d => d.id === id);
          return { exists: !!item, data: () => item, id };
        },
        update: async (data) => {
          const arr = memoryDB[name] || [];
          const idx = arr.findIndex(d => d.id === id);
          if (idx !== -1) { arr[idx] = { ...arr[idx], ...data }; saveMockDB(); }
        },
        delete: async () => {
          if (memoryDB[name]) {
            memoryDB[name] = memoryDB[name].filter(d => d.id !== id);
            saveMockDB();
          }
        },
        collection: (subName) => mockSubcollection(name, id, subName),
      }),
      get: async () => {
        const docs = (memoryDB[name] || []).map(d => ({ id: d.id, data: () => d, exists: true }));
        return { empty: docs.length === 0, docs };
      },
      add: async (data) => {
        const id = 'mock_' + Math.random().toString(36).substr(2, 9);
        if (!memoryDB[name]) memoryDB[name] = [];
        memoryDB[name].push({ id, ...data });
        saveMockDB();
        return { id };
      },
    }),
  };
}

// Export as plain object — supports: const { db } = require('./config/firebaseConfig')
module.exports = { db };
