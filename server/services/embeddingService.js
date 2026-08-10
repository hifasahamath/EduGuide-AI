const llmConfig = require('../config/llm');

class EmbeddingService {
  /**
   * Generate an embedding vector using Gemini's text-embedding-004 model (768 dimensions)
   * We use Gemini for embeddings regardless of the chat LLM provider to maintain vector consistency.
   * 
   * @param {string} text - The text to embed
   * @returns {Promise<number[]>} - The embedding vector array (length 768)
   */
  static async generateEmbedding(text) {
    try {
      const gemini = llmConfig.gemini.client;
      if (!gemini) {
        throw new Error("Gemini API key is not configured for embeddings.");
      }

      const response = await gemini.models.embedContent({
        model: llmConfig.gemini.embeddingModel,
        contents: text,
      });

      // The returned format from @google/genai SDK v1.51+
      return response.embeddings[0].values;
    } catch (error) {
      console.error("Error generating embedding:", error);
      throw error;
    }
  }

  /**
   * Helper to chunk large text into smaller segments for embedding
   * @param {string} text 
   * @param {number} maxTokens (approx)
   */
  static chunkText(text, maxLength = 2000) {
    // Very basic chunker by paragraphs
    const paragraphs = text.split(/\n\s*\n/);
    const chunks = [];
    let currentChunk = '';

    for (const p of paragraphs) {
      if (currentChunk.length + p.length > maxLength) {
        if (currentChunk) chunks.push(currentChunk.trim());
        currentChunk = p + '\n\n';
      } else {
        currentChunk += p + '\n\n';
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
}

module.exports = EmbeddingService;
