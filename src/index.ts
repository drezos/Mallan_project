// MarketPulse Backend Server
// Express.js API for iGaming Market Intelligence

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import routes
import metricsRouter from './routes/metrics';
import competitorsRouter from './routes/competitors';
import alertsRouter from './routes/alerts';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ===========================================
// MIDDLEWARE
// ===========================================

// CORS - Allow requests from Vercel frontend
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://mallan-project.vercel.app',
    /\.vercel\.app$/  // Allow all Vercel preview deployments
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// JSON body parser
app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ===========================================
// ROUTES
// ===========================================

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    dataForSeoConfigured: !!(process.env.DATAFORSEO_LOGIN && process.env.DATAFORSEO_PASSWORD)
  });
});

// API info endpoint
app.get('/api', (req: Request, res: Response) => {
  res.json({
    name: 'MarketPulse API',
    version: '1.0.0',
    description: 'Real-time iGaming market intelligence for Netherlands operators',
    endpoints: {
      health: 'GET /api/health',
      metrics: 'GET /api/metrics',
      metricsHistory: 'GET /api/metrics/history',
      metricsRefresh: 'GET /api/metrics/refresh',
      competitors: 'GET /api/competitors',
      competitorDetail: 'GET /api/competitors/:name',
      alerts: 'GET /api/alerts',
      alertsHighPriority: 'GET /api/alerts/high-priority'
    },
    region: 'Netherlands',
    brand: 'Jacks.nl'
  });
});

// Mount route handlers
app.use('/api/metrics', metricsRouter);
app.use('/api/competitors', competitorsRouter);
app.use('/api/alerts', alertsRouter);

// Root redirect to API info
app.get('/', (req: Request, res: Response) => {
  res.redirect('/api');
});

// ===========================================
// ERROR HANDLING
// ===========================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} does not exist`,
    availableEndpoints: '/api'
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ===========================================
// START SERVER
// ===========================================

app.listen(PORT, () => {
  console.log('');
  console.log('===========================================');
  console.log('  MarketPulse API Server');
  console.log('===========================================');
  console.log(`  Port: ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  DataForSEO: ${process.env.DATAFORSEO_LOGIN ? '✅ Configured' : '❌ Not configured (using mock data)'}`);
  console.log('');
  console.log('  Endpoints:');
  console.log('    GET /api/health');
  console.log('    GET /api/metrics');
  console.log('    GET /api/metrics/history');
  console.log('    GET /api/metrics/refresh');
  console.log('    GET /api/competitors');
  console.log('    GET /api/competitors/:name');
  console.log('    GET /api/alerts');
  console.log('    GET /api/alerts/high-priority');
  console.log('');
  console.log('===========================================');
});

export default app;
