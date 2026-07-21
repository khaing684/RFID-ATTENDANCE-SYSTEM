const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAllGrades, createGrade, updateGrade, deleteGrade,
  getAllClasses, createClass, updateClass, deleteClass,
  getClassesByGrade,
} = require('../controllers/classController');

// Grade CRUD
router.get('/grades', protect, getAllGrades);
router.post('/grades', protect, adminOnly, createGrade);
router.patch('/grades/:id', protect, adminOnly, updateGrade);
router.delete('/grades/:id', protect, adminOnly, deleteGrade);

// Class CRUD
router.get('/classes', protect, getAllClasses);
router.get('/classes/by-grade/:gradeId', protect, getClassesByGrade);
router.post('/classes', protect, adminOnly, createClass);
router.patch('/classes/:id', protect, adminOnly, updateClass);
router.delete('/classes/:id', protect, adminOnly, deleteClass);

module.exports = router;