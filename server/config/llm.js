/**
 * LLM Provider Configuration
 * 
 * This file initializes the SDK clients for each AI provider.
 * API keys come from .env by default, but the admin can also
 * store/manage keys in the llm_providers Supabase table.
 * 
 * Embedding model: gemini-embedding-2 (outputs 3072-dim vectors)
 * Chat models: configurable per provider
 * 
 * To add a new provider:
 * 1. Install its SDK (npm install ...)
 * 2. Add a section below with client initialization
 * 3. Add a handler in llmService.js
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { GoogleGenAI } = require('@google/genai');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

const config = {
  gemini: {
    client: process.env.GEMINI_API_KEY
      ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
      : null,
    model: 'gemini-2.5-flash',
    embeddingModel: 'gemini-embedding-2',   // 3072-dimensional output
  },

  openai: {
    client: process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key'
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null,
    model: 'gpt-4o-mini',
  },

  anthropic: {
    client: process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key'
      ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
      : null,
    model: 'claude-3-5-haiku-latest',
  },

  xai: {
    // xAI uses the OpenAI-compatible API format
    client: process.env.XAI_API_KEY && process.env.XAI_API_KEY !== 'your_xai_api_key'
      ? new OpenAI({
          apiKey: process.env.XAI_API_KEY,
          baseURL: 'https://api.x.ai/v1'
        })
      : null,
    model: 'grok-beta',
  }
};

module.exports = config;
