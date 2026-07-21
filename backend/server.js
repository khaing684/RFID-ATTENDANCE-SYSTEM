require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// ---- Import Middlewares ----
const { notFound, errorHandler } = require('./middleware/errorHandler');

// ---- Init App ----
const app = express();

// ========================================
// 🔒 Security Middlewares
// ========================================

// 1. Helmet - HTTP Security Headers
app.use(helmet());

// 2. CORS - Restrict origins
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CLIENT_URL]  // production ဆို frontend domain ပဲခွင့်ပြု
  : ['http://localhost:5173', 'http://localhost:5174'];  // dev ဆို Vite dev server

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true,
}));

// 3. Body Parser (size limit ထည့်)
app.use(express.json({ limit: '10mb' }));

// ---- Health Check ----
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'RFID Management API is running',
    timestamp: new Date().toISOString(),
  });
});

// ---- Routes ----
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/scanlogs', require('./routes/scanLogs'));
app.use('/api/users', require('./routes/users'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api', require('./routes/classes'));
app.use('/api', require ('./routes/timetable'));

// ---- Error Handling ----
app.use(notFound);
app.use(errorHandler);

// ---- Start Server ----
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
