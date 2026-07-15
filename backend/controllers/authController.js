const prisma = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/password');
const generateToken = require('../utils/token');

/**
 * @desc    User အသစ် register လုပ်
 * @route   POST /api/auth/register
 * @access  Public
 *
 * Input:  { name, email, password }
 * Output: { success, token, user }
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // 1. Email တူနေလား စစ်
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // 2. Password hash လုပ်
    const hashedPassword = await hashPassword(password);

    // 3. DB ထဲ user အသစ်ထည့်
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }, // password မပြန်ဘူး
    });

    // 4. Token ထုတ်
    const token = generateToken(user.id);

    // 5. Response ပြန်
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login လုပ်
 * @route   POST /api/auth/login
 * @access  Public
 *
 * Input:  { email, password }
 * Output: { success, token, user }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Email နဲ့ user ရှာ (password ပါ ထည့်ယူ)
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // User မရှိရင် generic message ပြန် (security အတွက်)
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Account deactivate ဖြစ်နေလား
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated',
      });
    }

    // 2. Password မှန်လား စစ်
    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // 3. lastLoginAt update
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 4. Token ထုတ်
    const token = generateToken(user.id);

    // 5. Response ပြန် (password မပါအောင်)
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        lastLoginAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login ဝင်ထားတဲ့ user ရဲ့ info ပြန်
 * @route   GET /api/auth/me
 * @access  Private (login ဝင်ထားရမယ်)
 *
 * Header: Authorization: Bearer <token>
 * Output: { success, user }
 */
const getMe = async (req, res, next) => {
  try {
    // protect middleware က req.user ထဲထည့်ပေးထားပြီးသား
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
