import { Router, Request, Response } from 'express';
import type { CompetitorResponse } from '../types/index.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const mockCompetitors: CompetitorResponse[] = [
      { id: 1, name: 'Toto', searchVolume: 15200, growthRate: 2.5, weeklyTrend: 'stable', riskLevel: 'low', marketShare: 18.5 },
      { id: 2, name: 'Unibet', searchVolume: 11800, growthRate: -3.2, weeklyTrend: 'down', riskLevel: 'low', marketShare: 14.4 },
      { id: 3, name: 'Bet365', searchVolume: 11500, growthRate: 8.5, weeklyTrend: 'up', riskLevel: 'medium', marketShare: 14.0 },
      { id: 4, name: 'BetCity', searchVolume: 9200, growthRate: 25.0, weeklyTrend: 'up', riskLevel: 'high', marketShare: 11.2 },
      { id: 5, name: 'Holland Casino', searchVolume: 8500, growthRate: 1.2, weeklyTrend: 'stable', riskLevel: 'low', marketShare: 10.4 },
      { id: 6, name: 'Circus', searchVolume: 5200, growthRate: 4.5, weeklyTrend: 'up', riskLevel: 'low', marketShare: 6.3 },
      { id: 7, name: '711', searchVolume: 4800, growthRate: -1.8, weeklyTrend: 'down', riskLevel: 'low', marketShare: 5.9 },
      { id: 8, name: 'Kansino', searchVolume: 4200, growthRate: 12.0, weeklyTrend: 'up', riskLevel: 'medium', marketShare: 5.1 },
      { id: 9, name: 'BetMGM', searchVolume: 3800, growthRate: 18.5, weeklyTrend: 'up', riskLevel: 'medium', marketShare: 4.6 },
      { id: 10, name: 'LeoVegas', searchVolume: 3500, growthRate: -0.5, weeklyTrend: 'stable', riskLevel: 'low', marketShare: 4.3 }
    ];
    res.json(mockCompetitors);
  } catch (error) {
    console.error('Error fetching competitors:', error);
    res.status(500).json({ error: 'Failed to fetch competitors' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const competitors = [
      { id: 1, name: 'Toto', keywords: ['toto casino', 'toto sport'] },
      { id: 2, name: 'Unibet', keywords: ['unibet', 'unibet nederland'] },
      { id: 3, name: 'Bet365', keywords: ['bet365', 'bet365 nederland'] },
      { id: 4, name: 'BetCity', keywords: ['betcity', 'betcity.nl'] },
      { id: 5, name: 'Holland Casino', keywords: ['holland casino', 'holland casino online'] },
      { id: 6, name: 'Circus', keywords: ['circus casino', 'circus.nl'] },
      { id: 7, name: '711', keywords: ['711 casino', '711.nl'] },
      { id: 8, name: 'Kansino', keywords: ['kansino', 'kansino.nl'] },
      { id: 9, name: 'BetMGM', keywords: ['betmgm', 'betmgm nederland'] },
      { id: 10, name: 'LeoVegas', keywords: ['leovegas', 'leovegas nederland'] }
    ];

    const competitor = competitors.find(c => c.id === parseInt(id));
    if (!competitor) {
      return res.status(404).json({ error: 'Competitor not found' });
    }

    res.json({
      id: competitor.id,
      name: competitor.name,
      keywords: competitor.keywords,
      current: {
        searchVolume: 5000 + Math.floor(Math.random() * 10000),
        growthRateWeekly: Math.random() * 20 - 5,
        marketShare: 5 + Math.random() * 15,
        riskLevel: 'medium'
      },
      summary: {
        avgGrowth12Week: 8.5,
        trend: 'Growing',
        threatLevel: 'Medium'
      },
      history: []
    });
  } catch (error) {
    console.error('Error fetching competitor detail:', error);
    res.status(500).json({ error: 'Failed to fetch competitor detail' });
  }
});

router.get('/data/comparison', async (_req: Request, res: Response) => {
  try {
    res.json({
      yourBrand: { name: 'Jacks.nl', searchVolume: 6500, marketShare: '7.9' },
      competitors: [
        { name: 'Toto', searchVolume: 15200, marketShare: '18.5' },
        { name: 'Unibet', searchVolume: 11800, marketShare: '14.4' }
      ],
      totalMarket: 82000
    });
  } catch (error) {
    console.error('Error fetching comparison:', error);
    res.status(500).json({ error: 'Failed to fetch comparison' });
  }
});

export default router;
