const { supabase } = require('../config/supabase');

class AnalyticsModel {
  static async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    
    // In a real production app, we would query the daily_analytics table or aggregate.
    // For now, we'll do basic counts using Supabase's count feature.
    
    const [usersResult, coursesResult, chatsResult, pendingResult] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('courses').select('id', { count: 'exact', head: true }),
      supabase.from('chat_sessions').select('id', { count: 'exact', head: true }),
      supabase.from('training_data').select('id', { count: 'exact', head: true }).eq('status', 'pending')
    ]);

    return {
      totalUsers: usersResult.count || 0,
      totalCourses: coursesResult.count || 0,
      totalChats: chatsResult.count || 0,
      pendingTraining: pendingResult.count || 0,
      aiAccuracy: 85, // Mock value, in real app compute from training_data status
      fallbackRate: 15, // Mock value
      chatsToday: 0 // Mock value, query daily_analytics
    };
  }

  static async getInsights() {
    // This would typically be a complex SQL query or RPC in Supabase
    // Returning mock structure for the frontend for now
    return {
      weeklyTrends: [
        { name: 'Mon', chats: 12 }, { name: 'Tue', chats: 19 },
        { name: 'Wed', chats: 15 }, { name: 'Thu', chats: 22 },
        { name: 'Fri', chats: 30 }, { name: 'Sat', chats: 25 },
        { name: 'Sun', chats: 18 }
      ],
      popularFields: [
        { name: 'IT', count: 120 }, { name: 'Business', count: 85 },
        { name: 'Engineering', count: 65 }
      ],
      intents: [
        { name: 'Course Search', value: 45 }, { name: 'Fee Query', value: 25 },
        { name: 'Comparison', value: 15 }, { name: 'Other', value: 15 }
      ]
    };
  }
}

module.exports = AnalyticsModel;
