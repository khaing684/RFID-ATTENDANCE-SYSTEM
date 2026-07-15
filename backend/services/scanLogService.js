const prisma = require('../config/db');

/**
 * ScanLogs Service
 * တက်ရောက်မှုမှတ်တမ်း - System ရဲ့ အသက်သွေးကြော
 */

// GET - Scan အားလုံး
const getAll = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where = {};

  if (query.scanType) where.scanType = query.scanType;
  if (query.tagId) where.tagId = query.tagId;
  if (query.deviceId) where.deviceId = query.deviceId;
  if (query.userId) where.userId = query.userId;

  // Date range filter
  if (query.startDate || query.endDate) {
    where.scannedAt = {};
    if (query.startDate) where.scannedAt.gte = new Date(query.startDate);
    if (query.endDate) where.scannedAt.lte = new Date(query.endDate);
  }

  const [logs, total] = await Promise.all([
    prisma.scanLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        tag: { select: { rfidCode: true } },
        device: { select: { name: true, location: true } },
        user: { select: { id: true, name: true, role: true } },
      },
      orderBy: { scannedAt: 'desc' },
    }),
    prisma.scanLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      page, limit, total,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + limit < total,
      hasPrev: page > 1,
    },
  };
};

// GET - Scan detail
const getById = async (id) => {
  return prisma.scanLog.findUnique({
    where: { id },
    include: {
      tag: { select: { rfidCode: true, status: true } },
      device: { select: { name: true, location: true, deviceCode: true } },
      user: { select: { id: true, name: true, role: true } },
    },
  });
};

// POST - Scan အသစ်မှတ်
// Input: { rfidCode, deviceCode, scanType, notes? }
const create = async (data, userId) => {
  // Step 1: rfidCode → tag ရှာ
  const tag = await prisma.tag.findUnique({
    where: { rfidCode: data.rfidCode },
  });
  if (!tag) throw new Error('Tag not found with this RFID code');

  // Step 2: deviceCode → device ရှာ
  const device = await prisma.device.findUnique({
    where: { deviceCode: data.deviceCode },
  });
  if (!device) throw new Error('Device not found with this code');

  // Step 3: Tag active လား
  if (tag.status !== 'ACTIVE') {
    throw new Error('Tag is not active');
  }

  // Step 4: ScanLog create + Device lastSeen update
  const [scanLog] = await Promise.all([
    prisma.scanLog.create({
      data: {
        tagId: tag.id,
        deviceId: device.id,
        userId: userId || null,
        scanType: data.scanType || 'CHECK_IN',
        notes: data.notes,
      },
      include: {
        tag: { select: { rfidCode: true } },
        device: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
    // Device lastSeen update
    prisma.device.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date(), status: 'ONLINE' },
    }),
  ]);

  return scanLog;
};

// GET - နောက်ဆုံး scan 50 ခု
const getRecent = async () => {
  return prisma.scanLog.findMany({
    take: 50,
    orderBy: { scannedAt: 'desc' },
    include: {
      tag: { select: { rfidCode: true } },
      device: { select: { name: true } },
      user: { select: { name: true, role: true } },
    },
  });
};

// GET - Tag တစ်ခုရဲ့ scan history
const getByTag = async (tagId, query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where = { tagId };
  if (query.scanType) where.scanType = query.scanType;

  const [logs, total] = await Promise.all([
    prisma.scanLog.findMany({
      where,
      skip,
      take: limit,
      include: {
        device: { select: { name: true, location: true } },
        user: { select: { name: true } },
      },
      orderBy: { scannedAt: 'desc' },
    }),
    prisma.scanLog.count({ where }),
  ]);

  return { logs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
};

// GET - နေ့စဉ်/လစဉ် စာရင်းအင်း
const getStats = async (query) => {
  const { startDate, endDate } = query;

  const where = {};
  if (startDate || endDate) {
    where.scannedAt = {};
    if (startDate) where.scannedAt.gte = new Date(startDate);
    if (endDate) where.scannedAt.lte = new Date(endDate);
  }

  const [total, checkIns, checkOuts, recentLogs] = await Promise.all([
    prisma.scanLog.count({ where }),
    prisma.scanLog.count({ where: { ...where, scanType: 'CHECK_IN' } }),
    prisma.scanLog.count({ where: { ...where, scanType: 'CHECK_OUT' } }),
    prisma.scanLog.findMany({
      where,
      take: 5,
      orderBy: { scannedAt: 'desc' },
      include: {
        tag: { select: { rfidCode: true } },
        user: { select: { name: true, role: true } },
      },
    }),
  ]);

  return { total, checkIns, checkOuts, recentLogs };
};

module.exports = { getAll, getById, create, getRecent, getByTag, getStats };
