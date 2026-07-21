const prisma = require('../config/db');

// ──────────── ACADEMIC YEAR ────────────

const getAllAcademicYears = async (req, res, next) => {
  try {
    const years = await prisma.academicYear.findMany({
      orderBy: { startDate: 'desc' },
      include: { _count: { select: { enrollments: true } } },
    });
    res.json({ success: true, academicYears: years });
  } catch (error) { next(error); }
};

const createAcademicYear = async (req, res, next) => {
  try {
    const { year, startDate, endDate, isCurrent } = req.body;
    // Only one can be current
    if (isCurrent) {
      await prisma.academicYear.updateMany({ data: { isCurrent: false } });
    }
    const acYear = await prisma.academicYear.create({
      data: {
        year,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isCurrent: isCurrent || false,
      },
    });
    res.status(201).json({ success: true, academicYear: acYear });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Academic year already exists' });
    next(error);
  }
};

const setCurrentAcademicYear = async (req, res, next) => {
  try {
    await prisma.academicYear.updateMany({ data: { isCurrent: false } });
    const acYear = await prisma.academicYear.update({
      where: { id: req.params.id },
      data: { isCurrent: true },
    });
    res.json({ success: true, academicYear: acYear });
  } catch (error) { next(error); }
};

// ──────────── GRADE LEVEL ────────────

const getAllGradeLevels = async (req, res, next) => {
  try {
    const levels = await prisma.gradeLevel.findMany({
      orderBy: { level: 'asc' },
      include: { _count: { select: { sections: true } } },
    });
    res.json({ success: true, gradeLevels: levels });
  } catch (error) { next(error); }
};

const createGradeLevel = async (req, res, next) => {
  try {
    const { name, level } = req.body;
    const gradeLevel = await prisma.gradeLevel.create({
      data: { name, level: level || 0 },
    });
    res.status(201).json({ success: true, gradeLevel });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Grade level already exists' });
    next(error);
  }
};

const updateGradeLevel = async (req, res, next) => {
  try {
    const { name, level } = req.body;
    const data = {};
    if (name) data.name = name;
    if (level !== undefined) data.level = level;
    const gradeLevel = await prisma.gradeLevel.update({
      where: { id: req.params.id },
      data,
    });
    res.json({ success: true, gradeLevel });
  } catch (error) { next(error); }
};

const deleteGradeLevel = async (req, res, next) => {
  try {
    await prisma.gradeLevel.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Grade level deleted' });
  } catch (error) { next(error); }
};

// ──────────── SECTION ────────────

const getAllSections = async (req, res, next) => {
  try {
    const sections = await prisma.section.findMany({
      include: {
        gradeLevel: { select: { id: true, name: true, level: true } },
        teacher: { select: { id: true, name: true } },
        _count: { select: { schedules: true } },
      },
      orderBy: [{ gradeLevel: { level: 'asc' } }, { name: 'asc' }],
    });
    // Get enrollment count for each section
    const sectionsWithCount = await Promise.all(
      sections.map(async (section) => {
        const enrollmentCount = await prisma.enrollment.count({
          where: { sectionId: section.id },
        });
        return { ...section, studentCount: enrollmentCount };
      })
    );
    res.json({ success: true, sections: sectionsWithCount });
  } catch (error) { next(error); }
};

const getSectionsByGrade = async (req, res, next) => {
  try {
    const sections = await prisma.section.findMany({
      where: { gradeLevelId: req.params.gradeLevelId },
      include: {
        teacher: { select: { id: true, name: true } },
        _count: { select: { schedules: true } },
      },
    });
    const sectionsWithCount = await Promise.all(
      sections.map(async (section) => {
        const enrollmentCount = await prisma.enrollment.count({
          where: { sectionId: section.id },
        });
        return { ...section, studentCount: enrollmentCount };
      })
    );
    res.json({ success: true, sections: sectionsWithCount });
  } catch (error) { next(error); }
};

const createSection = async (req, res, next) => {
  try {
    const { name, gradeLevelId, teacherId, room, capacity } = req.body;
    const section = await prisma.section.create({
      data: {
        name,
        gradeLevelId,
        teacherId: teacherId || null,
        room: room || null,
        capacity: capacity || 40,
      },
      include: {
        gradeLevel: { select: { id: true, name: true, level: true } },
        teacher: { select: { id: true, name: true } },
      },
    });
    res.status(201).json({ success: true, section });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Section already exists in this grade' });
    next(error);
  }
};

const updateSection = async (req, res, next) => {
  try {
    const { name, gradeLevelId, teacherId, room, capacity } = req.body;
    const data = {};
    if (name) data.name = name;
    if (gradeLevelId) data.gradeLevelId = gradeLevelId;
    if (teacherId !== undefined) data.teacherId = teacherId;
    if (room !== undefined) data.room = room;
    if (capacity !== undefined) data.capacity = capacity;
    const section = await prisma.section.update({
      where: { id: req.params.id },
      data,
      include: {
        gradeLevel: { select: { id: true, name: true } },
        teacher: { select: { id: true, name: true } },
      },
    });
    res.json({ success: true, section });
  } catch (error) { next(error); }
};

const deleteSection = async (req, res, next) => {
  try {
    await prisma.section.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Section deleted' });
  } catch (error) { next(error); }
};

// ──────────── ENROLLMENT ────────────

const getEnrollmentsBySection = async (req, res, next) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { sectionId: req.params.sectionId },
      include: {
        student: { select: { id: true, name: true, email: true, role: true } },
        academicYear: { select: { id: true, year: true, isCurrent: true } },
      },
      orderBy: { enrolledAt: 'desc' },
    });
    res.json({ success: true, enrollments });
  } catch (error) { next(error); }
};

const createEnrollment = async (req, res, next) => {
  try {
    const { studentId, sectionId, academicYearId } = req.body;
    const enrollment = await prisma.enrollment.create({
      data: { studentId, sectionId, academicYearId },
      include: {
        student: { select: { id: true, name: true, email: true } },
        section: { select: { id: true, name: true } },
        academicYear: { select: { id: true, year: true } },
      },
    });
    res.status(201).json({ success: true, enrollment });
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ success: false, message: 'Student already enrolled in this section for this year' });
    next(error);
  }
};

const deleteEnrollment = async (req, res, next) => {
  try {
    await prisma.enrollment.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Enrollment deleted' });
  } catch (error) { next(error); }
};

module.exports = {
  getAllAcademicYears, createAcademicYear, setCurrentAcademicYear,
  getAllGradeLevels, createGradeLevel, updateGradeLevel, deleteGradeLevel,
  getAllSections, getSectionsByGrade, createSection, updateSection, deleteSection,
  getEnrollmentsBySection, createEnrollment, deleteEnrollment,
};
