const prisma = require('../config/db');

// Default settings
const DEFAULTS = {
  school_start_time: '08:00',
  school_end_time: '16:00',
  late_threshold: '08:30',
  late_threshold_minutes: '30',
};

/**
 * @desc    Settings အားလုံးရယူ
 * @route   GET /api/settings
 * @access  Private
 */
const getAll = async (req, res, next) => {
  try {
    const settings = await prisma.setting.findMany();
    const result = { ...DEFAULTS };
    settings.forEach((s) => { result[s.key] = s.value; });
    res.json({ success: true, settings: result });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Settings update (တစ်ခုချင်း သို့ batch)
 * @route   PUT /api/settings
 * @access  Admin
 */
const update = async (req, res, next) => {
  try {
    const updates = req.body; // { school_start_time: '08:00', ... }

    for (const [key, value] of Object.entries(updates)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }

    res.json({ success: true, message: 'Settings updated' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, update };
