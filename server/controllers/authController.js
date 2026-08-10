const UserModel = require('../models/userModel');

// Note: Actual login/register is handled by Supabase Auth on the client side.
// The server just handles Profile data using the JWT sent in the header.

exports.getProfile = async (req, res) => {
  try {
    const profile = await UserModel.getById(req.params.id);
    // Ensure users can only get their own profile unless they are admin
    if (req.user.id !== profile.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    // Allowed fields to update
    const { display_name, phone, school_name, academic_level, interests, preferred_language, profile_pic } = req.body;
    
    const updates = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (phone !== undefined) updates.phone = phone;
    if (school_name !== undefined) updates.school_name = school_name;
    if (academic_level !== undefined) updates.academic_level = academic_level;
    if (interests !== undefined) updates.interests = interests;
    if (preferred_language !== undefined) updates.preferred_language = preferred_language;
    if (profile_pic !== undefined) updates.profile_pic = profile_pic;

    const profile = await UserModel.update(req.params.id, updates);
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

exports.updateAiSettings = async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const profile = await UserModel.update(req.params.id, { ai_settings: req.body });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update AI settings' });
  }
};

exports.updateNotifications = async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const profile = await UserModel.update(req.params.id, { notification_prefs: req.body });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification preferences' });
  }
};

exports.updateContact = async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const profile = await UserModel.update(req.params.id, { contact_info: req.body });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contact info' });
  }
};

exports.getActivityLog = async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { supabaseAdmin } = require('../config/supabase');
    const { data } = await supabaseAdmin
      .from('activity_log')
      .select('*')
      .eq('user_id', req.params.id)
      .order('created_at', { ascending: false })
      .limit(30);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get activity log' });
  }
};

exports.logActivity = async (req, res) => {
  try {
    const { type, description, device, ip } = req.body;
    await UserModel.logActivity(req.params.id, type, description, device, ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log activity' });
  }
};