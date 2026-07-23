const prisma = require('../config/db');
const { hashPassword } = require('../utils/password');

/**
 * @desc    User အားလုံးစာရင်း (pagination, filter)
 * @route   GET /api/users
 * @access  Admin
 */
const getAll = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, role, search, classId } = req.query;
    const where = {};

    if (role) where.role = role.toUpperCase();
    if (classId) where.classId = classId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, role: true, classId: true,
          phone: true, avatar: true, dateOfBirth: true, parentName: true,
          address: true, isActive: true, lastLoginAt: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      users,
      pagination: { page: Number(page), limit: Number(limit), total },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    User တစ်ယောက်ချင်း
 * @route   GET /api/users/:id
 * @access  Admin
 */
const getById = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true, role: true, classId: true,
        phone: true, avatar: true, dateOfBirth: true, parentName: true,
        address: true, isActive: true, lastLoginAt: true,
        createdAt: true, updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    User အသစ်ထည့်
 * @route   POST /api/users
 * @access  Admin
 */
const create = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, avatar, classId, dateOfBirth, parentName, address } = req.body;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const hashedPassword = await hashPassword(password || 'password123');

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || 'STUDENT', phone, avatar, classId: classId || undefined, dateOfBirth, parentName, address },
      select: {
        id: true, name: true, email: true, role: true, phone: true, avatar: true,
        dateOfBirth: true, parentName: true, address: true,
        isActive: true, createdAt: true,
      },
    });

    res.status(201).json({ success: true, message: 'User created', user });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    User update
 * @route   PATCH /api/users/:id
 * @access  Admin
 */
const update = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, isActive, avatar, classId, dateOfBirth, parentName, address } = req.body;
    const data = {};

    if (name) data.name = name;
    if (email) data.email = email;
    if (role) data.role = role;
    if (phone !== undefined) data.phone = phone;
    if (isActive !== undefined) data.isActive = isActive;
    if (avatar !== undefined) data.avatar = avatar;
    if (dateOfBirth !== undefined) data.dateOfBirth = dateOfBirth;
    if (parentName !== undefined) data.parentName = parentName;
    if (address !== undefined) data.address = address;
    if (password) data.password = await hashPassword(password);
    if (classId !== undefined) data.classId = classId;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: {
        id: true, name: true, email: true, role: true, phone: true, avatar: true,
        isActive: true, updatedAt: true,
      },
    });

    res.json({ success: true, message: 'User updated', user });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    next(error);
  }
};

/**
 * @desc    User ဖျက်
 * @route   DELETE /api/users/:id
 * @access  Admin
 */
const remove = async (req, res, next) => {
  try {
    // Admin ကိုယ့်ကိုယ်ကို မဖျက်နိုင်အောင်
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
    }

    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
