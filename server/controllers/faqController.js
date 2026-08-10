const FaqModel = require('../models/faqModel');
const EmbeddingService = require('../services/embeddingService');

exports.getFaqs = async (req, res) => {
  try {
    const data = await FaqModel.getAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch FAQs' });
  }
};

exports.addFaq = async (req, res) => {
  try {
    const textToEmbed = `Question: ${req.body.question}\nAnswer: ${req.body.answer}`;
    const embedding = await EmbeddingService.generateEmbedding(textToEmbed);
    
    const data = await FaqModel.create({ ...req.body, embedding });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add FAQ' });
  }
};

exports.updateFaq = async (req, res) => {
  try {
    const textToEmbed = `Question: ${req.body.question}\nAnswer: ${req.body.answer}`;
    const embedding = await EmbeddingService.generateEmbedding(textToEmbed);
    
    const data = await FaqModel.update(req.params.id, { ...req.body, embedding });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update FAQ' });
  }
};

exports.deleteFaq = async (req, res) => {
  try {
    await FaqModel.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete FAQ' });
  }
};

exports.incrementAskCount = async (req, res) => {
  try {
    await FaqModel.incrementAskCount(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to increment ask count' });
  }
};

exports.suggestFaq = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 3) return res.json([]);
    
    const embedding = await EmbeddingService.generateEmbedding(q);
    const data = await FaqModel.searchSimilar(embedding, 3, 0.4);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to suggest FAQs' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    // In a real app this would aggregate metrics.
    // We just return dummy metrics for now to satisfy the frontend component.
    res.json({
      totalFaqs: 25,
      totalAsks: 150,
      mostAskedCategory: 'Fees'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch FAQ analytics' });
  }
};
