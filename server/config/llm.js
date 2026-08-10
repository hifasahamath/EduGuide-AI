const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { GoogleGenAI } = require('@google/genai');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');

const config = {
  gemini: {
    client: process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null,
    model: 'gemini-2.5-flash',
    embeddingModel: 'text-embedding-004'
  },
  openai: {
    client: process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null,
    model: 'gpt-4o-mini',
  },
  anthropic: {
    client: process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null,
    model: 'claude-3-5-haiku-latest',
  },
  xai: {
    // xAI uses OpenAI compatible API
    client: process.env.XAI_API_KEY ? new OpenAI({ 
      apiKey: process.env.XAI_API_KEY, 
      baseURL: "https://api.x.ai/v1" 
    }) : null,
    model: 'grok-beta',
  }
};

module.exports = config;
