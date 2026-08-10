const { supabase } = require('../config/supabase');

class TrainingModel {
  static async getPending() {
    const { data, error } = await supabase
      .from('training_data')
      .select('*')
      .eq('status', 'pending')
      .order('occurrences', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async getTrained() {
    const { data, error } = await supabase
      .from('training_data')
      .select('*')
      .in('status', ['trained', 'learned'])
      .order('trained_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  static async storeUnknown(userInput, intent = 'unknown') {
    // Check if it exists and is pending
    const { data: existing } = await supabase
      .from('training_data')
      .select('*')
      .eq('user_input', userInput)
      .eq('status', 'pending')
      .single();

    if (existing) {
      // Increment occurrences
      await supabase
        .from('training_data')
        .update({ occurrences: existing.occurrences + 1 })
        .eq('id', existing.id);
      return existing;
    }

    // Insert new
    const { data, error } = await supabase
      .from('training_data')
      .insert([{
        user_input: userInput,
        normalized_input: userInput.toLowerCase(),
        detected_intent: intent,
        status: 'pending',
        response: ''
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  static async respond(id, responseText) {
    const { data, error } = await supabase
      .from('training_data')
      .update({
        response: responseText,
        status: 'trained',
        trained_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  
  static async updateEmbedding(id, embedding) {
    const { error } = await supabase
      .from('training_data')
      .update({ embedding })
      .eq('id', id);
    if (error) throw error;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('training_data')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
}

module.exports = TrainingModel;
