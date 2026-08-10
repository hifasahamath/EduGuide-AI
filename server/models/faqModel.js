const { supabase } = require('../config/supabase');

class FaqModel {
  static async getAll() {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('ask_count', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async create(faqData) {
    const { data, error } = await supabase
      .from('faqs')
      .insert([faqData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from('faqs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }

  static async incrementAskCount(id) {
    // In Supabase, usually you'd use an RPC for atomic increment, 
    // but a basic update works for small scale if we fetch first.
    // Or we can create an RPC for this. For now, fetch and update:
    const { data: faq } = await supabase.from('faqs').select('ask_count').eq('id', id).single();
    if (!faq) return null;
    
    const { data, error } = await supabase
      .from('faqs')
      .update({ ask_count: (faq.ask_count || 0) + 1 })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async searchSimilar(embedding, matchCount = 5, threshold = 0.5) {
    const { data, error } = await supabase.rpc('match_faqs', {
      query_embedding: embedding,
      match_count: matchCount,
      similarity_threshold: threshold
    });
    if (error) throw error;
    return data;
  }
}

module.exports = FaqModel;
