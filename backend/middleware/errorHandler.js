/**
 * 404 Not Found Middleware
 * မရှိတဲ့ route ကို request လာရင်
 */
const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global Error Handler
 * App တစ်ခုလုံးရဲ့ error တွေကို ဒီမှာစုပြီး handle လုပ်
 */
const errorHandler = (err, req, res, _next) => {
  // Server error တွေကို 500 ထား၊ တခြား error တွေက statusCode အတိုင်း
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message,
    // Development မှာပဲ stack trace ပြမယ်
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
