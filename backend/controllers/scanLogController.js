const scanLogService = require('../services/scanLogService');

// GET /api/scanlogs
const getAll = async (req, res, next) => {
  try {
    const result = await scanLogService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// GET /api/scanlogs/:id
const getById = async (req, res, next) => {
  try {
    const log = await scanLogService.getById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Scan log not found' });
    }
    res.json({ success: true, log });
  } catch (error) {
    next(error);
  }
};

// POST /api/scanlogs
const create = async (req, res, next) => {
  try {
    const log = await scanLogService.create(req.body, req.user?.id);
    res.status(201).json({ success: true, message: 'Scan recorded', log });
  } catch (error) {
    const errorMap = {
      'Tag not found with this RFID code': 404,
      'Device not found with this code': 404,
      'Tag is not active': 400,
    };
    const status = errorMap[error.message] || 500;
    if (status === 500) return next(error);
    res.status(status).json({ success: false, message: error.message });
  }
};

// GET /api/scanlogs/recent
const getRecent = async (req, res, next) => {
  try {
    const logs = await scanLogService.getRecent();
    res.json({ success: true, count: logs.length, logs });
  } catch (error) {
    next(error);
  }
};

// GET /api/scanlogs/by-tag/:tagId
const getByTag = async (req, res, next) => {
  try {
    const result = await scanLogService.getByTag(req.params.tagId, req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// GET /api/scanlogs/stats
const getStats = async (req, res, next) => {
  try {
    const stats = await scanLogService.getStats(req.query);
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

// GET /api/scanlogs/report
const getReport = async (req, res, next) => {
  try {
    const result = await scanLogService.getReport(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, getRecent, getByTag, getStats, getReport };
