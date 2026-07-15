const prisma = require('../config/db');

/**
 * Tags Service
 * Business logic အားလုံး ဒီမှာရေးမယ်
 */

// GET - Tag အားလုံး (pagination + filter + search)
const getAll = async (query) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;

  // Filter လုပ်မယ့် object တည်ဆောက်
  const where = {};

  if (query.status) {
    where.status = query.status; // ACTIVE, INACTIVE, LOST, DAMAGED
  }

  if (query.tagType) {
    where.tagType = query.tagType; // PASSIVE, ACTIVE
  }

  if (query.search) {
    where.rfidCode = {
      contains: query.search, // RF001 ဆို RF ပါတဲ့ အကုန်
    };
  }

  // Count & Data တစ်ပြိုင်တည်း query
  const [tags, total] = await Promise.all([
    prisma.tag.findMany({
      where,
      skip,
      take: limit,
      include: {
        assignedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.tag.count({ where }),
  ]);

  return {
    tags,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + limit < total,
      hasPrev: page > 1,
    },
  };
};

// GET - Tag detail
const getById = async (id) => {
  const tag = await prisma.tag.findUnique({
    where: { id },
    include: {
      assignedTo: {
        select: { id: true, name: true, email: true, role: true },
      },
      createdBy: {
        select: { id: true, name: true },
      },
      scanLogs: {
        take: 10, // နောက်ဆုံး scan 10 ခု
        orderBy: { scannedAt: 'desc' },
        include: {
          device: { select: { name: true, location: true } },
        },
      },
      _count: {
        select: { scanLogs: true }, // scan အကြိမ်ရေ
      },
    },
  });

  return tag;
};

// POST - Tag အသစ်ထည့်
const create = async (data, userId) => {
  // rfidCode ထပ်နေလား စစ်
  const existing = await prisma.tag.findUnique({
    where: { rfidCode: data.rfidCode },
  });

  if (existing) {
    throw new Error('RFID code already exists');
  }

  const tag = await prisma.tag.create({
    data: {
      rfidCode: data.rfidCode,
      tagType: data.tagType || 'PASSIVE',
      description: data.description,
      createdById: userId,
    },
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  });

  return tag;
};

// PATCH - Tag info update
const update = async (id, data) => {
  // Tag ရှိလား အရင်စစ်
  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing) throw new Error('Tag not found');

  // status ပြောင်းရင် assignedTo ကို null လုပ်
  const updateData = { ...data };
  if (data.status && data.status !== 'ACTIVE') {
    updateData.assignedToId = null;
  }

  return prisma.tag.update({
    where: { id },
    data: updateData,
    include: {
      assignedTo: { select: { id: true, name: true } },
    },
  });
};

// DELETE - Tag ဖျက်
const remove = async (id) => {
  const existing = await prisma.tag.findUnique({ where: { id } });
  if (!existing) throw new Error('Tag not found');

  await prisma.tag.delete({ where: { id } });
  return { message: 'Tag deleted' };
};

// PATCH - Tag ကို user ဆီ assign
const assignTag = async (id, userId) => {
  const [tag, user] = await Promise.all([
    prisma.tag.findUnique({ where: { id } }),
    prisma.user.findUnique({ where: { id: userId } }),
  ]);

  if (!tag) throw new Error('Tag not found');
  if (!user) throw new Error('User not found');
  if (tag.assignedToId) throw new Error('Tag is already assigned');
  if (tag.status !== 'ACTIVE') throw new Error('Tag is not active');

  return prisma.tag.update({
    where: { id },
    data: {
      assignedToId: userId,
      assignedAt: new Date(),
    },
    include: {
      assignedTo: { select: { id: true, name: true, role: true } },
    },
  });
};

// PATCH - Tag ကို user ဆီက ပြန်သိမ်း
const unassignTag = async (id) => {
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) throw new Error('Tag not found');
  if (!tag.assignedToId) throw new Error('Tag is not assigned');

  return prisma.tag.update({
    where: { id },
    data: {
      assignedToId: null,
      assignedAt: null,
    },
  });
};

// GET - Tag statistics
const getStats = async () => {
  const [total, active, inactive, lost, damaged] = await Promise.all([
    prisma.tag.count(),
    prisma.tag.count({ where: { status: 'ACTIVE' } }),
    prisma.tag.count({ where: { status: 'INACTIVE' } }),
    prisma.tag.count({ where: { status: 'LOST' } }),
    prisma.tag.count({ where: { status: 'DAMAGED' } }),
  ]);

  return { total, active, inactive, lost, damaged };
};

module.exports = { getAll, getById, create, update, remove, assignTag, unassignTag, getStats };
