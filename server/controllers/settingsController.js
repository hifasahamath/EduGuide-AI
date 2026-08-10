const { supabaseAdmin: supabase } = require('../config/supabase');


exports.getSettings = async (req, res) => {
  try {
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { data } = await supabase.from('settings').select('*').eq('user_id', req.params.userId).single();
    res.json(data?.data || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

exports.saveSettings = async (req, res) => {
  try {
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Upsert settings
    const { data: current } = await supabase.from('settings').select('*').eq('user_id', req.params.userId).single();
    
    let result;
    if (current) {
      const merged = { ...current.data, ...req.body };
      result = await supabase.from('settings').update({ data: merged, updated_at: new Date().toISOString() }).eq('user_id', req.params.userId).select().single();
    } else {
      result = await supabase.from('settings').insert([{ user_id: req.params.userId, data: req.body }]).select().single();
    }
    
    res.json(result.data.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings' });
  }
};

exports.clearAllChats = async (req, res) => {
  try {
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { error } = await supabase.from('chat_sessions').delete().eq('user_id', req.params.userId);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear chats' });
  }
};

exports.exportData = async (req, res) => {
  try {
    if (req.user.id !== req.params.userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const [profileData, settingsData, chatSessions] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', req.params.userId).single(),
      supabase.from('settings').select('*').eq('user_id', req.params.userId).single(),
      supabase.from('chat_sessions').select('*, chat_messages(*)').eq('user_id', req.params.userId)
    ]);
    
    const exportPayload = {
      exported_at: new Date().toISOString(),
      profile: profileData.data,
      settings: settingsData.data,
      chat_history: chatSessions.data
    };
    
    res.setHeader('Content-disposition', `attachment; filename=eduguide_export_${req.params.userId}.json`);
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify(exportPayload, null, 2));
  } catch (error) {
    res.status(500).json({ error: 'Failed to export data' });
  }
};
