const { supabase } = require('../config/supabase');

class CourseModel {
  static async getAll() {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  static async create(courseData) {
    const { data, error } = await supabase
      .from('courses')
      .insert([courseData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from('courses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }

  static async bulkImport(courses) {
    const { data, error } = await supabase
      .from('courses')
      .insert(courses)
      .select();
    if (error) throw error;
    return data;
  }

  // Vector Search using pgvector
  static async searchSimilar(embedding, matchCount = 5, threshold = 0.3) {
    const { data, error } = await supabase.rpc('match_courses', {
      query_embedding: embedding,
      match_count: matchCount,
      similarity_threshold: threshold
    });
    if (error) throw error;
    return data;
  }
}

module.exports = CourseModel;
