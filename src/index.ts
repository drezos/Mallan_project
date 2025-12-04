import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import metricsRoutes from './routes/metrics.js';
import competitorsRoutes from './routes/competitors.js';
import alertsRoutes from './routes/alerts.js';
import healthRoutes from './routes/health.js';
import config from './config/app.config.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api', healthRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/competitors', competitorsRoutes);
app.use('/api/alerts', alertsRoutes);

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'MarketPulse API',
    version: '1.0.0',
    description: 'Real-time iGaming market intelligence platform',
    endpoints: {
      health: '/api/health',
      status: '/api/status',
      config: '/api/config',
      metrics: '/api/metrics',
      metricsHistory: '/api/metrics/history',
      metricsSummary: '/api/metrics/summary',
      competitors: '/api/competitors',
      competitorDetail: '/api/competitors/:id',
      alerts: '/api/alerts',
      alertCount: '/api/alerts/count'
    }
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 MarketPulse API Server Started');
  console.log('=====================================');
  console.log(`📍 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🎰 Brand: ${config.brand.name}`);
  console.log(`🏆 Competitors: ${config.competitors.length}`);
  console.log(`📊 Intent Keywords: ${Object.values(config.intentKeywords).flat().length}`);
  console.log(`🇳🇱 Market: ${config.market.regionName}`);
  console.log('=====================================\n');
});

export default app;
