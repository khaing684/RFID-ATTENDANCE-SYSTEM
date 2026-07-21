const prisma = require('../config/db');

// ─── GRADES ───
const getAllGrades = async (req, res, next) => {
  try {
    const grades = await prisma.grade.findMany({
      orderBy: { level: 'asc' },
      include: { _count: { select: { classes: true } } },
    });
    res.json({ success: true, grades });
  } catch (error) { next(error); }
};

const createGrade = async (req, res, next) => {
  try {
    const { name, type, level } = req.body;
    const grade = await prisma.grade.create({
      data: { name, type: type || 'PHYSICAL', level: level ? Number(level) : 0 },
    });
    res.status(201).json({ success: true, grade });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Grade already exists' });
    next(error);
  }
};

// ─── GET CLASSES BY GRADE ───
const getClassesByGrade = async (req, res, next) => {
  try {
    const classes = await prisma.class.findMany({
      where: { gradeId: req.params.gradeId },
      include: {
        teacher: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
    });
    res.json({ success: true, classes });
  } catch (error) { next(error); }
};

// ─── UPDATE GRADE ───
const updateGrade = async (req, res, next) => {
  try {
    const { name, type, level } = req.body;
    const data = {};
    if (name) data.name = name;
    if (type) data.type = type;
    if (level !== undefined) data.level = Number(level);
    const grade = await prisma.grade.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, grade });
  } catch (error) { next(error); }
};

// ─── DELETE GRADE ───
const deleteGrade = async (req, res, next) => {
  try {
    await prisma.grade.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Grade deleted' });
  } catch (error) { next(error); }
};

// ─── CLASSES ───
const getAllClasses = async (req, res, next) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        grade: { select: { name: true, type: true } },
        teacher: { select: { id: true, name: true } },
        _count: { select: { students: true } },
      },
      orderBy: [{ grade: { level: 'asc' } }, { name: 'asc' }],
    });
    res.json({ success: true, classes });
  } catch (error) { next(error); }
};

const createClass = async (req, res, next) => {
  try {
    const { name, gradeId, teacherId } = req.body;
    const cls = await prisma.class.create({
      data: { name, gradeId, teacherId: teacherId || null },
      include: { grade: { select: { name: true, type: true } } },
    });
    res.status(201).json({ success: true, class: cls });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Class already exists in this grade' });
    next(error);
  }
};

const updateClass = async (req, res, next) => {
  try {
    const { name, gradeId, teacherId } = req.body;
    const data = {};
    if (name) data.name = name;
    if (gradeId) data.gradeId = gradeId;
    if (teacherId !== undefined) data.teacherId = teacherId;

    const cls = await prisma.class.update({
      where: { id: req.params.id },
      data,
      include: {
        grade: { select: { name: true, type: true } },
        teacher: { select: { id: true, name: true } },
      },
    });
    res.json({ success: true, class: cls });
  } catch (error) { next(error); }
};

const deleteClass = async (req, res, next) => {
  try {
    await prisma.class.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Class deleted' });
  } catch (error) { next(error); }
};





module.exports = { getAllGrades, createGrade, updateGrade, deleteGrade, getAllClasses, createClass, updateClass, deleteClass, getClassesByGrade };