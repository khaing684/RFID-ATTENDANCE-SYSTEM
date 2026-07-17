const prisma = require('../config/db');

/**
 * @desc    Dashboard - Role အလိုက် ပြောင်းလဲပြမယ်
 * @route   GET /api/dashboard
 * @access  Private
 */
const getDashboard = async (req, res, next) => {
  try {
    const { id: userId, role } = req.user;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (role === 'ADMIN') {
      // ====== ADMIN: အားလုံးမြင်ရ ======
      const [
        totalTags,
        activeTags,
        totalDevices,
        onlineDevices,
        totalUsers,
        todayScans,
        todayCheckIns,
        todayCheckOuts,
        recentLogs,
      ] = await Promise.all([
        prisma.tag.count(),
        prisma.tag.count({ where: { status: 'ACTIVE' } }),
        prisma.device.count(),
        prisma.device.count({ where: { status: 'ONLINE' } }),
        prisma.user.count({ where: { isActive: true } }),
        prisma.scanLog.count({ where: { scannedAt: { gte: today } } }),
        prisma.scanLog.count({ where: { scannedAt: { gte: today }, scanType: 'CHECK_IN' } }),
        prisma.scanLog.count({ where: { scannedAt: { gte: today }, scanType: 'CHECK_OUT' } }),
        prisma.scanLog.findMany({
          take: 10,
          orderBy: { scannedAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, role: true } },
            tag: { select: { id: true, rfidCode: true } },
            device: { select: { id: true, name: true } },
          },
        }),
      ]);

      return res.json({
        success: true,
        role: 'ADMIN',
        stats: {
          totalTags, activeTags, totalDevices, onlineDevices,
          totalUsers, todayScans, todayCheckIns, todayCheckOuts,
        },
        recentLogs,
      });
    }

    if (role === 'TEACHER') {
      // ====== TEACHER: သူ့ကျောင်းသားတွေရဲ့ data ပဲမြင်ရ ======
      const teacherTags = await prisma.tag.findMany({
        where: { assignedToId: userId },
        select: { id: true },
      });
      const assignedTagIds = teacherTags.map((t) => t.id);

      const [myTagsCount, todayScans, recentLogs] = await Promise.all([
        prisma.tag.count({ where: { assignedToId: userId } }),
        prisma.scanLog.count({
          where: { scannedAt: { gte: today }, tagId: { in: assignedTagIds } },
        }),
        prisma.scanLog.findMany({
          take: 10,
          orderBy: { scannedAt: 'desc' },
          where: { tagId: { in: assignedTagIds } },
          include: {
            user: { select: { id: true, name: true, role: true } },
            tag: { select: { id: true, rfidCode: true } },
            device: { select: { id: true, name: true } },
          },
        }),
      ]);

      return res.json({
        success: true,
        role: 'TEACHER',
        stats: { myTagsCount, todayScans },
        recentLogs,
      });
    }

    // ====== STUDENT: သူ့ data ပဲမြင်ရ ======
    const myTag = await prisma.tag.findFirst({ where: { assignedToId: userId } });

    const [todayScans, recentLogs] = await Promise.all([
      prisma.scanLog.count({
        where: { scannedAt: { gte: today }, userId },
      }),
      prisma.scanLog.findMany({
        take: 10,
        orderBy: { scannedAt: 'desc' },
        where: { userId },
        include: {
          user: { select: { id: true, name: true, role: true } },
          tag: { select: { id: true, rfidCode: true } },
          device: { select: { id: true, name: true } },
        },
      }),
    ]);

    return res.json({
      success: true,
      role: 'STUDENT',
      stats: {
        myTagCode: myTag?.rfidCode || 'No tag assigned',
        todayScans,
      },
      recentLogs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
