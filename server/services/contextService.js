const { supabaseAdmin } = require('../config/supabase');
const ChatModel = require('../models/chatModel');

/**
 * ContextService — manages per-session conversation context.
 * 
 * Stores things like the last detected intent, field of study,
 * and course hint so the chat can maintain continuity across messages.
 * 
 * Uses supabaseAdmin (service_role) to bypass RLS on the server side.
 */
class ContextService {

  // Load the current context object for a chat session
  static async getContext(sessionId) {
    if (!sessionId) return {};

    try {
      const { data, error } = await supabaseAdmin
        .from('chat_sessions')
        .select('context')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      return data?.context || {};
    } catch (err) {
      console.error('[Context] Load error:', err.message);
      return {};
    }
  }

  // Merge new values into the existing session context and save to DB
  static async updateContext(sessionId, newContext) {
    if (!sessionId) return;

    try {
      const current = await this.getContext(sessionId);
      const merged = { ...current, ...newContext };
      await ChatModel.updateSessionContext(sessionId, merged);
      return merged;
    } catch (err) {
      console.error('[Context] Update error:', err.message);
    }
  }

  // Wipe the context for a session (used on "reset" intent)
  static async clearContext(sessionId) {
    if (!sessionId) return;
    try {
      await ChatModel.updateSessionContext(sessionId, {});
    } catch (err) {
      console.error('[Context] Clear error:', err.message);
    }
  }
}

module.exports = ContextService;
