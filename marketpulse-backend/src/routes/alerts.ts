import { Router, Request, Response } from 'express';
import type { AlertResponse } from '../types/index.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const mockAlerts: AlertResponse[] = [
      {
        id: 1,
        type: 'emerging_threat',
        severity: 'high',
        message: 'BetCity showing abnormal growth: +85% over 4 weeks. Investigate their marketing strategy.',
        competitorName: 'BetCity',
        metricValue: 85,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isRead: false
      },
      {
        id: 2,
        type: 'intent_shift',
        severity: 'high',
        message: 'Problem-related searches ("casino uitbetaling problemen") increased 45% WoW.',
        metricValue: 45,
        createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        isRead: false
      },
      {
        id: 3,
        type: 'competitive_pressure',
        severity: 'medium',
        message: 'Competitive Pressure Index rising: 6.2 → 6.8. Market becoming more aggressive.',
        metricValue: 6.8,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        isRead: true
      },
      {
        id: 4,
        type: 'market_opportunity',
        severity: 'low',
        message: 'Sports betting searches up 32% WoW. Consider product expansion.',
        metricValue: 32,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        isRead: true
      }
    ];
    res.json(mockAlerts);
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

router.patch('/:id/read', async (req: Request, res: Response) => {
  res.json({ success: true });
});

router.patch('/read-all', async (_req: Request, res: Response) => {
  res.json({ success: true, count: 2 });
});

router.get('/count', async (_req: Request, res: Response) => {
  res.json({ unread: 2 });
});

export default router;
