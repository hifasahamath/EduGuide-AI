const dbService = require('../services/dbService');

const getCourses = async (req, res) => {
  try {
    const courses = await dbService.getAllCourses();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

const addCourse = async (req, res) => {
  try {
    const course = await dbService.addCourse(req.body);
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add course' });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await dbService.updateCourse(req.params.id, req.body);
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update course' });
  }
};

const deleteCourse = async (req, res) => {
  try {
    await dbService.deleteCourse(req.params.id);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
};

const bulkImportCourses = async (req, res) => {
  try {
    const { courses } = req.body;
    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ error: 'No courses provided' });
    }

    const results = { success: 0, failed: 0, errors: [] };

    for (const raw of courses) {
      try {
        const payload = {
          name: raw.name?.trim() || '',
          field: raw.field?.trim() || '',
          courseType: raw.courseType?.trim() || 'Degree',
          university: raw.university?.trim() || '',
          level: raw.level?.trim() || 'Undergraduate',
          duration: raw.duration?.trim() || '',
          studyMode: raw.studyMode?.trim() || 'Full-time',
          totalFee: Number(raw.totalFee) || 0,
          registrationFee: Number(raw.registrationFee) || 0,
          installmentAvailable: raw.installmentAvailable?.trim() || 'No',
          installmentPlan: raw.installmentPlan?.trim() || '',
          eligibility: raw.eligibility?.trim() || '',
          minimumRequirements: raw.minimumRequirements?.trim() || '',
          subjects: raw.subjects ? raw.subjects.split('|').map(s => s.trim()).filter(Boolean) : [],
          campusLocation: raw.campusLocation?.trim() || '',
          city: raw.city?.trim() || '',
          onlineAvailable: raw.onlineAvailable?.trim() || 'No',
          jobOpportunities: raw.jobOpportunities ? raw.jobOpportunities.split('|').map(s => s.trim()).filter(Boolean) : [],
          careerPath: raw.careerPath?.trim() || '',
          internshipAvailable: raw.internshipAvailable?.trim() || 'No',
          industryCertification: raw.industryCertification?.trim() || 'No',
          practicalTraining: raw.practicalTraining?.trim() || 'No',
          courseImage: raw.courseImage?.trim() || '',
          keywords: raw.keywords ? raw.keywords.split('|').map(s => s.trim()).filter(Boolean) : [],
          tags: raw.tags ? raw.tags.split('|').map(s => s.trim()).filter(Boolean) : [],
        };

        if (!payload.name) {
          results.failed++;
          results.errors.push(`Row skipped: missing course name`);
          continue;
        }

        await dbService.addCourse(payload);
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Failed: ${raw.name || 'unknown'} — ${err.message}`);
      }
    }

    res.json({
      message: `Import complete. ${results.success} added, ${results.failed} failed.`,
      ...results
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Bulk import failed' });
  }
};

module.exports = { getCourses, addCourse, updateCourse, deleteCourse, bulkImportCourses };
