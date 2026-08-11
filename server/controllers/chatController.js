const ChatModel = require('../models/chatModel');
const ContextService = require('../services/contextService');
const RagService = require('../services/ragService');
const nlpService = require('../services/nlpService');
const TrainingModel = require('../models/trainingModel');

exports.handleChat = async (req, res) => {
  try {
    const { message, sessionId, userId } = req.body;

    if (!message || !userId) {
      return res.status(400).json({ error: 'Missing message or userId' });
    }

    // 1. NLP Pre-processing
    const intent = nlpService.detectIntent(message);
    const entities = nlpService.extractEntities(message);

    // 2. Load or Create Session
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const session = await ChatModel.createSession(userId, message.substring(0, 30) + '...');
      activeSessionId = session.id;
    }

    // 3. Load Chat History
    const sessionData = await ChatModel.getSessionWithMessages(activeSessionId);
    const history = sessionData.messages.map(m => ({ role: m.role, content: m.content }));

    // 4. Update Context
    await ContextService.updateContext(activeSessionId, {
      lastIntent: intent,
      lastField: entities.field,
      lastCourse: entities.courseHint
    });

    // 5. Save User Message
    await ChatModel.addMessage(activeSessionId, {
      role: 'user',
      content: message,
      intent,
      detected_field: entities.field,
      detected_course: entities.courseHint
    });

    // 6. RAG Pipeline Generation
    const ragResponse = await RagService.generateResponse(message, history, req.user);
    
    // Fallback detection (if strict mode fails or RAG finds nothing and returns a specific fallback string)
    // We can also analyze the response text, or rely on intent = 'unknown'
    if (intent === 'unknown' || ragResponse.text.includes('I do not know')) {
      await TrainingModel.storeUnknown(message, intent);
    }

    // 7. Save Assistant Message
    await ChatModel.addMessage(activeSessionId, {
      role: 'assistant',
      content: ragResponse.text,
      metadata: { 
        sources: ragResponse.sources,
        followUps: ragResponse.followUps || []
      }
    });

    return res.json({
      reply: ragResponse.text,
      intent,
      sessionId: activeSessionId,
      sources: ragResponse.sources,
      followUps: ragResponse.followUps || []
    });

  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: 'Chat processing failed' });
  }
};

exports.getChatHistory = async (req, res) => {
  try {
    const sessions = await ChatModel.getUserSessions(req.user.id);
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
};

exports.createSession = async (req, res) => {
  try {
    const session = await ChatModel.createSession(req.user.id, req.body.title);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create session' });
  }
};

exports.getSession = async (req, res) => {
  try {
    const session = await ChatModel.getSessionWithMessages(req.params.chatId);
    if (session.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    await ChatModel.delete(req.params.chatId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
};

exports.renameSession = async (req, res) => {
  try {
    const session = await ChatModel.rename(req.params.chatId, req.body.title);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to rename session' });
  }
};

exports.pinSession = async (req, res) => {
  try {
    const session = await ChatModel.pin(req.params.chatId, req.body.pinned);
    res.json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to pin session' });
  }
};

// Admin handlers
exports.getAllSessions = async (req, res) => {
  try {
    // simplified for admin view
    const { supabaseAdmin } = require('../config/supabase');
    const { data } = await supabaseAdmin.from('chat_sessions').select('*, profiles(display_name, email)');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch all sessions' });
  }
};

exports.markResolved = async (req, res) => {
  try {
    const { supabaseAdmin } = require('../config/supabase');
    await supabaseAdmin.from('chat_sessions').update({ status: 'resolved' }).eq('id', req.params.chatId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark resolved' });
  }
};
