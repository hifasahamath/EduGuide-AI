const { supabaseAdmin: supabase } = require('../config/supabase');

class AnalyticsModel {
  static async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const [usersResult, coursesResult, chatsResult, pendingResult, chatsTodayResult, trainedResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('courses').select('id', { count: 'exact', head: true }),
      supabase.from('chat_sessions').select('id', { count: 'exact', head: true }),
      supabase.from('training_data').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('chat_sessions').select('id', { count: 'exact', head: true }).gte('created_at', todayStr),
      supabase.from('training_data').select('id', { count: 'exact', head: true }).in('status', ['trained', 'learned'])
    ]);

    const totalChats = chatsResult.count || 0;
    const pendingCount = pendingResult.count || 0;
    const trainedCount = trainedResult.count || 0;
    const totalTrainingItems = trainedCount + pendingCount;
    const trainingCompletion = totalTrainingItems > 0 ? Math.round((trainedCount / totalTrainingItems) * 100) : 100;

    const aiAccuracy = pendingCount > 0 && totalChats > 0 ? Math.max(0, 100 - Math.round((pendingCount / totalChats) * 100)) : 100;
    const fallbackRate = 100 - aiAccuracy;

    return {
      totalUsers: usersResult.count || 0,
      totalCourses: coursesResult.count || 0,
      totalChats: totalChats,
      pendingTraining: pendingCount,
      trainedCount,
      trainingCompletion,
      aiAccuracy,
      fallbackRate,
      chatsToday: chatsTodayResult.count || 0
    };
  }

  static async getInsights() {
    try {
      // 1. Fetch total sessions, messages, and training items in parallel
      const [sessionsRes, messagesRes, trainingRes] = await Promise.all([
        supabase.from('chat_sessions').select('id, created_at, context'),
        supabase.from('chat_messages').select('id, session_id, role, intent, detected_field, detected_course, created_at'),
        supabase.from('training_data').select('id, user_input, status, occurrences, created_at')
      ]);

      const sessions = sessionsRes.data || [];
      const messages = messagesRes.data || [];
      const trainingItems = trainingRes.data || [];

      const totalSessions = sessions.length;
      const totalMessages = messages.length;
      const avgDepth = totalSessions > 0 ? Number((totalMessages / totalSessions).toFixed(1)) : 0;

      const pendingTraining = trainingItems.filter(t => t.status === 'pending').length;
      const trainedCount = trainingItems.filter(t => t.status === 'trained' || t.status === 'learned').length;
      const totalTraining = pendingTraining + trainedCount;
      const trainingCompletion = totalTraining > 0 ? Math.round((trainedCount / totalTraining) * 100) : 100;

      // AI Accuracy & Fallback calculation
      const fallbackMsgs = messages.filter(m => m.intent === 'fallback' || m.intent === 'unknown').length;
      const userMsgs = messages.filter(m => m.role === 'user').length;
      const fallbackRate = userMsgs > 0 ? Math.min(100, Math.round((fallbackMsgs / userMsgs) * 100)) : 0;
      const aiAccuracy = Math.max(0, 100 - fallbackRate);
      const trainedResponseRate = totalSessions > 0 ? Math.min(100, Math.round((trainedCount / totalSessions) * 100)) : 100;

      // 2. Weekly Trend (Last 7 Days)
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const trendMap = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayName = days[d.getDay()];
        trendMap[dayName] = 0;
      }

      sessions.forEach(s => {
        if (s.created_at) {
          const d = new Date(s.created_at);
          const diffDays = Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
          if (diffDays <= 6) {
            const dayName = days[d.getDay()];
            if (trendMap[dayName] !== undefined) trendMap[dayName]++;
          }
        }
      });

      const weeklyTrend = Object.keys(trendMap).map(key => ({ day: key, chats: trendMap[key] }));

      // 3. Peak Hours (24 Hours)
      const hourMap = Array(24).fill(0);
      sessions.forEach(s => {
        if (s.created_at) {
          const h = new Date(s.created_at).getHours();
          hourMap[h]++;
        }
      });
      const peakHours = hourMap.map((count, hour) => ({
        hour: `${String(hour).padStart(2, '0')}:00`,
        sessions: count
      }));

      // 4. Intent Breakdown
      const intentCounts = {};
      messages.forEach(m => {
        if (m.role === 'user' && m.intent) {
          const name = m.intent.replace(/_/g, ' ');
          intentCounts[name] = (intentCounts[name] || 0) + 1;
        }
      });
      const intentBreakdown = Object.keys(intentCounts)
        .map(k => ({ name: k, count: intentCounts[k] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // 5. Top Fields
      const fieldCounts = {};
      messages.forEach(m => {
        if (m.detected_field) {
          fieldCounts[m.detected_field] = (fieldCounts[m.detected_field] || 0) + 1;
        }
      });
      const topFields = Object.keys(fieldCounts)
        .map(k => ({ name: k, count: fieldCounts[k] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // 6. Top Courses
      const courseCounts = {};
      messages.forEach(m => {
        if (m.detected_course) {
          courseCounts[m.detected_course] = (courseCounts[m.detected_course] || 0) + 1;
        }
      });
      const topCourses = Object.keys(courseCounts)
        .map(k => ({ name: k, count: courseCounts[k] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // 7. Top Pending Training Questions
      const topPending = trainingItems
        .filter(t => t.status === 'pending')
        .sort((a, b) => (b.occurrences || 1) - (a.occurrences || 1))
        .slice(0, 5);

      // 8. Smart Insights Text Generator
      const smartInsights = [];
      if (totalSessions > 0) {
        smartInsights.push(`EduGuide AI has processed ${totalSessions} student chat sessions with an average depth of ${avgDepth} messages.`);
      } else {
        smartInsights.push("No active student chat sessions recorded yet.");
      }

      if (topFields.length > 0) {
        smartInsights.push(`The most inquired field of study is ${topFields[0].name} (${topFields[0].count} searches).`);
      }
      if (topCourses.length > 0) {
        smartInsights.push(`Top mentioned course by students: ${topCourses[0].name}.`);
      }
      smartInsights.push(`AI Response Accuracy is currently estimated at ${aiAccuracy}% with a ${fallbackRate}% fallback rate.`);

      return {
        totalSessions,
        totalMessages,
        avgDepth,
        pendingTraining,
        trainedCount,
        trainingCompletion,
        aiAccuracy,
        fallbackRate,
        trainedResponseRate,
        intentBreakdown,
        weeklyTrend,
        peakHours,
        topFields,
        topCourses,
        topPending,
        smartInsights
      };
    } catch (err) {
      console.error('Error calculating analytics insights:', err);
      return {
        totalSessions: 0,
        totalMessages: 0,
        avgDepth: 0,
        pendingTraining: 0,
        trainedCount: 0,
        trainingCompletion: 100,
        aiAccuracy: 100,
        fallbackRate: 0,
        trainedResponseRate: 100,
        intentBreakdown: [],
        weeklyTrend: [],
        peakHours: [],
        topFields: [],
        topCourses: [],
        topPending: [],
        smartInsights: ["No analytics data available yet."]
      };
    }
  }
}

module.exports = AnalyticsModel;
