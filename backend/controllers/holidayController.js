const prisma = require('../config/db');

/**
 * Holiday Controller
 * အားလပ်ရက်ပြက္ခဒိန် Management
 */

// GET /api/holidays
const getAll = async (req, res, next) => {
  try {
    const { year, type } = req.query;
    const where = {};

    if (year) {
      const start = new Date(`${year}-01-01T00:00:00.000Z`);
      const end = new Date(`${year}-12-31T23:59:59.999Z`);
      where.date = { gte: start, lte: end };
    }
    if (type) where.type = type;

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: 'asc' },
    });

    res.json({ success: true, count: holidays.length, holidays });
  } catch (error) {
    next(error);
  }
};

// GET /api/holidays/:date (check specific date)
const getByDate = async (req, res, next) => {
  try {
    const date = new Date(req.params.date);
    const holiday = await prisma.holiday.findUnique({
      where: { date: date },
    });

    res.json({
      success: true,
      isHoliday: !!holiday,
      holiday: holiday || null,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/holidays
const create = async (req, res, next) => {
  try {
    const { date, name, type, description } = req.body;

    // Check duplicate
    const existing = await prisma.holiday.findUnique({
      where: { date: new Date(date) },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Holiday already exists for this date',
      });
    }

    const holiday = await prisma.holiday.create({
      data: {
        date: new Date(date),
        name,
        type: type || 'NATIONAL',
        description,
      },
    });

    res.status(201).json({ success: true, holiday });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/holidays/:id
const update = async (req, res, next) => {
  try {
    const { date, name, type, description } = req.body;
    const data = {};
    if (date) data.date = new Date(date);
    if (name) data.name = name;
    if (type) data.type = type;
    if (description !== undefined) data.description = description;

    const holiday = await prisma.holiday.update({
      where: { id: req.params.id },
      data,
    });

    res.json({ success: true, holiday });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Holiday not found' });
    }
    next(error);
  }
};

// DELETE /api/holidays/:id
const remove = async (req, res, next) => {
  try {
    await prisma.holiday.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Holiday deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Holiday not found' });
    }
    next(error);
  }
};



const prePopulate = async (req, res, next) => {
  try {
    const { year } = req.body;
    const targetYear = year || new Date().getFullYear();

  const fixedHolidays = [
    // ===== နှစ်သစ်ကူး =====
    { name: 'နှစ်သစ်ကူးနေ့',              date: `${targetYear}-01-01`, type: 'NATIONAL' },
    { name: 'နှစ်သစ်ကူးနေ့ (၂)',          date: `${targetYear}-01-02`, type: 'NATIONAL' },

    // ===== လွတ်လပ်ရေးနေ့ =====
    { name: 'လွတ်လပ်ရေးနေ့',              date: `${targetYear}-01-04`, type: 'NATIONAL' },

    // ===== ပြည်ထောင်စုနေ့ =====
    { name: 'ပြည်ထောင်စုနေ့',              date: `${targetYear}-02-12`, type: 'NATIONAL' },
    { name: 'ပြည်ထောင်စုနေ့ (၂)',          date: `${targetYear}-02-13`, type: 'NATIONAL' },

    // ===== တရုတ်နှစ်သစ်ကူး =====
    { name: 'တရုတ်နှစ်သစ်ကူးနေ့',         date: `${targetYear}-02-16`, type: 'NATIONAL' },
    { name: 'တရုတ်နှစ်သစ်ကူးနေ့ (၂)',     date: `${targetYear}-02-17`, type: 'NATIONAL' },

    // ===== တောင်သူလယ်သမားနေ့ =====
    { name: 'တောင်သူလယ်သမားနေ့',         date: `${targetYear}-03-02`, type: 'NATIONAL' },

    // ===== တပ်မတော်နေ့ =====
    { name: 'တပ်မတော်နေ့',                date: `${targetYear}-03-27`, type: 'NATIONAL' },

    // ===== သင်္ကြန်ပွဲတော် (၉ ရက်) =====
    { name: 'သင်္ကြန်ပွဲတော်',             date: `${targetYear}-04-11`, type: 'NATIONAL' },
    { name: 'သင်္ကြန်အကြိုနေ့',            date: `${targetYear}-04-12`, type: 'NATIONAL' },
    { name: 'သင်္ကြန်အကျနေ့',             date: `${targetYear}-04-13`, type: 'NATIONAL' },
    { name: 'သင်္ကြန်အကြပ်နေ့',            date: `${targetYear}-04-14`, type: 'NATIONAL' },
    { name: 'သင်္ကြန်အတက်နေ့',            date: `${targetYear}-04-15`, type: 'NATIONAL' },
    { name: 'သင်္ကြန်ရက်များ',             date: `${targetYear}-04-16`, type: 'NATIONAL' },
    { name: 'မြန်မာနှစ်သစ်ကူးနေ့',         date: `${targetYear}-04-17`, type: 'NATIONAL' },
    { name: 'သင်္ကြန်နောက်ရက်',           date: `${targetYear}-04-18`, type: 'NATIONAL' },
    { name: 'သင်္ကြန်နောက်ရက် (၂)',       date: `${targetYear}-04-19`, type: 'NATIONAL' },

    // ===== ကဆုန်လပြည့်နေ့ + အလုပ်သမားနေ့ =====
    { name: 'ကဆုန်လပြည့်နေ့',             date: `${targetYear}-04-30`, type: 'NATIONAL' },
    { name: 'အလုပ်သမားနေ့',               date: `${targetYear}-05-01`, type: 'NATIONAL' },

    // ===== အာဇာနည်နေ့ =====
    { name: 'အာဇာနည်နေ့',                date: `${targetYear}-07-19`, type: 'NATIONAL' },

    // ===== ဝါဆိုလပြည့်နေ့ =====
    { name: 'ဝါဆိုလပြည့်နေ့',             date: `${targetYear}-07-29`, type: 'NATIONAL' },

    // ===== သီတင်းကျွတ်လပြည့်နေ့ (၃ ရက်) =====
    { name: 'သီတင်းကျွတ်လပြည့်နေ့',       date: `${targetYear}-10-25`, type: 'NATIONAL' },
    { name: 'သီတင်းကျွတ် (၂)',            date: `${targetYear}-10-26`, type: 'NATIONAL' },
    { name: 'သီတင်းကျွတ် (၃)',            date: `${targetYear}-10-27`, type: 'NATIONAL' },

    // ===== တန်ဆောင်မုန်းလပြည့်နေ့ (၂ ရက်) =====
    { name: 'တန်ဆောင်မုန်းလပြည့်နေ့',      date: `${targetYear}-11-23`, type: 'NATIONAL' },
    { name: 'တန်ဆောင်မုန်း (၂)',           date: `${targetYear}-11-24`, type: 'NATIONAL' },

    // ===== အမျိုးသားနေ့ =====
    { name: 'အမျိုးသားနေ့',                date: `${targetYear}-12-04`, type: 'NATIONAL' },

    // ===== ခရစ္စမတ်နေ့ =====
    { name: 'ခရစ္စမတ်နေ့',                date: `${targetYear}-12-25`, type: 'NATIONAL' },
  ];


    const allDefaults = [...fixedHolidays];

    let created = 0;
    let skipped = 0;

    for (const h of allDefaults) {
      const holidayDate = new Date(h.date);
      
      // Check if exists
      const existing = await prisma.holiday.findUnique({
        where: { date: holidayDate },
      });

      if (!existing) {
        await prisma.holiday.create({
          data: {
            date: holidayDate,
            name: h.name,
            type: h.type,
          },
        });
        created++;
      } else {
        skipped++;
      }
    }

    res.json({
      success: true,
      message: `✅ Pre-populated: ${created} created, ${skipped} skipped for year ${targetYear}`,
      stats: { created, skipped, year: targetYear },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getByDate, create, update, remove, prePopulate };
