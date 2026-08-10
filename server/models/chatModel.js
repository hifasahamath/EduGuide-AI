const { supabase } = require('../config/supabase');

class ChatModel {
  static async createSession(userId, title = 'New Chat') {
    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{ user_id: userId, title }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async getUserSessions(userId) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('pinned', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  }

  static async getSessionWithMessages(sessionId) {
    const { data: session, error: sessionErr } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();
      
    if (sessionErr) throw sessionErr;

    const { data: messages, error: msgErr } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
      
    if (msgErr) throw msgErr;
    
    return { ...session, messages };
  }

  static async addMessage(sessionId, messageData) {
    // messageData: { role, content, intent, detected_field, detected_course, metadata }
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{ session_id: sessionId, ...messageData }])
      .select()
      .single();
      
    if (error) throw error;
    
    // Update session updated_at
    await supabase
      .from('chat_sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId);
      
    return data;
  }

  static async updateSessionContext(sessionId, context) {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ context, updated_at: new Date().toISOString() })
      .eq('id', sessionId);
    if (error) throw error;
  }
  
  static async rename(sessionId, title) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({ title })
      .eq('id', sessionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  
  static async pin(sessionId, pinned) {
    const { data, error } = await supabase
      .from('chat_sessions')
      .update({ pinned })
      .eq('id', sessionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  
  static async delete(sessionId) {
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);
    if (error) throw error;
    return true;
  }
}

module.exports = ChatModel;
