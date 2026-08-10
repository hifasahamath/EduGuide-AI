const TrainingModel = require('../models/trainingModel');
const DocumentModel = require('../models/documentModel');
const EmbeddingService = require('../services/embeddingService');
const FileParsingService = require('../services/fileParsingService');

exports.getPending = async (req, res) => {
  try {
    const data = await TrainingModel.getPending();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending training' });
  }
};

exports.getTrained = async (req, res) => {
  try {
    const data = await TrainingModel.getTrained();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trained data' });
  }
};

exports.respond = async (req, res) => {
  try {
    const { id, response } = req.body;
    
    // 1. Update the record
    const updated = await TrainingModel.respond(id, response);
    
    // 2. Generate embedding for the QA pair
    const textToEmbed = `Question: ${updated.user_input}\nAnswer: ${response}`;
    const embedding = await EmbeddingService.generateEmbedding(textToEmbed);
    
    // 3. Save embedding
    await TrainingModel.updateEmbedding(id, embedding);

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Training Error:', error);
    res.status(500).json({ error: 'Failed to save training response' });
  }
};

exports.deleteTraining = async (req, res) => {
  try {
    await TrainingModel.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete training data' });
  }
};

// ------------------------------------------------------------------
// MULTI-MODAL DOCUMENT UPLOADS FOR RAG
// ------------------------------------------------------------------

exports.getDocuments = async (req, res) => {
  try {
    const data = await DocumentModel.getAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, mimetype, buffer } = req.file;
    const title = req.body.title || originalname;

    // 1. Parse Text from File
    const extractedText = await FileParsingService.extractText(buffer, mimetype);
    
    // 2. Chunk Text
    const chunks = EmbeddingService.chunkText(extractedText);
    
    // 3. Optional: Upload file to Supabase Storage
    const { supabaseAdmin } = require('../config/supabase');
    const safeFilename = `${Date.now()}-${originalname.replace(/\s+/g, '_')}`;
    const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
      .from('training_documents')
      .upload(safeFilename, buffer, { contentType: mimetype });
      
    const file_url = uploadErr ? '' : supabaseAdmin.storage.from('training_documents').getPublicUrl(safeFilename).data.publicUrl;

    // 4. Embed and Save Chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const embedding = await EmbeddingService.generateEmbedding(chunkText);
      
      await DocumentModel.create({
        title,
        filename: originalname,
        file_url,
        file_type: mimetype,
        content: chunkText,
        chunk_index: i,
        embedding
      });
    }

    res.json({ success: true, chunksProcessed: chunks.length, file_url });
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Failed to process document upload: ' + error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    await DocumentModel.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete document' });
  }
};
