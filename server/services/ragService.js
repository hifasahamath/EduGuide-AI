const EmbeddingService = require('./embeddingService');
const LlmService = require('./llmService');
const FaqModel = require('../models/faqModel');
const CourseModel = require('../models/courseModel');
const DocumentModel = require('../models/documentModel');

/**
 * RagService — Retrieval-Augmented Generation pipeline.
 * 
 * How it works:
 * 1. Embed the user's question into a vector
 * 2. Search our own knowledge base (FAQs, courses, uploaded documents, trained Q&A)
 * 3. If matches are found, build a context prompt from those results
 * 4. Send the context + question to the LLM for a natural language response
 * 5. If no relevant knowledge found, the question gets flagged for admin training
 * 
 * The AI should always prioritise our own knowledge over general AI knowledge.
 * This ensures accuracy and gives the admin control over what the bot says.
 */
class RagService {

  /**
   * Generate a response using our knowledge base + LLM.
   * 
   * @param {string} userMessage  - The user's question
   * @param {Array}  history      - Previous messages in this chat session
   * @param {Object} userProfile  - The user's profile (contains AI settings like provider choice)
   */
  static async generateResponse(userMessage, history, userProfile) {
    const provider = userProfile?.ai_settings?.llmProvider || 'gemini';
    const strictMode = userProfile?.ai_settings?.mode === 'strict';

    // Step 1: Embed the user's question (always uses Gemini embeddings)
    const embedding = await EmbeddingService.generateEmbedding(userMessage);

    // Step 2: Search our knowledge base in parallel
    const [faqs, courses, documents] = await Promise.all([
      FaqModel.searchSimilar(embedding, 2, 0.4),
      CourseModel.searchSimilar(embedding, 3, 0.35),
      DocumentModel.searchSimilar(embedding, 3, 0.4)
    ]);

    // Step 3: Build the context from search results
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

    // If nothing relevant was found in our knowledge base
    if (!contextStr) {
      contextStr = 'No relevant information found in the knowledge base for this question.';
    }

    // Step 4: Build the system prompt
    // The AI is instructed to use our knowledge first, and only fall back to
    // general knowledge if explicitly allowed (smart mode, not strict mode).
    const systemPrompt = `You are EduGuide-AI, an expert educational consultant for Sri Lanka.
Your primary job is to help students find courses and answer education questions.

${strictMode
  ? 'STRICT MODE: You MUST answer ONLY from the provided context below. If the answer is not in the context, say "I don\'t have that information yet. Your question has been noted and our team will add an answer soon." Do NOT use external knowledge.'
  : 'SMART MODE: Use the provided context as your primary source. If the context has a good answer, use it. If the context has nothing relevant, you may use general knowledge but clearly note it as general advice, not verified information.'}

=== OUR KNOWLEDGE BASE ===
${contextStr}
===========================

Guidelines:
- Keep answers concise, clear, and encouraging.
- Format responses with markdown for readability.
- When recommending a course, mention its name and why it fits.
- Never invent course details (fees, duration, etc.) that aren't in the context.
- If asked about something outside education, politely redirect to education topics.`;

    // Step 5: Generate response via the chosen LLM provider
    const responseText = await LlmService.generateResponse(
      provider,
      systemPrompt,
      history,
      userMessage
    );

    return {
      text: responseText,
      sources: {
        faqs: faqs?.length || 0,
        courses: courses?.length || 0,
        documents: documents?.length || 0
      }
    };
  }
}

module.exports = RagService;
