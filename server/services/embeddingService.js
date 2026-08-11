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
   * Uses paragraph boundaries as natural split points with sliding window overlap.
   * Each chunk stays under maxLength characters while preserving trailing overlap
   * to ensure section headers and context stay attached across chunk boundaries.
   */
  static chunkText(text, maxLength = 1800, overlap = 250) {
    if (!text || !text.trim()) return [];

    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    const chunks = [];
    let currentChunk = '';

    for (const p of paragraphs) {
      if ((currentChunk ? (currentChunk + '\n\n' + p) : p).length > maxLength) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          // Retain trailing overlap text from previous chunk
          const tail = currentChunk.slice(-overlap);
          const lastNewline = tail.indexOf('\n');
          const cleanOverlap = lastNewline !== -1 ? tail.slice(lastNewline + 1) : tail;
          currentChunk = cleanOverlap + '\n\n' + p;
        } else {
          currentChunk = p;
        }
      } else {
        currentChunk = currentChunk ? (currentChunk + '\n\n' + p) : p;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}

module.exports = EmbeddingService;
