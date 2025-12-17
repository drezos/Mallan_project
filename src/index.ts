/**
 * MarketPulse Backend Server
 * 
 * Express.js API server for iGaming market intelligence
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import marketRoutes from './routes/market';
import { brands, intentKeywords, getOwnBrand, getKeywordCounts } from './config/brandKeywords';

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// MIDDLEWARE
// =============================================================================

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON parsing
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.path}`);
  next();
});

// =============================================================================
// HEALTH & STATUS ROUTES
// =============================================================================

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  const counts = getKeywordCounts();
  const ownBrand = getOwnBrand();
  
  res.json({
    name: 'MarketPulse API',
    version: '1.0.0',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    config: {
      ownBrand: ownBrand?.displayName || 'Not configured',
      totalBrands: brands.length,
      competitors: brands.length - 1,
      intentCategories: intentKeywords.length,
      totalKeywords: counts.total,
      dataForSeoConfigured: !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD)
    },
    endpoints: {
      health: '/api/health',
      market: {
        status: '/api/market/status',
        brands: '/api/market/brands',
        trends: '/api/market/trends',
        intent: '/api/market/intent',
        metrics: '/api/market/metrics',
        dashboard: '/api/market/dashboard',
        serp: '/api/market/serp/:keyword'
      },
      legacy: {
        competitors: '/api/competitors',
        alerts: '/api/alerts',
        metrics: '/api/metrics'
      }
    }
  });
});

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// =============================================================================
// API ROUTES
// =============================================================================

// Market intelligence routes (new)
app.use('/api/market', marketRoutes);

// =============================================================================
// LEGACY ROUTES (for backward compatibility with existing frontend)
// =============================================================================

// Legacy: Get competitors
app.get('/api/competitors', async (req: Request, res: Response) => {
  try {
    // Return brand data in legacy format
    const competitors = brands.filter(b => !b.isOwnBrand).map((brand, index) => ({
      id: brand.id,
      name: brand.displayName,
      website: brand.website,
      searchRank: index + 1,
      trend: Math.random() > 0.5 ? 'up' : (Math.random() > 0.5 ? 'down' : 'stable'),
      weeklyGrowth: Math.round((Math.random() * 20 - 5) * 10) / 10,
      status: Math.random() > 0.8 ? 'threat' : 'normal',
      color: brand.color
    }));

    res.json(competitors);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Legacy: Get alerts
app.get('/api/alerts', (req: Request, res: Response) => {
  const alerts = [
    {
      id: 1,
      type: 'emerging_threat',
      severity: 'high',
      message: '📈 Competitor showing elevated growth - monitor closely',
      timestamp: new Date().toISOString()
    },
    {
      id: 2,
      type: 'intent_shift',
      severity: 'medium',
      message: '🔍 Problem searches increased this week',
      timestamp: new Date().toISOString()
    },
    {
      id: 3,
      type: 'market_opportunity',
      severity: 'low',
      message: '✅ Comparison searches stable - good acquisition conditions',
      timestamp: new Date().toISOString()
    }
  ];

  res.json(alerts);
});

// Legacy: Get metrics
app.get('/api/metrics', (req: Request, res: Response) => {
  const ownBrand = getOwnBrand();
  
  res.json({
    marketShareMomentum: {
      score: 7.2,
      trend: 'gaining',
      yourGrowth: 12.5,
      marketGrowth: 8.3
    },
    competitivePressure: {
      score: 5.8,
      intensity: 'medium'
    },
    brandHeat: {
      yourShare: 8.5,
      totalMarket: 100
    },
    playerSentiment: {
      score: 15,
      trend: 'stable'
    },
    ownBrand: ownBrand?.displayName || 'Jacks Casino',
    lastUpdated: new Date().toISOString()
  });
});

// Legacy: Get status
app.get('/api/status', (req: Request, res: Response) => {
  const ownBrand = getOwnBrand();
  
  res.json({
    status: 'operational',
    ownBrand: ownBrand?.displayName || 'Jacks Casino',
    competitors: brands.filter(b => !b.isOwnBrand).length,
    lastDataFetch: new Date().toISOString(),
    nextScheduledFetch: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  });
});

// =============================================================================
// ERROR HANDLING
// =============================================================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} does not exist`,
    availableEndpoints: '/'
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
  });
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(PORT, () => {
  const counts = getKeywordCounts();
  const ownBrand = getOwnBrand();
  
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                   MarketPulse API                        ║
╠═══════════════════════════════════════════════════════════╣
║  Status:     🟢 Running                                   ║
║  Port:       ${PORT}                                          ║
║  Env:        ${process.env.NODE_ENV || 'development'}                                 ║
╠═══════════════════════════════════════════════════════════╣
║  Own Brand:  ${(ownBrand?.displayName || 'Not set').padEnd(40)}║
║  Competitors: ${String(brands.length - 1).padEnd(39)}║
║  Keywords:   ${String(counts.total).padEnd(40)}║
╠═══════════════════════════════════════════════════════════╣
║  DataForSEO: ${(process.env.DATAFORSEO_LOGIN ? '🟢 Configured' : '🔴 Not configured').padEnd(40)}║
╚═══════════════════════════════════════════════════════════╝
  `);
});

export default app;
