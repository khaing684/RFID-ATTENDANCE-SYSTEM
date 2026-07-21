const prisma = require('../config/db');

// ──────────── SUBJECT ────────────

const getAllSubjects = async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { schedules: true } },
        teacher: { select: { id: true, name: true } },
      },
    });
    res.json({ success: true, subjects });
  } catch (error) { next(error); }
};

const createSubject = async (req, res, next) => {
  try {
    const { name, code, color, credits, teacherId } = req.body;
    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        color: color || '#1677ff',
        credits: credits || 1,
        teacherId: teacherId || null,
      },
    });
    res.status(201).json({ success: true, subject });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Subject code already exists' });
    next(error);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const { name, code, color, credits, teacherId } = req.body;
    const data = {};
    if (name) data.name = name;
    if (code) data.code = code;
    if (color) data.color = color;
    if (credits !== undefined) data.credits = credits;
    if (teacherId !== undefined) data.teacherId = teacherId;
    const subject = await prisma.subject.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, subject });
  } catch (error) { next(error); }
};

const deleteSubject = async (req, res, next) => {
  try {
    await prisma.subject.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Subject deleted' });
  } catch (error) { next(error); }
};

// ──────────── SCHEDULE (Timetable) ────────────

const getScheduleBySection = async (req, res, next) => {
  try {
    const entries = await prisma.schedule.findMany({
      where: { sectionId: req.params.sectionId },
      include: {
        subject: { select: { id: true, name: true, code: true, color: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    res.json({ success: true, entries });
  } catch (error) { next(error); }
};

const createSchedule = async (req, res, next) => {
  try {
    const { sectionId, subjectId, dayOfWeek, startTime, endTime } = req.body;
    const entry = await prisma.schedule.create({
      data: { sectionId, subjectId, dayOfWeek, startTime, endTime },
      include: {
        subject: { select: { id: true, name: true, code: true, color: true } },
      },
    });
    res.status(201).json({ success: true, entry });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Time slot already exists' });
    next(error);
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const { subjectId, dayOfWeek, startTime, endTime } = req.body;
    const data = {};
    if (subjectId) data.subjectId = subjectId;
    if (dayOfWeek !== undefined) data.dayOfWeek = dayOfWeek;
    if (startTime) data.startTime = startTime;
    if (endTime) data.endTime = endTime;
    const entry = await prisma.schedule.update({
      where: { id: req.params.id },
      data,
      include: {
        subject: { select: { id: true, name: true, code: true, color: true } },
      },
    });
    res.json({ success: true, entry });
  } catch (error) { next(error); }
};

const deleteSchedule = async (req, res, next) => {
  try {
    await prisma.schedule.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Schedule entry deleted' });
  } catch (error) { next(error); }
};

module.exports = {
  getAllSubjects, createSubject, updateSubject, deleteSubject,
  getScheduleBySection, createSchedule, updateSchedule, deleteSchedule,
};
