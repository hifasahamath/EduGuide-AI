const { supabase } = require('../config/supabase');


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
