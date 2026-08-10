const CourseModel = require('../models/courseModel');
const EmbeddingService = require('../services/embeddingService');

exports.getCourses = async (req, res) => {
  try {
    const data = await CourseModel.getAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

exports.addCourse = async (req, res) => {
  try {
    // Generate embedding for RAG
    const textToEmbed = `Course Name: ${req.body.name}\nField: ${req.body.field}\nDescription: ${req.body.eligibility}\nSubjects: ${req.body.subjects?.join(', ')}`;
    const embedding = await EmbeddingService.generateEmbedding(textToEmbed);
    
    const data = await CourseModel.create({ ...req.body, embedding });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add course' });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    // Re-generate embedding
    const textToEmbed = `Course Name: ${req.body.name}\nField: ${req.body.field}\nDescription: ${req.body.eligibility}\nSubjects: ${req.body.subjects?.join(', ')}`;
    const embedding = await EmbeddingService.generateEmbedding(textToEmbed);
    
    const data = await CourseModel.update(req.params.id, { ...req.body, embedding });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update course' });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    await CourseModel.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
};

exports.bulkImportCourses = async (req, res) => {
  try {
    const courses = req.body;
    if (!Array.isArray(courses)) return res.status(400).json({ error: 'Expected an array' });
    
    // In a real prod environment, we would batch embeddings to avoid hitting API rate limits.
    // For now, we do them sequentially or in small chunks.
    const enriched = [];
    for (const c of courses) {
      const textToEmbed = `Course Name: ${c.name}\nField: ${c.field}\nDescription: ${c.eligibility}\nSubjects: ${c.subjects?.join(', ')}`;
      const embedding = await EmbeddingService.generateEmbedding(textToEmbed);
      enriched.push({ ...c, embedding });
    }

    const data = await CourseModel.bulkImport(enriched);
    res.json({ success: true, imported: data.length });
  } catch (error) {
    console.error('Bulk Import Error:', error);
    res.status(500).json({ error: 'Failed to bulk import courses' });
  }
};
