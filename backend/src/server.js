/**
 * Startup Radar Backend Server
 * Main entry point for the API
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const scoringRoutes = require('./scoring');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'startup-radar-backend',
        version: '2.0.0',
        scoring_version: 'v2'
    });
});

// Mount scoring routes
app.use('/api/scoring', scoringRoutes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Startup Radar Backend API',
        version: '2.0.0',
        endpoints: {
            health: '/health',
            scoring_v2: '/api/scoring/v2/startups',
            scoring_calculate: '/api/scoring/v2/calculate'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Startup Radar Backend running on port ${PORT}`);
    console.log(`📊 Scoring v2 API available at http://localhost:${PORT}/api/scoring/v2/startups`);
    console.log(`🩺 Health check at http://localhost:${PORT}/health`);
});

module.exports = app;