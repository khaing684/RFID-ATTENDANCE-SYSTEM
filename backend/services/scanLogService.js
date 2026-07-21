const prisma = require('../config/db');

/**
 * ScanLogs Service
 * တက်ရောက်မှုမှတ်တမ်း - System ရဲ့ အသက်သွေးကြော
 */

// ─── Helper: Settings ဖတ်ပြီး attendance status တွက် ───
let settingsCache = null;
let cacheTime = 0;
const CACHE_TTL = 60000; // 1 မိနစ် cache

const getSettings = async () => {
  const now = Date.now();
  if (settingsCache && now - cacheTime < CACHE_TTL) return settingsCache;
  
  const settings = await prisma.setting.findMany();
  const config = {};
  settings.forEach((s) => { config[s.key] = s.value; });
  
  settingsCache = {
    schoolStart: config.school_start_time || '08:00',
    schoolEnd: config.school_end_time || '16:00',
    lateThreshold: parseInt(config.late_threshold_minutes) || 30,
  };
  cacheTime = now;
  return settingsCache;
};

const computeAttendanceStatus = (scanType, scannedAt, config) => {
  const date = new Date(scannedAt);
  const scanMinutes = date.getHours() * 60 + date.getMinutes();

  const [startH, startM] = config.schoolStart.split(':').map(Number);
  const [endH, endM] = config.schoolEnd.split(':').map(Number);
  const lateCutoff = startH * 60 + startM + config.lateThreshold;
  const endCutoff = endH * 60 + endM;

  if (scanType === 'CHECK_IN') {
    return scanMinutes <= lateCutoff ? 'ON_TIME' : 'LATE';
  }
  if (scanType === 'CHECK_OUT') {
    return scanMinutes < endCutoff ? 'EARLY_LEAVE' : 'FULL_DAY';
  }
  return null;
};

const enrichWithAttendance = async (logs) => {
  const config = await getSettings();
  return logs.map((log) => ({
    ...log,
    attendanceStatus: computeAttendanceStatus(log.scanType, log.scannedAt, config),
  }));
};

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

  const enrichedLogs = await enrichWithAttendance(logs);

  return {
    logs: enrichedLogs,
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
  const logs = await prisma.scanLog.findMany({
    take: 50,
    orderBy: { scannedAt: 'desc' },
    include: {
      tag: { select: { rfidCode: true } },
      device: { select: { name: true } },
      user: { select: { name: true, role: true } },
    },
  });
  return enrichWithAttendance(logs);
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

  const enrichedLogs = await enrichWithAttendance(logs);
  return { logs: enrichedLogs, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
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

  // နောက်ကျ/စောထွက် အရေအတွက်တွက်ဖို့ logs အကုန်ယူ
  const allLogs = await prisma.scanLog.findMany({
    where,
    select: { id: true, scanType: true, scannedAt: true },
  });

  const enrichedAll = await enrichWithAttendance(allLogs);
  const lateCount = enrichedAll.filter((l) => l.attendanceStatus === 'LATE').length;
  const earlyLeaveCount = enrichedAll.filter((l) => l.attendanceStatus === 'EARLY_LEAVE').length;

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

  const enrichedRecent = await enrichWithAttendance(recentLogs);
  return { total, checkIns, checkOuts, late: lateCount, earlyLeave: earlyLeaveCount, recentLogs: enrichedRecent };
};

// GET - Report with date range
const getReport = async (query) => {
  const { startDate, endDate } = query;
  const where = {};
  if (startDate) where.scannedAt = { ...where.scannedAt, gte: new Date(startDate) };
  if (endDate) where.scannedAt = { ...where.scannedAt, lte: new Date(endDate) };

  const [logs, total, checkIns, checkOuts] = await Promise.all([
    prisma.scanLog.findMany({
      where,
      orderBy: { scannedAt: 'desc' },
      take: 200,
      include: {
        user: { select: { name: true } },
        tag: { select: { rfidCode: true } },
      },
    }),
    prisma.scanLog.count({ where }),
    prisma.scanLog.count({ where: { ...where, scanType: 'CHECK_IN' } }),
    prisma.scanLog.count({ where: { ...where, scanType: 'CHECK_OUT' } }),
  ]);

  const enrichedLogs = await enrichWithAttendance(logs);
  return { logs: enrichedLogs, stats: { total, checkIns, checkOuts } };
};

module.exports = { getAll, getById, create, getRecent, getByTag, getStats, getReport, enrichWithAttendance, getSettings };
