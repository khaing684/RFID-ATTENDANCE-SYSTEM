const express = require('express');
const router = express.Router();

const {
  getAll,
  getById,
  create,
  update,
  remove,
  heartbeat,
} = require('../controllers/deviceController');

const { protect, adminOnly } = require('../middleware/auth');

// ⚠️ Static routes ကို /:id ထက် အရင်ထား
router.patch('/:id/heartbeat', protect, heartbeat);

// 🖥️ Device CRUD
router.get('/', protect, getAll);
router.get('/:id', protect, getById);
router.post('/', protect, adminOnly, create);
router.patch('/:id', protect, adminOnly, update);
router.delete('/:id', protect, adminOnly, remove);

module.exports = router;
