const tagService = require('../services/tagService');

/**
 * Tags Controller
 * Request/Response ကိုပဲ handle လုပ်၊ logic အားလုံး service မှာ
 */

// GET /api/tags
const getAll = async (req, res, next) => {
  try {
    const result = await tagService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// GET /api/tags/:id
const getById = async (req, res, next) => {
  try {
    const tag = await tagService.getById(req.params.id);

    if (!tag) {
      return res.status(404).json({ success: false, message: 'Tag not found' });
    }

    res.json({ success: true, tag });
  } catch (error) {
    next(error);
  }
};

// POST /api/tags
const create = async (req, res, next) => {
  try {
    const tag = await tagService.create(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Tag created', tag });
  } catch (error) {
    // RFID code ထပ်နေရင်
    if (error.message === 'RFID code already exists') {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// PATCH /api/tags/:id
const update = async (req, res, next) => {
  try {
    const tag = await tagService.update(req.params.id, req.body);
    res.json({ success: true, message: 'Tag updated', tag });
  } catch (error) {
    if (error.message === 'Tag not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// DELETE /api/tags/:id
const remove = async (req, res, next) => {
  try {
    const result = await tagService.remove(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error.message === 'Tag not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// PATCH /api/tags/:id/assign
const assignTag = async (req, res, next) => {
  try {
    const tag = await tagService.assignTag(req.params.id, req.body.userId);
    res.json({ success: true, message: 'Tag assigned', tag });
  } catch (error) {
    const errorMap = {
      'Tag not found': 404,
      'User not found': 404,
      'Tag is already assigned': 400,
      'Tag is not active': 400,
    };
    const status = errorMap[error.message] || 500;
    if (status === 500) return next(error);
    res.status(status).json({ success: false, message: error.message });
  }
};

// PATCH /api/tags/:id/unassign
const unassignTag = async (req, res, next) => {
  try {
    const tag = await tagService.unassignTag(req.params.id);
    res.json({ success: true, message: 'Tag unassigned', tag });
  } catch (error) {
    if (error.message === 'Tag not found' || error.message === 'Tag is not assigned') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// GET /api/tags/stats
const getStats = async (req, res, next) => {
  try {
    const stats = await tagService.getStats();
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove, assignTag, unassignTag, getStats };
