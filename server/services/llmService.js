const llmConfig = require('../config/llm');

/**
 * LlmService — provider-independent text generation.
 * 
 * Supported providers: gemini, openai, anthropic, xai
 * 
 * The provider is chosen per-user via their ai_settings.llmProvider field.
 * Embeddings are always Gemini (handled by EmbeddingService), but chat
 * responses can come from any provider.
 * 
 * To add a new provider:
 * 1. Add its client config in config/llm.js
 * 2. Add a _generateXxx method here
 * 3. Add a case in generateResponse()
 */
class LlmService {

  /**
   * Generate a chat response using the specified provider.
   * Falls back to Gemini if the requested provider isn't configured.
   */
  static async generateResponse(provider = 'gemini', systemPrompt, history, userMessage) {
    const p = provider.toLowerCase();

    try {
      // Check if requested provider is available, fall back to gemini if not
      if ((p === 'openai' || p === 'xai') && llmConfig[p]?.client) {
        return await this._generateOpenAI(p, systemPrompt, history, userMessage);
      } else if (p === 'anthropic' && llmConfig.anthropic?.client) {
        return await this._generateAnthropic(systemPrompt, history, userMessage);
      } else {
        // Default: Gemini
        return await this._generateGemini(systemPrompt, history, userMessage);
      }
    } catch (error) {
      console.error(`[LLM] Error with ${provider}:`, error.message);

      // If the chosen provider failed and it wasn't Gemini, try Gemini as fallback
      if (p !== 'gemini' && llmConfig.gemini?.client) {
        console.warn(`[LLM] Falling back to Gemini...`);
        return await this._generateGemini(systemPrompt, history, userMessage);
      }

      throw error;
    }
  }

  static _sanitizeHistory(history = []) {
    const sanitized = [];
    let lastRole = null;

    for (const msg of history) {
      if (!msg || !msg.content || typeof msg.content !== 'string' || !msg.content.trim()) continue;
      const role = (msg.role === 'assistant' || msg.role === 'model') ? 'model' : 'user';

      if (role === lastRole) {
        if (sanitized.length > 0) {
          sanitized[sanitized.length - 1].content += '\n' + msg.content.trim();
        }
        continue;
      }

      sanitized.push({ role, content: msg.content.trim() });
      lastRole = role;
    }

    return sanitized;
  }

  // ── Gemini (default) ──────────────────────────────────
  static async _generateGemini(systemPrompt, history, userMessage) {
    const client = llmConfig.gemini.client;
    if (!client) throw new Error('Gemini API key is not configured.');

    const sanitizedHistory = this._sanitizeHistory(history);

    // Convert chat history to Gemini's format (user/model roles)
    const contents = sanitizedHistory.map(msg => ({
      role: msg.role === 'model' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Ensure the conversation starts with a user turn if history exists
    if (contents.length > 0 && contents[0].role === 'model') {
      contents.shift();
    }

    // Add the current user message
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

  // ── OpenAI / xAI (both use OpenAI-compatible API) ─────
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

  // ── Anthropic ─────────────────────────────────────────
  static async _generateAnthropic(systemPrompt, history, userMessage) {
    const client = llmConfig.anthropic.client;
    if (!client) throw new Error('Anthropic API key is not configured.');

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
