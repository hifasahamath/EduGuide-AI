const { dbService } = require('./dbService');

const getRecommendations = async (userId, historyArray) => {
  if (!historyArray || historyArray.length === 0) return null;

  // Simple string representation of history
  const allText = historyArray.join(' ').toLowerCase();
  
  // Potential fields
  const fields = ['it', 'software', 'business', 'management', 'design', 'arts', 'science', 'marketing', 'engineering', 'computing'];
  
  let topField = null;
  let maxCount = 0;
  
  fields.forEach(f => {
    // naive keyword count
    const regex = new RegExp(`\\b${f}\\b`, 'g');
    const matches = allText.match(regex);
    if (matches && matches.length > maxCount) {
      maxCount = matches.length;
      topField = f;
    }
  });

  if (topField) {
    const courses = await dbService.findCourses({ field: topField });
    if (courses.length > 0) {
      // Recommend up to 2 courses
      return {
        field: topField,
        courses: courses.slice(0, 2)
      };
    }
  }

  return null;
};

module.exports = { recommendationService: { getRecommendations } };
