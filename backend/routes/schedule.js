const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllSubjects, createSubject, updateSubject, deleteSubject,
  getScheduleBySection, createSchedule, updateSchedule, deleteSchedule,
} = require('../controllers/scheduleController');

// ─── Subject ───
router.get('/subjects', protect, getAllSubjects);
router.post('/subjects', protect, adminOnly, createSubject);
router.patch('/subjects/:id', protect, adminOnly, updateSubject);
router.delete('/subjects/:id', protect, adminOnly, deleteSubject);

// ─── Schedule (Timetable) ───
router.get('/schedules/:sectionId', protect, getScheduleBySection);
router.post('/schedules', protect, adminOnly, createSchedule);
router.patch('/schedules/:id', protect, adminOnly, updateSchedule);
router.delete('/schedules/:id', protect, adminOnly, deleteSchedule);

module.exports = router;
