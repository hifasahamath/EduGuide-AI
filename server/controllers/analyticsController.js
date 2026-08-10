const AnalyticsModel = require('../models/analyticsModel');

exports.getDashboard = async (req, res) => {
  try {
    const data = await AnalyticsModel.getDashboardStats();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load dashboard stats' });
  }
};

exports.getInsights = async (req, res) => {
  try {
    const data = await AnalyticsModel.getInsights();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load insights' });
  }
};

exports.getLegacyCounts = async (req, res) => {
  try {
    const data = await AnalyticsModel.getDashboardStats();
    res.json({
      totalUsers: data.totalUsers,
      totalCourses: data.totalCourses,
      totalChats: data.totalChats,
      pendingTraining: data.pendingTraining
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load basic analytics' });
  }
};
