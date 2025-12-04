import { Router, Request, Response } from 'express';
import { query } from '../db/index.js';
import type { MetricsResponse, TrendDataPoint } from '../types/index.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const result = await query<{
      date: Date;
      market_share_momentum: number;
      competitive_pressure: number;
      sentiment_score: number;
      brand_heat: number;
      week_over_week_change: number;
    }>(`
      SELECT date, market_share_momentum, competitive_pressure, 
             sentiment_score, brand_heat, week_over_week_change
      FROM calculated_metrics WHERE user_id = 1 ORDER BY date DESC LIMIT 1
    `);

    if (result.rows.length === 0) {
      return res.json({
        date: new Date().toISOString().split('T')[0],
        marketShareMomentum: 7.2,
        competitivePressure: 6.5,
        sentimentScore: 0.72,
        brandHeat: 8.1,
        weekOverWeekChange: 3.5
      });
    }

    const row = result.rows[0];
    res.json({
      date: row.date.toISOString().split('T')[0],
      marketShareMomentum: row.market_share_momentum,
      competitivePressure: row.competitive_pressure,
      sentimentScore: row.sentiment_score,
      brandHeat: row.brand_heat,
      weekOverWeekChange: row.week_over_week_change
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

router.get('/history', async (_req: Request, res: Response) => {
  try {
    // Generate mock trend data
    const mockTrend: TrendDataPoint[] = [];
    for (let i = 12; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      mockTrend.push({
        date: date.toISOString().split('T')[0],
        yourBrand: 5000 + (12 - i) * 200 + Math.floor(Math.random() * 300),
        marketAverage: 8000 + Math.floor(Math.random() * 500)
      });
    }
    res.json(mockTrend);
  } catch (error) {
    console.error('Error fetching metrics history:', error);
    res.status(500).json({ error: 'Failed to fetch metrics history' });
  }
});

router.get('/summary', async (_req: Request, res: Response) => {
  try {
    res.json({
      marketShare: { value: 8.1, change: 3.5, trend: 'up' },
      momentum: { value: 7.2, status: 'Gaining' },
      competitivePressure: { value: 6.5, intensity: 'Medium' },
      unreadAlerts: 3
    });
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

export default router;
