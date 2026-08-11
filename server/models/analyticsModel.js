const { supabaseAdmin: supabase } = require('../config/supabase');

class AnalyticsModel {
  static async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const [usersResult, coursesResult, chatsResult, pendingResult, chatsTodayResult, trainingTotalResult, trainedResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('courses').select('id', { count: 'exact', head: true }),
      supabase.from('chat_sessions').select('id', { count: 'exact', head: true }),
      supabase.from('training_data').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('chat_sessions').select('id', { count: 'exact', head: true }).gte('created_at', todayStr),
      supabase.from('training_data').select('id', { count: 'exact', head: true }),
      supabase.from('training_data').select('id', { count: 'exact', head: true }).in('status', ['trained', 'learned'])
    ]);

    // Approximate AI Accuracy: if training data catches unknowns, accuracy = 100 - (total unknowns / total chats) * 100
    const totalChats = chatsResult.count || 1; // avoid div by zero
    const totalUnknowns = trainingTotalResult.count || 0;
    
    let aiAccuracy = Math.max(0, 100 - Math.round((totalUnknowns / totalChats) * 100));
    if (aiAccuracy > 100) aiAccuracy = 100;
    const fallbackRate = 100 - aiAccuracy;

    const trainedCount = trainedResult.count || 0;
    const pendingCount = pendingResult.count || 0;
    const totalTrainingItems = trainedCount + pendingCount;
    const trainingCompletion = totalTrainingItems > 0 ? Math.round((trainedCount / totalTrainingItems) * 100) : 100;

    return {
      totalUsers: usersResult.count || 0,
      totalCourses: coursesResult.count || 0,
      totalChats: chatsResult.count || 0,
      pendingTraining: pendingCount,
      trainedCount,
      trainingCompletion,
      aiAccuracy,
      fallbackRate,
      chatsToday: chatsTodayResult.count || 0
    };
  }

  static async getInsights() {
    // 1. Weekly Trends (Last 7 Days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: recentChats } = await supabase
      .from('chat_sessions')
      .select('created_at')
      .gte('created_at', sevenDaysAgo.toISOString());

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trendMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      trendMap[days[d.getDay()]] = 0;
    }
    
    (recentChats || []).forEach(chat => {
      const dayName = days[new Date(chat.created_at).getDay()];
      if (trendMap[dayName] !== undefined) trendMap[dayName]++;
    });
    
    const weeklyTrends = Object.keys(trendMap).map(key => ({ name: key, chats: trendMap[key] }));

    // 2. Popular Fields and Intents
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('intent, detected_field')
      .eq('role', 'user'); // only user messages

    const fieldCounts = {};
    const intentCounts = {};

    (messages || []).forEach(msg => {
      if (msg.detected_field) {
        fieldCounts[msg.detected_field] = (fieldCounts[msg.detected_field] || 0) + 1;
      }
      if (msg.intent) {
        intentCounts[msg.intent] = (intentCounts[msg.intent] || 0) + 1;
      }
    });

    const popularFields = Object.keys(fieldCounts)
      .map(k => ({ name: k, count: fieldCounts[k] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5

    const intents = Object.keys(intentCounts)
      .map(k => ({ name: k, count: intentCounts[k] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // top 5

    return {
      weeklyTrends,
      popularFields,
      intents
    };
  }
}

module.exports = AnalyticsModel;
