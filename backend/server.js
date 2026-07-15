require('dotenv').config();
const express = require('express');
const cors = require('cors');

// ---- Import Middlewares ----
const { notFound, errorHandler } = require('./middleware/errorHandler');

// ---- Init App ----
const app = express();

// ---- Global Middlewares ----
app.use(cors());
app.use(express.json());

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
app.use('/api/tags', require('./routes/tags'));
app.use('/api/devices', require('./routes/devices'));
app.use('/api/scanlogs', require('./routes/scanLogs'));
// app.use('/api/users', require('./routes/users'));

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
