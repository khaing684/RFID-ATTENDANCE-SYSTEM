const express = require('express');
const router = express.Router();

const {
  getAll,
  getById,
  create,
  update,
  remove,
  assignTag,
  unassignTag,
  getStats,
} = require('../controllers/tagController');

const { protect, adminOnly } = require('../middleware/auth');

// 📊 Stats (အပေါ်ဆုံးမှာထား - /:id နဲ့ conflict မဖြစ်အောင်)
router.get('/stats', protect, getStats);

// 🏷️ Tag CRUD
router.get('/', protect, getAll);
router.get('/:id', protect, getById);
router.post('/', protect, create);
router.patch('/:id', protect, update);
router.delete('/:id', protect, adminOnly, remove);

// 🔗 Assign / Unassign
router.patch('/:id/assign', protect, adminOnly, assignTag);
router.patch('/:id/unassign', protect, adminOnly, unassignTag);

module.exports = router;
