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
    
    const {
      display_name, name, phone, school_name, schoolName,
      academic_level, age, interests, preferred_language, language,
      profile_pic, profilePic
    } = req.body;
    
    const updates = {};
    const dName = display_name !== undefined ? display_name : name;
    if (dName !== undefined) updates.display_name = dName;
    if (phone !== undefined) updates.phone = phone;
    const sName = school_name !== undefined ? school_name : schoolName;
    if (sName !== undefined) updates.school_name = sName;
    if (academic_level !== undefined) updates.academic_level = academic_level;
    const lang = preferred_language !== undefined ? preferred_language : language;
    if (lang !== undefined) updates.preferred_language = lang;
    const pPic = profile_pic !== undefined ? profile_pic : profilePic;
    if (pPic !== undefined) updates.profile_pic = pPic;

    const profile = await UserModel.update(req.params.id, updates);
    res.json(profile);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { newPassword, password } = req.body;
    const passToSet = newPassword || password;
    if (!passToSet || passToSet.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    const { supabaseAdmin } = require('../config/supabase');
    const { error } = await supabaseAdmin.auth.admin.updateUserById(req.params.id, {
      password: passToSet
    });
    if (error) throw error;
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Failed to update password: ' + error.message });
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