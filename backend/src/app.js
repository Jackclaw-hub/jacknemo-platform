const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const { securityHeaders, apiRateLimiter } = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(securityHeaders);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting for all API routes
app.use('/api', apiRateLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', require('./routes/listings'));
app.use('/api/radar', require('./routes/radar'));
app.use('/api/founders', require('./routes/founders'));
app.use('/api/providers', require('./routes/providers'));
app.use('/api/messages', require('./routes/messages'));

// Weekly digest cron
require('./jobs/weeklyDigest');
app.use('/api/admin', require('./routes/admin'));
app.use('/api/scoring', require('./services/scoring_api'));

// Admin: manual digest trigger (for testing)
app.post('/api/admin/send-digest', require('./middleware/auth').authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { sendWeeklyDigest } = require('./services/digestService');
  sendWeeklyDigest().catch(console.error);
  res.json({ message: 'Digest triggered — check logs' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Startup Radar API is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Startup Radar API server running on port ${PORT}`);
  console.log(`📍 Health check available at http://localhost:${PORT}/api/health`);
});

module.exports = app;