const express = require('express');
const router = express.Router();

const { getAll, getById, create, update, remove } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

// Admin only - user management
router.get('/', protect, adminOnly, getAll);
router.get('/:id', protect, adminOnly, getById);
router.post('/', protect, adminOnly, create);
router.patch('/:id', protect, adminOnly, update);
router.delete('/:id', protect, adminOnly, remove);

module.exports = router;
