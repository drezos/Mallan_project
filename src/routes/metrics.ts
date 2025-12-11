// Metrics API Routes
// Returns market intelligence data from DataForSEO

import { Router, Request, Response } from 'express';
import { dataForSEOService, MarketOverview } from '../services/dataForSeo';

const router = Router();

// Cache for market data (refreshes every hour)
let cachedMarketData: MarketOverview | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Calculate Market Share Momentum Score (0-10)
 * Formula: ((Your Growth % - Market Growth %) / Market Growth %) × 10
 */
function calculateMomentumScore(brandChange: number, marketChange: number): number {
  if (marketChange === 0) return 5; // Neutral if market is flat
  
  const rawMomentum = ((brandChange - marketChange) / Math.abs(marketChange)) * 10;
  
  // Cap between 0 and 10
  return Math.max(0, Math.min(10, Math.round((rawMomentum + 10) / 2 * 10) / 10));
}

/**
 * Calculate Competitive Pressure Index (0-10)
 * Higher when competitors are growing aggressively
 */
function calculateCompetitivePressure(competitors: MarketOverview['competitors']): number {
  if (competitors.length === 0) return 5;
  
  // Calculate average growth and volatility
  const growthRates = competitors.map(c => c.weeklyChange);
  const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
  
  // Calculate standard deviation (volatility)
  const variance = growthRates.reduce((sum, rate) => sum + Math.pow(rate - avgGrowth, 2), 0) / growthRates.length;
  const stdDev = Math.sqrt(variance);
  
  // Combine avg growth and volatility into pressure score
  const pressureRaw = (avgGrowth / 5) + (stdDev / 10);
  
  // Normalize to 0-10
  return Math.max(0, Math.min(10, Math.round((pressureRaw + 5) * 10) / 10));
}

/**
 * Detect emerging competitor threats
 * Alert if growth > baseline + 2σ
 */
function detectEmergingThreats(competitors: MarketOverview['competitors']): Array<{
  name: string;
  growth: number;
  severity: 'high' | 'medium' | 'low';
  message: string;
}> {
  const alerts: Array<{name: string; growth: number; severity: 'high' | 'medium' | 'low'; message: string}> = [];
  
  // Calculate baseline and threshold
  const growthRates = competitors.map(c => c.weeklyChange);
  const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
  const variance = growthRates.reduce((sum, rate) => sum + Math.pow(rate - avgGrowth, 2), 0) / growthRates.length;
  const stdDev = Math.sqrt(variance);
  
  const highThreshold = avgGrowth + (2 * stdDev);
  const mediumThreshold = avgGrowth + (1 * stdDev);
  
  for (const competitor of competitors) {
    if (competitor.name === 'JACKS') continue; // Skip your own brand
    
    if (competitor.weeklyChange > highThreshold) {
      alerts.push({
        name: competitor.name,
        growth: competitor.weeklyChange,
        severity: 'high',
        message: `${competitor.name} is growing ${competitor.weeklyChange.toFixed(1)}% WoW — significantly above market average`
      });
    } else if (competitor.weeklyChange > mediumThreshold) {
      alerts.push({
        name: competitor.name,
        growth: competitor.weeklyChange,
        severity: 'medium',
        message: `${competitor.name} is accelerating at ${competitor.weeklyChange.toFixed(1)}% WoW`
      });
    }
  }
  
  // Sort by growth rate descending
  return alerts.sort((a, b) => b.growth - a.growth);
}

/**
 * Analyze intent shifts
 * Alert if problem/regulation categories spike
 */
function analyzeIntentShifts(intentCategories: MarketOverview['intentCategories']): Array<{
  category: string;
  change: number;
  severity: 'high' | 'medium' | 'low';
  message: string;
}> {
  const alerts: Array<{category: string; change: number; severity: 'high' | 'medium' | 'low'; message: string}> = [];
  
  for (const intent of intentCategories) {
    // Problem and regulation categories are concerning when they spike
    if (intent.category === 'problem' && intent.weeklyChange > 15) {
      alerts.push({
        category: intent.category,
        change: intent.weeklyChange,
        severity: intent.weeklyChange > 30 ? 'high' : 'medium',
        message: `Problem-related searches up ${intent.weeklyChange.toFixed(1)}% — potential market distress signal`
      });
    }
    
    if (intent.category === 'regulation' && intent.weeklyChange > 20) {
      alerts.push({
        category: intent.category,
        change: intent.weeklyChange,
        severity: intent.weeklyChange > 50 ? 'high' : 'medium',
        message: `Regulation searches spiking ${intent.weeklyChange.toFixed(1)}% — possible regulatory activity`
      });
    }
    
    // Comparison dropping can indicate market maturity or player fatigue
    if (intent.category === 'comparison' && intent.weeklyChange < -10) {
      alerts.push({
        category: intent.category,
        change: intent.weeklyChange,
        severity: 'low',
        message: `Comparison searches down ${Math.abs(intent.weeklyChange).toFixed(1)}% — players may be settling on preferred brands`
      });
    }
  }
  
  return alerts.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

// ===========================================
// ROUTES
// ===========================================

/**
 * GET /api/metrics
 * Returns full market intelligence dashboard data
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    
    // Check cache
    if (cachedMarketData && (now - lastFetchTime) < CACHE_DURATION_MS) {
      console.log('Returning cached market data');
    } else {
      console.log('Fetching fresh market data from DataForSEO...');
      cachedMarketData = await dataForSEOService.fetchMarketOverview();
      lastFetchTime = now;
    }
    
    if (!cachedMarketData) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch market data'
      });
    }
    
    const data = cachedMarketData;
    
    // Find your brand in competitors
    const yourBrand = data.competitors.find(c => c.name === 'JACKS');
    const brandChange = yourBrand?.weeklyChange || 0;
    
    // Calculate derived metrics
    const momentumScore = calculateMomentumScore(brandChange, data.weeklyChange);
    const competitivePressure = calculateCompetitivePressure(data.competitors);
    const emergingThreats = detectEmergingThreats(data.competitors);
    const intentShifts = analyzeIntentShifts(data.intentCategories);
    
    // Calculate market share for each competitor
    const competitorsWithShare = data.competitors.map(c => ({
      ...c,
      marketShare: data.totalMarketVolume > 0 
        ? Math.round((c.totalVolume / data.totalMarketVolume) * 1000) / 10 
        : 0
    }));
    
    // Sort competitors by volume
    competitorsWithShare.sort((a, b) => b.totalVolume - a.totalVolume);
    
    // Calculate your rank
    const yourRank = competitorsWithShare.findIndex(c => c.name === 'JACKS') + 1;
    
    // Build response
    const response = {
      success: true,
      data: {
        date: new Date().toISOString().split('T')[0],
        region: 'Netherlands',
        brand: {
          name: 'Jacks.nl',
          keywords: ['jacks.nl', 'jacks casino', 'jack casino']
        },
        metrics: {
          marketShareMomentum: {
            score: momentumScore,
            trend: momentumScore > 5 ? 'gaining' : momentumScore < 5 ? 'losing' : 'stable',
            change: brandChange,
            confidence: 0.85
          },
          competitivePressure: {
            score: competitivePressure,
            level: competitivePressure > 7 ? 'high' : competitivePressure > 4 ? 'medium' : 'low',
            trend: 'stable'
          },
          searchIntentShift: {
            comparison: {
              volume: data.intentCategories.find(c => c.category === 'comparison')?.totalVolume || 0,
              change: data.intentCategories.find(c => c.category === 'comparison')?.weeklyChange || 0
            },
            problem: {
              volume: data.intentCategories.find(c => c.category === 'problem')?.totalVolume || 0,
              change: data.intentCategories.find(c => c.category === 'problem')?.weeklyChange || 0
            },
            regulation: {
              volume: data.intentCategories.find(c => c.category === 'regulation')?.totalVolume || 0,
              change: data.intentCategories.find(c => c.category === 'regulation')?.weeklyChange || 0
            },
            product: {
              volume: data.intentCategories.find(c => c.category === 'product')?.totalVolume || 0,
              change: data.intentCategories.find(c => c.category === 'product')?.weeklyChange || 0
            },
            review: {
              volume: data.intentCategories.find(c => c.category === 'review')?.totalVolume || 0,
              change: data.intentCategories.find(c => c.category === 'review')?.weeklyChange || 0
            }
          },
          brandHealth: {
            shareOfSearch: data.brandShare,
            searchVolume: yourBrand?.totalVolume || 0,
            weeklyChange: brandChange,
            marketRank: yourRank
          },
          sentimentVelocity: {
            score: 6.2, // Would need sentiment analysis for real score
            trend: 'stable',
            positiveRatio: 0.72
          }
        },
        marketOpportunity: {
          tam: {
            volume: data.totalMarketVolume,
            weeklyChange: data.weeklyChange,
            trend: data.weeklyChange > 0 ? 'growing' : 'declining'
          },
          categories: data.intentCategories.map(cat => ({
            name: cat.category,
            volume: cat.totalVolume,
            percentage: data.totalMarketVolume > 0 
              ? Math.round((cat.totalVolume / data.totalMarketVolume) * 1000) / 10 
              : 0,
            trend: cat.weeklyChange > 5 ? 'growing' : cat.weeklyChange < -5 ? 'declining' : 'stable'
          }))
        }
      },
      meta: {
        lastUpdated: data.lastUpdated,
        dataSource: dataForSEOService.isReady() ? 'DataForSEO' : 'Mock Data',
        cacheAge: Math.round((now - lastFetchTime) / 1000 / 60) + ' minutes'
      }
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Error in /api/metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/metrics/history
 * Returns historical trend data (12 weeks)
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    
    // Use cached data if available
    if (!cachedMarketData || (now - lastFetchTime) >= CACHE_DURATION_MS) {
      cachedMarketData = await dataForSEOService.fetchMarketOverview();
      lastFetchTime = now;
    }
    
    if (!cachedMarketData) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch market data'
      });
    }
    
    // Build historical response from trend data
    const yourBrand = cachedMarketData.competitors.find(c => c.name === 'JACKS');
    
    res.json({
      success: true,
      data: {
        brand: {
          name: 'Jacks.nl',
          history: yourBrand?.trendData || []
        },
        market: {
          history: cachedMarketData.competitors[0]?.trendData || [] // Use first competitor as market proxy
        },
        competitors: cachedMarketData.competitors
          .filter(c => c.name !== 'JACKS')
          .map(c => ({
            name: c.name,
            history: c.trendData
          }))
      },
      meta: {
        lastUpdated: cachedMarketData.lastUpdated,
        dataSource: dataForSEOService.isReady() ? 'DataForSEO' : 'Mock Data'
      }
    });
  } catch (error: any) {
    console.error('Error in /api/metrics/history:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/metrics/refresh
 * Force refresh of market data (bypasses cache)
 */
router.get('/refresh', async (req: Request, res: Response) => {
  try {
    console.log('Forcing market data refresh...');
    cachedMarketData = await dataForSEOService.fetchMarketOverview();
    lastFetchTime = Date.now();
    
    res.json({
      success: true,
      message: 'Market data refreshed',
      lastUpdated: cachedMarketData?.lastUpdated,
      dataSource: dataForSEOService.isReady() ? 'DataForSEO' : 'Mock Data'
    });
  } catch (error: any) {
    console.error('Error refreshing market data:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to refresh data'
    });
  }
});

export default router;
