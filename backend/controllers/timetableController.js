const prisma = require('../config/db');

// ─── SUBJECTS ───
const getAllSubjects = async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { timetables: true } } },
    });
    res.json({ success: true, subjects });
  } catch (error) { next(error); }
};

const createSubject = async (req, res, next) => {
  try {
    const { name, code, color } = req.body;
    const subject = await prisma.subject.create({
      data: { name, code, color: color || '#1677ff' },
    });
    res.status(201).json({ success: true, subject });
  } catch (error) {
    if (error.code === 'P2002')
      return res.status(409).json({ success: false, message: 'Subject code already exists' });
    next(error);
  }
};

const updateSubject = async (req, res, next) => {
  try {
    const { name, code, color } = req.body;
    const data = {};
    if (name) data.name = name;
    if (code) data.code = code;
    if (color) data.color = color;
    const subject = await prisma.subject.update({ where: { id: req.params.id }, data });
    res.json({ success: true, subject });
  } catch (error) { next(error); }
};

const deleteSubject = async (req, res, next) => {
  try {
    await prisma.subject.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Subject deleted' });
  } catch (error) { next(error); }
};

// ─── TIMETABLE ───
const getTimetableByClass = async (req, res, next) => {
  try {
    const entries = await prisma.timetable.findMany({
      where: { classId: req.params.classId },
      include: {
        subject: { select: { id: true, name: true, code: true, color: true } },
        class: { select: { id: true, name: true, grade: { select: { name: true } } } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    res.json({ success: true, entries });
  } catch (error) { next(error); }
};

const createTimetable = async (req, res, next) => {
  try {
    const { classId, subjectId, teacherId, dayOfWeek, startTime, endTime } = req.body;

    // Teacher conflict check
    if (teacherId) {
      const conflict = await prisma.timetable.findFirst({
        where: {
          teacherId,
          dayOfWeek,
          startTime,
          classId: { not: classId },
        },
      });
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: 'Teacher already has a class at this time',
        });
      }
    }

    const entry = await prisma.timetable.create({
      data: { classId, subjectId, teacherId, dayOfWeek, startTime, endTime },
      include: {
        subject: { select: { id: true, name: true, code: true, color: true } },
        teacher: { select: { id: true, name: true } },
      },
    });
    res.status(201).json({ success: true, entry });
  } catch (error) {
    if (error.code === 'P2002')
      return res.status(409).json({ success: false, message: 'Time slot already exists' });
    next(error);
  }
};

const updateTimetable = async (req, res, next) => {
  try {
    const { subjectId, teacherId, dayOfWeek, startTime, endTime } = req.body;
    const data = {};
    if (subjectId) data.subjectId = subjectId;
    if (teacherId !== undefined) data.teacherId = teacherId;
    if (dayOfWeek !== undefined) data.dayOfWeek = dayOfWeek;
    if (startTime) data.startTime = startTime;
    if (endTime) data.endTime = endTime;

    // Get current entry to know classId for conflict check
    const current = await prisma.timetable.findUnique({ where: { id: req.params.id } });
    const targetTeacherId = teacherId !== undefined ? teacherId : current?.teacherId;
    const targetDayOfWeek = dayOfWeek !== undefined ? dayOfWeek : current?.dayOfWeek;
    const targetStartTime = startTime || current?.startTime;

    if (targetTeacherId) {
      const conflict = await prisma.timetable.findFirst({
        where: {
          teacherId: targetTeacherId,
          dayOfWeek: targetDayOfWeek,
          startTime: targetStartTime,
          id: { not: req.params.id },
        },
      });
      if (conflict) {
        return res.status(409).json({
          success: false,
          message: 'Teacher already has a class at this time',
        });
      }
    }

    const entry = await prisma.timetable.update({
      where: { id: req.params.id },
      data,
      include: {
        subject: { select: { id: true, name: true, code: true, color: true } },
        teacher: { select: { id: true, name: true } },
      },
    });
    res.json({ success: true, entry });
  } catch (error) { next(error); }
};

const deleteTimetable = async (req, res, next) => {
  try {
    await prisma.timetable.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Timetable entry deleted' });
  } catch (error) { next(error); }
};

module.exports = {
  getAllSubjects, createSubject, updateSubject, deleteSubject,
  getTimetableByClass, createTimetable, updateTimetable, deleteTimetable,
};