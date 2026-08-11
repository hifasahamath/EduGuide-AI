const llmConfig = require('../config/llm');

/**
 * EmbeddingService — generates vector embeddings for text.
 * 
 * Always uses Gemini for embeddings (gemini-embedding-2, 3072 dimensions)
 * regardless of which LLM provider is used for chat responses.
 * This keeps all vectors in the same dimensional space for consistent search.
 */
class EmbeddingService {

  /**
   * Generate a 3072-dimensional embedding vector for the given text.
   * The vector is stored in Supabase and used for cosine similarity search.
   */
  static async generateEmbedding(text) {
    try {
      const gemini = llmConfig.gemini.client;
      if (!gemini) {
        throw new Error('Gemini API key is not configured — needed for embeddings.');
      }

      const response = await gemini.models.embedContent({
        model: llmConfig.gemini.embeddingModel,
        contents: text,
      });

      return response.embeddings[0].values;
    } catch (error) {
      console.error('[Embedding] Generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Split large text into smaller chunks for individual embedding.
   * Uses paragraph boundaries as natural split points.
   * Each chunk stays under maxLength characters.
   */
  static chunkText(text, maxLength = 2000) {
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
