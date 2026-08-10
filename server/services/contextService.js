const { supabase } = require('../config/supabase');
const ChatModel = require('../models/chatModel');

class ContextService {
  /**
   * Load context from Supabase chat_sessions table
   * @param {string} sessionId 
   */
  static async getContext(sessionId) {
    if (!sessionId) return {};
    
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('context')
        .eq('id', sessionId)
        .single();
        
      if (error) throw error;
      return data?.context || {};
    } catch (err) {
      console.error("Context Load Error:", err);
      return {};
    }
  }

  /**
   * Update and persist context back to Supabase
   * @param {string} sessionId 
   * @param {object} newContext 
   */
  static async updateContext(sessionId, newContext) {
    if (!sessionId) return;
    
    try {
      const current = await this.getContext(sessionId);
      const merged = { ...current, ...newContext };
      
      await ChatModel.updateSessionContext(sessionId, merged);
      return merged;
    } catch (err) {
      console.error("Context Update Error:", err);
    }
  }

  static async clearContext(sessionId) {
    if (!sessionId) return;
    try {
      await ChatModel.updateSessionContext(sessionId, {});
    } catch (err) {
      console.error("Context Clear Error:", err);
    }
  }
}

module.exports = ContextService;
