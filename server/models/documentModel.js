const { supabase } = require('../config/supabase');

class DocumentModel {
  static async create(docData) {
    // docData: { title, filename, file_url, file_type, content, chunk_index, embedding }
    const { data, error } = await supabase
      .from('documents')
      .insert([docData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async searchSimilar(embedding, matchCount = 5, threshold = 0.5) {
    const { data, error } = await supabase.rpc('match_documents', {
      query_embedding: embedding,
      match_count: matchCount,
      similarity_threshold: threshold
    });
    if (error) throw error;
    return data;
  }

  static async getAll() {
    const { data, error } = await supabase
      .from('documents')
      .select('id, title, filename, file_url, file_type, chunk_index, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
}

module.exports = DocumentModel;
