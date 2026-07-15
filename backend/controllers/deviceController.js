const deviceService = require('../services/deviceService');

// GET /api/devices
const getAll = async (req, res, next) => {
  try {
    const result = await deviceService.getAll(req.query);
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// GET /api/devices/:id
const getById = async (req, res, next) => {
  try {
    const device = await deviceService.getById(req.params.id);
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    res.json({ success: true, device });
  } catch (error) {
    next(error);
  }
};

// POST /api/devices
const create = async (req, res, next) => {
  try {
    const device = await deviceService.create(req.body, req.user.id);
    res.status(201).json({ success: true, message: 'Device created', device });
  } catch (error) {
    if (error.message === 'Device code already exists') {
      return res.status(409).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// PATCH /api/devices/:id
const update = async (req, res, next) => {
  try {
    const device = await deviceService.update(req.params.id, req.body);
    res.json({ success: true, message: 'Device updated', device });
  } catch (error) {
    if (error.message === 'Device not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// DELETE /api/devices/:id
const remove = async (req, res, next) => {
  try {
    const result = await deviceService.remove(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    if (error.message === 'Device not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// PATCH /api/devices/:id/heartbeat
const heartbeat = async (req, res, next) => {
  try {
    const device = await deviceService.heartbeat(req.params.id);
    res.json({ success: true, message: 'Heartbeat received', device });
  } catch (error) {
    if (error.message === 'Device not found') {
      return res.status(404).json({ success: false, message: error.message });
    }
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove, heartbeat };
