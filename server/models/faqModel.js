const { supabaseAdmin: supabase } = require('../config/supabase');

/**
 * FaqModel — handles all FAQ CRUD operations.
 * Admin creates Q&A pairs, users can search them via vector similarity.
 */
class FaqModel {

  // Get all FAQs, ordered by most-asked first
  static async getAll() {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('ask_count', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Create a new FAQ entry
  static async create(faqData) {
    const { data, error } = await supabase
      .from('faqs')
      .insert([faqData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Update an existing FAQ
  static async update(id, updates) {
    const { data, error } = await supabase
      .from('faqs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // Delete a FAQ by id
  static async delete(id) {
    const { error } = await supabase
      .from('faqs')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }

  /**
   * Atomically increment the ask_count for a FAQ.
   * Uses a Postgres RPC function to avoid the read-then-write race condition.
   */
  static async incrementAskCount(id) {
    const { error } = await supabase.rpc('increment_faq_ask_count', { faq_id: id });
    if (error) throw error;
    return true;
  }

  // Vector similarity search against FAQ embeddings
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
