import { Router, Request, Response } from 'express';
import { healthCheck } from '../db/index.js';
import config from '../config/app.config.js';

const router = Router();

router.get('/health', async (_req: Request, res: Response) => {
  const dbHealthy = await healthCheck();
  
  res.status(dbHealthy ? 200 : 503).json({
    status: dbHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: dbHealthy ? 'connected' : 'disconnected',
      api: 'running'
    }
  });
});

router.get('/status', async (_req: Request, res: Response) => {
  const dbHealthy = await healthCheck();
  
  res.json({
    app: 'MarketPulse',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    market: {
      region: config.market.regionName,
      regionId: config.market.regionId,
      language: config.market.languageCode
    },
    tracking: {
      brand: config.brand.name,
      competitors: config.competitors.length,
      intentKeywords: Object.values(config.intentKeywords).flat().length
    },
    database: dbHealthy ? 'connected' : 'disconnected',
    lastUpdated: new Date().toISOString()
  });
});

router.get('/config', (_req: Request, res: Response) => {
  res.json({
    brand: { name: config.brand.name },
    competitors: config.competitors.map(c => c.name),
    market: {
      region: config.market.regionName,
      currency: config.market.currency
    },
    intentCategories: Object.keys(config.intentKeywords)
  });
});

export default router;
