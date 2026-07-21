const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  // Academic Year
  getAllAcademicYears, createAcademicYear, setCurrentAcademicYear,
  // Grade Level
  getAllGradeLevels, createGradeLevel, updateGradeLevel, deleteGradeLevel,
  // Section
  getAllSections, getSectionsByGrade, createSection, updateSection, deleteSection,
  // Enrollment
  getEnrollmentsBySection, createEnrollment, deleteEnrollment,
} = require('../controllers/academicController');

// ─── Academic Year ───
router.get('/academic-years', protect, getAllAcademicYears);
router.post('/academic-years', protect, adminOnly, createAcademicYear);
router.patch('/academic-years/:id/set-current', protect, adminOnly, setCurrentAcademicYear);

// ─── Grade Level ───
router.get('/grade-levels', protect, getAllGradeLevels);
router.post('/grade-levels', protect, adminOnly, createGradeLevel);
router.patch('/grade-levels/:id', protect, adminOnly, updateGradeLevel);
router.delete('/grade-levels/:id', protect, adminOnly, deleteGradeLevel);

// ─── Section ───
router.get('/sections', protect, getAllSections);
router.get('/sections/by-grade/:gradeLevelId', protect, getSectionsByGrade);
router.post('/sections', protect, adminOnly, createSection);
router.patch('/sections/:id', protect, adminOnly, updateSection);
router.delete('/sections/:id', protect, adminOnly, deleteSection);

// ─── Enrollment ───
router.get('/enrollments/section/:sectionId', protect, getEnrollmentsBySection);
router.post('/enrollments', protect, adminOnly, createEnrollment);
router.delete('/enrollments/:id', protect, adminOnly, deleteEnrollment);

module.exports = router;
