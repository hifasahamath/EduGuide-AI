const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Gemini is used ONLY as a fallback when:
 * - No matching course found in DB
 * - Unknown question / general advice needed
 *
 * It does NOT dump full course details.
 * It gives short, natural, focused answers.
 */
const geminiService = {
  getAIResponse: async (_, userMessage) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return "I'm not sure about that. Could you tell me more about what you're looking for? I can help with courses, fees, or locations.";
      }

      const systemInstruction = `You are EduGuide AI, a friendly education consultant in Sri Lanka.
STRICT RULES:
- Answer ONLY what the student asked. One thing at a time.
- Keep response under 3 sentences.
- Do NOT list multiple courses or dump data.
- Do NOT use bullet points unless user asked for a list.
- Be conversational and natural like a human advisor.
- If you don't know something specific, say "I'd recommend contacting the institution directly for the latest information."`;

      const fullPrompt = `${systemInstruction}\n\nStudent: ${userMessage}\nEduGuide AI:`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: { temperature: 0.5, maxOutputTokens: 150 }
      });

      return response.text?.trim() || "I'm not sure about that. Could you ask me something about courses, fees, or locations?";
    } catch (error) {
      console.error("Gemini fallback error:", error.message);
      return "I'm having a moment. Could you rephrase or try again? I'm here to help with courses, fees, and more!";
    }
  }
};

module.exports = { geminiService };
