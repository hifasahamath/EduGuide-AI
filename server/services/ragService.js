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
  static async generateResponse(userMessage, history = [], userProfile = {}) {
    const provider = userProfile?.ai_settings?.llmProvider || 'gemini';
    const strictMode = userProfile?.ai_settings?.mode === 'strict';

    // Step 1: Formulate context-aware query for vector embedding search
    let searchQuery = userMessage;
    const isFollowup = history.length > 0 && (
      userMessage.length < 30 ||
      /\b(this|that|it|they|them|the grant|the course|the university|deadline|requirement|apply|fee|cost|eligibility|gpa)\b/i.test(userMessage)
    );

    if (isFollowup) {
      const recentHistory = history.slice(-2).map(m => m.content).join(' ');
      searchQuery = `${recentHistory} ${userMessage}`;
    }

    // Embed the query for similarity search
    const embedding = await EmbeddingService.generateEmbedding(searchQuery);

    // Step 2: Search our knowledge base in parallel
    const [faqs, courses, documents] = await Promise.all([
      FaqModel.searchSimilar(embedding, 2, 0.38),
      CourseModel.searchSimilar(embedding, 3, 0.35),
      DocumentModel.searchSimilar(embedding, 3, 0.35)
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

    if (!contextStr) {
      contextStr = 'No relevant information found in the knowledge base for this question.';
    }

    // Step 4: Build system prompt with follow-up questions directive
    const systemPrompt = `You are EduGuide-AI, a warm, highly knowledgeable, and empathetic Senior Educational Advisor & Career Consultant in Sri Lanka.
Your mission is to guide students, parents, and job seekers towards the best academic pathways, university programs, scholarships, and career opportunities in Sri Lanka and globally.

${strictMode
  ? 'STRICT MODE: You MUST base your answers strictly on the verified knowledge base provided below. If the answer or specific detail is not present in the context, politely inform the user that you don\'t have that verified document detail yet, and offer general academic guidance.'
  : 'SMART MODE: Prioritize the verified knowledge base context provided below as your main truth. Synthesize facts smoothly into natural, conversational, human advice. If the context does not contain the answer, draw from your extensive knowledge of Sri Lankan higher education (UGC Z-Score rules, A/L streams, State Universities, Non-State Campuses, Interest-Free Student Loan Schemes, and Mahapola Bursaries) to provide helpful, realistic guidance.'}

=== VERIFIED KNOWLEDGE BASE CONTEXT ===
${contextStr}
=======================================

Tone & Response Guidelines:
1. GREETING RULE: ALWAYS greet the user with "Hello!" or "Hello!" followed by how you can help. NEVER use "Ayubowan", "Ayubovan", or any local dialect greetings unless the user explicitly speaks to you in Sinhala or Tamil. Always use friendly, professional English.
2. NATURAL SYNTHESIS: Never copy raw text chunks verbatim or sound robotic. Blend facts into smooth, engaging, and professional advice.
3. CLEAR STRUCTURE: Use markdown headings (##, ###), bullet points, bold key terms, and callout boxes where appropriate.
4. ACCURACY FIRST: Preserve exact figures, grant codes, deadlines, GPA cutoffs, fees, and contact details without distortion.
5. SRI LANKAN CONTEXT AWARENESS: Be familiar with A/L streams, UGC Z-score mechanisms, Mahapola scholarships, and Ministry student loans.
6. CONVERSATIONAL MEMORY & FOLLOW-UP SUGGESTIONS: Always remember what was discussed in previous messages in this chat session. At the VERY END of your response, output exactly 3 relevant, context-aware follow-up question options that the student might want to ask next, formatted strictly as:

---FOLLOWUPS---
- [Follow-up question 1]
- [Follow-up question 2]
- [Follow-up question 3]`;

    // Step 5: Generate response via LLM provider
    const responseText = await LlmService.generateResponse(
      provider,
      systemPrompt,
      history,
      userMessage
    );

    // Step 6: Parse follow-up suggestions if present
    let cleanText = responseText;
    let followUps = [];

    const followupSplit = responseText.split('---FOLLOWUPS---');
    if (followupSplit.length > 1) {
      cleanText = followupSplit[0].trim();
      const rawFollowups = followupSplit[1].trim();
      followUps = rawFollowups
        .split('\n')
        .map(line => line.replace(/^[-*•\d.\s]+/, '').trim())
        .filter(Boolean)
        .slice(0, 3);
    }

    // Step 7: Sanitize greetings — replace any "Ayubowan" with "Hello"
    cleanText = cleanText.replace(/\bAyubowan\b[!,.\s]*/gi, 'Hello! ').trim();

    return {
      text: cleanText,
      followUps,
      sources: {
        faqs: faqs?.length || 0,
        courses: courses?.length || 0,
        documents: documents?.length || 0
      }
    };
  }
}

module.exports = RagService;
