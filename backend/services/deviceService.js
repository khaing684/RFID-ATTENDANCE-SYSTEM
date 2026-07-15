const prisma = require('../config/db');

/**
 * Devices Service
 */

// GET - Device အားလုံး
const getAll = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where = {};

  if (query.status) where.status = query.status;
  if (query.deviceType) where.deviceType = query.deviceType;
  if (query.search) {
    where.OR = [
      { name: { contains: query.search } },
      { deviceCode: { contains: query.search } },
    ];
  }

  const [devices, total] = await Promise.all([
    prisma.device.findMany({
      where,
      skip,
      take: limit,
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { scanLogs: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.device.count({ where }),
  ]);

  return {
    devices,
    pagination: {
      page, limit, total,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + limit < total,
      hasPrev: page > 1,
    },
  };
};

// GET - Device detail
const getById = async (id) => {
  return prisma.device.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true } },
      scanLogs: {
        take: 10,
        orderBy: { scannedAt: 'desc' },
        include: {
          tag: { select: { rfidCode: true } },
          user: { select: { name: true } },
        },
      },
      _count: { select: { scanLogs: true } },
    },
  });
};

// POST - Device အသစ်ထည့်
const create = async (data, userId) => {
  const existing = await prisma.device.findUnique({
    where: { deviceCode: data.deviceCode },
  });

  if (existing) throw new Error('Device code already exists');

  return prisma.device.create({
    data: {
      name: data.name,
      deviceCode: data.deviceCode,
      deviceType: data.deviceType || 'HANDHELD',
      location: data.location,
      ipAddress: data.ipAddress,
      createdById: userId,
    },
  });
};

// PATCH - Device update
const update = async (id, data) => {
  const device = await prisma.device.findUnique({ where: { id } });
  if (!device) throw new Error('Device not found');

  return prisma.device.update({
    where: { id },
    data: {
      name: data.name,
      location: data.location,
      ipAddress: data.ipAddress,
      firmwareVersion: data.firmwareVersion,
    },
  });
};

// DELETE - Device ဖျက်
const remove = async (id) => {
  const device = await prisma.device.findUnique({ where: { id } });
  if (!device) throw new Error('Device not found');

  await prisma.device.delete({ where: { id } });
  return { message: 'Device deleted' };
};

// PATCH - Heartbeat (device alive signal)
const heartbeat = async (id) => {
  const device = await prisma.device.findUnique({ where: { id } });
  if (!device) throw new Error('Device not found');

  return prisma.device.update({
    where: { id },
    data: {
      status: 'ONLINE',
      lastSeenAt: new Date(),
    },
  });
};

module.exports = { getAll, getById, create, update, remove, heartbeat };
