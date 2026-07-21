const express = require('express');
const router = express.Router();

const {
  getAll,
  getById,
  create,
  getRecent,
  getByTag,
  getStats,
  getReport,
} = require('../controllers/scanLogController');

const { protect } = require('../middleware/auth');

// ⚠️ Static routes အရင်ထား
router.get('/recent', protect, getRecent);
router.get('/report', protect, getReport);
router.get('/stats', protect, getStats);
router.get('/by-tag/:tagId', protect, getByTag);

// 📋 Scan CRUD
router.get('/', protect, getAll);
router.get('/:id', protect, getById);
router.post('/', protect, create);

module.exports = router;
