const express = require('express');
const router = express.Router();

const { getAll, update } = require('../controllers/settingController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, getAll);
router.put('/', protect, adminOnly, update);

module.exports = router;
