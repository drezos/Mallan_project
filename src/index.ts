import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import marketRouter from './routes/market';
import userCompetitorsRouter from './routes/user-competitors';
import tenantsRouter from './routes/tenants';

// Import cache service for initialization
import { cacheService } from './db/cache';

// Import migrations
import { runMigrations } from './db/migrations';

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
app.use('/api/market', marketRouter);
app.use('/api/user/competitors', userCompetitorsRouter);
app.use('/api/tenants', tenantsRouter);

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
      status: '/api/market/status',
      brands: '/api/market/brands',
      trends: '/api/market/trends',
      intent: '/api/market/intent',
      metrics: '/api/market/metrics',
      dashboard: '/api/market/dashboard',
      cacheStatus: '/api/market/cache-status',
      forceRefresh: '/api/market/refresh',
      userCompetitors: '/api/user/competitors',
      tenantsCreate: '/api/tenants/create',
      tenantsGet: '/api/tenants/:id'
    }
  });
});

// Initialize and start server
async function start() {
  try {
    // Initialize cache table
    await cacheService.init();

    // Clear stale cache data on startup (fixes incorrect dashboard data from previous competitor changes)
    await cacheService.clearAll();

    // Run database migrations
    await runMigrations();

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
