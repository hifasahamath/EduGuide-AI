const { dbService } = require('./dbService');

const compareCourses = async (entities) => {
  const allCourses = await dbService.getAllCourses();
  
  if (allCourses.length < 2) return null;

  let c1 = null;
  let c2 = null;

  if (entities.course1) {
    c1 = allCourses.find(c => c.name.toLowerCase().includes(entities.course1.toLowerCase()));
  }
  if (entities.course2) {
    c2 = allCourses.find(c => c.name.toLowerCase().includes(entities.course2.toLowerCase()));
  }

  // If exact not found, just pick the first two for demo
  if (!c1) c1 = allCourses[0];
  if (!c2) c2 = allCourses[1] || allCourses[0];

  return { c1, c2 };
};

module.exports = { comparisonService: { compareCourses } };
