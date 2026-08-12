const fs = require('fs');
const path = require('path');
const EmbeddingService = require('../server/services/embeddingService');
const RagService = require('../server/services/ragService');

async function testRags() {
  console.log('--- Testing Semantic Chunking ---');
  const kbText = fs.readFileSync(path.join(__dirname, '../SriLanka_HigherEducation_KnowledgeBase.txt'), 'utf8');
  const chunks = EmbeddingService.chunkText(kbText);
  console.log(`Extracted ${chunks.length} chunks with sliding window overlap.`);
  chunks.forEach((c, idx) => {
    console.log(`\n--- CHUNK ${idx + 1} (${c.length} chars) ---`);
    console.log(c.slice(0, 150) + '...');
  });
}

testRags().catch(console.error);
