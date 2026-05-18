const admin = require('firebase-admin');

// Initialize Firebase Admin (assuming serviceAccountKey.json is in the same directory)
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function populateMissingCollections() {
  try {
    const batch = db.batch();

    // 1. subscriptions
    const subRef = db.collection('subscriptions').doc('demo_subscription_1');
    const subDoc = await subRef.get();
    if (!subDoc.exists) {
      batch.set(subRef, {
        userId: "demo_user",
        plan: "FREE",
        status: "inactive",
        startDate: null,
        endDate: null,
        isDemo: true
      });
      console.log('Added dummy document to subscriptions');
    } else {
      console.log('Collection subscriptions already has data');
    }

    // 2. analytics
    const analyticsRef = db.collection('analytics').doc('demo_analytics_1');
    const analyticsDoc = await analyticsRef.get();
    if (!analyticsDoc.exists) {
      batch.set(analyticsRef, {
        userId: "demo_user",
        totalChats: 0,
        mostSearchedField: "none",
        lastActive: admin.firestore.FieldValue.serverTimestamp(),
        isDemo: true
      });
      console.log('Added dummy document to analytics');
    } else {
      console.log('Collection analytics already has data');
    }

    // 3. unknown_questions
    const uqRef = db.collection('unknown_questions').doc('demo_unknown_1');
    const uqDoc = await uqRef.get();
    if (!uqDoc.exists) {
      batch.set(uqRef, {
        question: "sample test question",
        userId: "demo_user",
        status: "pending",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isDemo: true
      });
      console.log('Added dummy document to unknown_questions');
    } else {
      console.log('Collection unknown_questions already has data');
    }

    await batch.commit();
    console.log('Successfully completed adding missing collections for documentation.');
    process.exit(0);
  } catch (error) {
    console.error('Error populating missing collections:', error);
    process.exit(1);
  }
}

populateMissingCollections();
