const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllSubjects, createSubject, updateSubject, deleteSubject,
  getTimetableByClass, createTimetable, updateTimetable, deleteTimetable,
} = require('../controllers/timetableController');

router.get('/subjects', protect, getAllSubjects);
router.post('/subjects', protect, adminOnly, createSubject);
router.patch('/subjects/:id', protect, adminOnly, updateSubject);
router.delete('/subjects/:id', protect, adminOnly, deleteSubject);

router.get('/timetable/:classId', protect, getTimetableByClass);
router.post('/timetable', protect, adminOnly, createTimetable);
router.patch('/timetable/:id', protect, adminOnly, updateTimetable);
router.delete('/timetable/:id', protect, adminOnly, deleteTimetable);

module.exports = router;