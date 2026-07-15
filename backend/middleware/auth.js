const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

/**
 * protect Middleware
 * Route တွေကို login ဝင်ထားသူသာ သုံးခွင့်ပေးမယ်
 *
 * Request header: Authorization: Bearer <token>
 *
 * Step 1: Header ထဲမှာ token ပါလားစစ်
 * Step 2: Token ကို verify လုပ်
 * Step 3: Token ထဲက userId နဲ့ DB ထဲ user ရှား
 * Step 4: req.user = user (နောက် route တွေမှာ ပြန်သုံးလို့ရ)
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Step 1: Header ကနေ token ဆွဲထုတ်
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
      // "Bearer eyJhbG..."  →  split(' ')  →  ["Bearer", "eyJhbG..."]
      // [1] က token ပဲထုတ်မယ်
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
      });
    }

    // Step 2: Token verify လုပ်
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded = { id: "uuid-123", iat: 123456, exp: 123456 }

    // Step 3: DB ထဲက user ရှာ
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      }, // password မပါအောင် select နဲ့ ရွေး
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated',
      });
    }

    // Step 4: req.user ထဲထည့်
    req.user = user;
    next(); // နောက် middleware/controller ဆီ pass
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token is invalid',
    });
  }
};

/**
 * adminOnly Middleware
 * ADMIN role ရှိသူသာ ဖြတ်ခွင့်ပေးမယ်
 * protect middleware ပြီးမှ ဒါကို ဆက်သုံး
 *
 * သုံးပုံ: router.delete('/:id', protect, adminOnly, deleteUser)
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next(); // ADMIN ဆို pass
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied, admin only',
    });
  }
};

module.exports = { protect, adminOnly };
