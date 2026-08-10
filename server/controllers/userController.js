const UserModel = require('../models/userModel');

exports.getAllUsers = async (req, res) => {
  try {
    const data = await UserModel.getAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.getUser = async (req, res) => {
  try {
    const data = await UserModel.getById(req.params.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    // Whitelist allowed fields to prevent role escalation or id tampering
    const { display_name, phone, school_name, academic_level, interests, 
            preferred_language, profile_pic, blocked, notification_prefs, 
            contact_info, ai_settings } = req.body;
    
    const updates = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (phone !== undefined) updates.phone = phone;
    if (school_name !== undefined) updates.school_name = school_name;
    if (academic_level !== undefined) updates.academic_level = academic_level;
    if (interests !== undefined) updates.interests = interests;
    if (preferred_language !== undefined) updates.preferred_language = preferred_language;
    if (profile_pic !== undefined) updates.profile_pic = profile_pic;
    if (blocked !== undefined) updates.blocked = blocked;
    if (notification_prefs !== undefined) updates.notification_prefs = notification_prefs;
    if (contact_info !== undefined) updates.contact_info = contact_info;
    if (ai_settings !== undefined) updates.ai_settings = ai_settings;
    // NOTE: 'role' and 'id' are intentionally excluded — use the dedicated changeRole endpoint

    const data = await UserModel.update(req.params.id, updates);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

exports.blockUser = async (req, res) => {
  try {
    const data = await UserModel.block(req.params.id, req.body.blocked);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to block/unblock user' });
  }
};

exports.changeRole = async (req, res) => {
  try {
    const data = await UserModel.updateRole(req.params.id, req.body.role);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to change role' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await UserModel.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};
