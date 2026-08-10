const { supabaseAdmin } = require('../config/supabase');

class UserModel {
  static async getById(id) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  static async getAll() {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async updateRole(id, role) {
    return this.update(id, { role });
  }

  static async block(id, blocked) {
    return this.update(id, { blocked });
  }

  static async delete(id) {
    // Need to use Supabase admin API to delete the auth user
    // The profile will be cascade deleted
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;
    return true;
  }

  static async logActivity(userId, type, description, device = 'Unknown', ip = '0.0.0.0') {
    const { error } = await supabaseAdmin
      .from('activity_log')
      .insert([{ user_id: userId, type, description, device, ip }]);
    if (error) console.error('Error logging activity:', error);
  }
}

module.exports = UserModel;
