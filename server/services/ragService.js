const EmbeddingService = require('./embeddingService');
const LlmService = require('./llmService');
const FaqModel = require('../models/faqModel');
const CourseModel = require('../models/courseModel');
const DocumentModel = require('../models/documentModel');

class RagService {
  /**
   * Execute the full Retrieval-Augmented Generation pipeline.
   * 1. Embed user query
   * 2. Search Postgres pgvector (FAQs, Courses, Documents)
   * 3. Construct augmented prompt
   * 4. Generate response via chosen LLM provider
   * 
   * @param {string} userMessage 
   * @param {Array} history 
   * @param {Object} userProfile (contains ai_settings.llmProvider)
   */
  static async generateResponse(userMessage, history, userProfile) {
    const provider = userProfile?.ai_settings?.llmProvider || 'gemini';
    const strictMode = userProfile?.ai_settings?.mode === 'strict';

    // 1. Generate query embedding (Always uses Gemini embeddings)
    const embedding = await EmbeddingService.generateEmbedding(userMessage);

    // 2. Parallel Vector Search across 3 collections
    const [faqs, courses, documents] = await Promise.all([
      FaqModel.searchSimilar(embedding, 2, 0.4),
      CourseModel.searchSimilar(embedding, 3, 0.35),
      DocumentModel.searchSimilar(embedding, 3, 0.4) // Uploaded PDFs/Word etc.
    ]);

    // 3. Build the Context String
    let contextStr = '';
    
    if (faqs && faqs.length > 0) {
      contextStr += '### RELEVANT FAQs ###\n';
      faqs.forEach(f => {
        contextStr += `Q: ${f.question}\nA: ${f.answer}\n\n`;
      });
    }

    if (courses && courses.length > 0) {
      contextStr += '### RELEVANT COURSES ###\n';
      courses.forEach(c => {
        contextStr += `Course Name: ${c.name}\nField: ${c.field}\nEligibility: ${c.eligibility}\nSubjects: ${c.subjects?.join(', ')}\n\n`;
      });
    }

    if (documents && documents.length > 0) {
      contextStr += '### RELEVANT KNOWLEDGE BASE ###\n';
      documents.forEach(d => {
        contextStr += `Source (${d.title}): ${d.content}\n\n`;
      });
    }

    if (!contextStr) {
      contextStr = "No highly relevant specific information found in the database. Rely on general knowledge.";
    }

    // 4. Construct System Prompt
    let systemPrompt = `You are EduGuide-AI, an expert educational consultant for Sri Lanka.
Your goal is to help students find the right courses and answer their questions based ONLY on the provided context.
    
${strictMode ? 'STRICT MODE: If the answer is not in the context, you MUST say you do not know. Do not hallucinate external information.' : 'SMART MODE: Use the provided context first. If not found, use your general knowledge, but clarify it is general advice.'}

=== RETRIEVED CONTEXT ===
${contextStr}
=========================

Guidelines:
- Keep answers concise, clear, and encouraging.
- Format responses cleanly with markdown.
- If recommending a course, mention its name and why it fits.`;

    // 5. Generate Response via chosen LLM Provider
    const responseText = await LlmService.generateResponse(
      provider,
      systemPrompt,
      history,
      userMessage
    );

    return {
      text: responseText,
      sources: { faqs: faqs?.length, courses: courses?.length, documents: documents?.length }
    };
  }
}

module.exports = RagService;
