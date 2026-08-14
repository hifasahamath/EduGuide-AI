const ChatModel = require('../models/chatModel');
const ContextService = require('../services/contextService');
const RagService = require('../services/ragService');
const nlpService = require('../services/nlpService');
const TrainingModel = require('../models/trainingModel');

exports.handleChat = async (req, res) => {
  try {
    const { message, sessionId, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    const isGuest = req.user?.isGuest || req.body?.isGuest || req.body?.userId === 'guest' || userId === 'guest';

    // 1. NLP Pre-processing
    const intent = nlpService.detectIntent(message);
    const entities = nlpService.extractEntities(message);

    // GUEST FLOW — In-memory RAG generation with ZERO Supabase DB persistence
    if (isGuest) {
      const clientHistory = Array.isArray(req.body.history) ? req.body.history : [];
      const ragResponse = await RagService.generateResponse(message, clientHistory, req.user);

      return res.json({
        reply: ragResponse.text,
        intent,
        sessionId: 'guest-session',
        sources: ragResponse.sources,
        followUps: ragResponse.followUps || [],
        isGuest: true
      });
    }

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // 2. Load or Create Session (Registered Users Only)
    let activeSessionId = sessionId;
    if (!activeSessionId) {
      const session = await ChatModel.createSession(userId, message.substring(0, 30) + '...');
      activeSessionId = session.id;
    }

    // 3. Load Chat History
    const sessionData = await ChatModel.getSessionWithMessages(activeSessionId);
    const history = (sessionData?.messages || []).map(m => ({ role: m.role, content: m.content }));

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
    const { supabaseAdmin } = require('../config/supabase');
    
    // Fetch all sessions with messages and user profile details
    const { data: rawSessions, error: sessionErr } = await supabaseAdmin
      .from('chat_sessions')
      .select('*, chat_messages(*), profiles(display_name, email)')
      .order('updated_at', { ascending: false });

    if (sessionErr) {
      console.error('Error fetching admin chat sessions:', sessionErr);
      const { data: simpleSessions } = await supabaseAdmin
        .from('chat_sessions')
        .select('*')
        .order('updated_at', { ascending: false });
        
      const processed = (simpleSessions || []).map(s => ({
        id: s.id,
        user_id: s.user_id,
        userId: s.user_id,
        title: s.title || 'Chat Session',
        status: s.status || 'resolved',
        isSpam: s.is_spam || false,
        messageCount: 0,
        lastMessage: '',
        detectedField: s.context?.lastField || null,
        detectedCourse: s.context?.lastCourse || null,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        messages: []
      }));

      return res.json({
        sessions: processed,
        stats: {
          totalSessions: processed.length,
          chatsToday: processed.length,
          avgMsgsPerChat: 0,
          spamDetected: 0
        }
      });
    }

    // Process sessions
    const processedSessions = (rawSessions || []).map(s => {
      const msgs = Array.isArray(s.chat_messages) ? s.chat_messages : [];
      msgs.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
      
      const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1].content : '';
      const detectedField = msgs.find(m => m.detected_field)?.detected_field || s.context?.lastField || null;
      const detectedCourse = msgs.find(m => m.detected_course)?.detected_course || s.context?.lastCourse || null;
      const userMail = s.profiles?.email || s.profiles?.display_name || s.user_id;

      return {
        id: s.id,
        user_id: s.user_id,
        userId: userMail,
        userName: s.profiles?.display_name || 'Student User',
        userEmail: s.profiles?.email || '',
        title: s.title || 'Chat Session',
        status: s.status || 'resolved',
        isSpam: s.is_spam || false,
        messageCount: msgs.length,
        lastMessage: lastMsg,
        detectedField,
        detectedCourse,
        createdAt: s.created_at,
        updatedAt: s.updated_at,
        messages: msgs
      };
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const todaySessions = processedSessions.filter(s => s.createdAt && String(s.createdAt).startsWith(todayStr));
    const totalMsgs = processedSessions.reduce((acc, s) => acc + s.messageCount, 0);
    const avgMsgs = processedSessions.length > 0 ? (totalMsgs / processedSessions.length).toFixed(1) : 0;
    const spamCount = processedSessions.filter(s => s.isSpam).length;

    return res.json({
      sessions: processedSessions,
      stats: {
        totalSessions: processedSessions.length,
        chatsToday: todaySessions.length,
        avgMsgsPerChat: Number(avgMsgs),
        spamDetected: spamCount
      }
    });
  } catch (error) {
    console.error('Error fetching admin sessions:', error);
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
