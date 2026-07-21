const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getAll, getByDate, create, update, remove, prePopulate,
} = require('../controllers/holidayController');

router.get('/', protect, getAll);
router.get('/:date', protect, getByDate);
router.post('/', protect, adminOnly, create);
router.patch('/:id', protect, adminOnly, update);
router.delete('/:id', protect, adminOnly, remove);
router.post('/pre-populate', protect, adminOnly, prePopulate);

module.exports = router;
