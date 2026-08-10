const llmConfig = require('../config/llm');

class LlmService {
  /**
   * Generate a response using the specified provider
   * 
   * @param {string} provider - 'gemini', 'openai', 'anthropic', 'xai'
   * @param {string} systemPrompt - The system context/instructions
   * @param {Array} history - Array of { role: 'user'|'assistant', content: string }
   * @param {string} userMessage - The latest user message
   */
  static async generateResponse(provider = 'gemini', systemPrompt, history, userMessage) {
    const p = provider.toLowerCase();
    
    try {
      if (p === 'openai' || p === 'xai') {
        return await this._generateOpenAI(p, systemPrompt, history, userMessage);
      } else if (p === 'anthropic') {
        return await this._generateAnthropic(systemPrompt, history, userMessage);
      } else {
        // Default to Gemini
        return await this._generateGemini(systemPrompt, history, userMessage);
      }
    } catch (error) {
      console.error(`LLM Service Error [${provider}]:`, error);
      throw error;
    }
  }

  static async _generateGemini(systemPrompt, history, userMessage) {
    const client = llmConfig.gemini.client;
    if (!client) throw new Error("Gemini API key is not configured.");

    // Convert standard history to Gemini format (user/model)
    const contents = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Add current message
    contents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const response = await client.models.generateContent({
      model: llmConfig.gemini.model,
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.5,
        maxOutputTokens: 1000
      }
    });

    return response.text;
  }

  static async _generateOpenAI(provider, systemPrompt, history, userMessage) {
    const client = llmConfig[provider].client;
    if (!client) throw new Error(`${provider} API key is not configured.`);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: userMessage }
    ];

    const response = await client.chat.completions.create({
      model: llmConfig[provider].model,
      messages,
      temperature: 0.5,
      max_tokens: 1000
    });

    return response.choices[0].message.content;
  }

  static async _generateAnthropic(systemPrompt, history, userMessage) {
    const client = llmConfig.anthropic.client;
    if (!client) throw new Error("Anthropic API key is not configured.");

    // Anthropic requires strictly alternating user/assistant roles.
    // For simplicity, we assume the history is mostly compliant, but might need cleaning in prod.
    const messages = [
      ...history.map(msg => ({ role: msg.role, content: msg.content })),
      { role: 'user', content: userMessage }
    ];

    const response = await client.messages.create({
      model: llmConfig.anthropic.model,
      system: systemPrompt,
      messages,
      temperature: 0.5,
      max_tokens: 1000
    });

    return response.content[0].text;
  }
}

module.exports = LlmService;
