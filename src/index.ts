import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import healthRouter from './routes/health';
import metricsRouter from './routes/metrics';
import competitorsRouter from './routes/competitors';
import alertsRouter from './routes/alerts';

// Import cache service for initialization
import { cacheService } from './db/cache';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/health', healthRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/competitors', competitorsRouter);
app.use('/api/alerts', alertsRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'MarketPulse API',
    version: '1.1.0',
    description: 'Dutch iGaming Market Intelligence',
    features: {
      caching: 'Weekly database-backed cache',
      refresh: 'Manual or 7-day auto-expiry'
    },
    endpoints: {
      health: '/api/health',
      metrics: '/api/metrics',
      cacheStatus: '/api/metrics/cache-status',
      forceRefresh: '/api/metrics/refresh',
      competitors: '/api/competitors',
      alerts: '/api/alerts'
    }
  });
});

// Initialize and start server
async function start() {
  try {
    // Initialize cache table
    await cacheService.init();

    // Check DataForSEO config
    const dataForSeoConfigured = !!(
      process.env.DATAFORSEO_LOGIN && 
      process.env.DATAFORSEO_PASSWORD
    );

    console.log('\n=================================');
    console.log('   MarketPulse API v1.1.0');
    console.log('=================================');
    console.log(`DataForSEO: ${dataForSeoConfigured ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`Database: ✅ Connected`);
    console.log(`Cache: Weekly refresh (7 days)`);
    console.log('=================================\n');

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
