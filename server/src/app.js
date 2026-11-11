const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const readingRoutes = require('./routes/readingRoutes');
const reportRoutes = require('./routes/reportRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const { runDailyReminderCheck } = require('./jobs/reminderJob');
const cacheService = require('./services/cacheService');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health Check & Cache Stats
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cache: cacheService.getStats()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/readings', readingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/doctor', doctorRoutes);

// Background Job Trigger Endpoint
app.post('/api/jobs/trigger-reminder', async (req, res) => {
  try {
    const summary = await runDailyReminderCheck();
    res.status(200).json({ message: 'Daily reminder check executed successfully.', summary });
  } catch (err) {
    res.status(500).json({ message: 'Failed to execute reminder job.' });
  }
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;
