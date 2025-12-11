// Competitors API Routes
// Returns competitor analysis data from DataForSEO

import { Router, Request, Response } from 'express';
import { dataForSEOService, MarketOverview } from '../services/dataForSeo';

const router = Router();

// Share cached data with metrics route
let cachedMarketData: MarketOverview | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Calculate velocity status based on growth rate
 */
function getVelocityStatus(weeklyChange: number): {
  status: 'surge' | 'accelerating' | 'stable' | 'declining' | 'dropping';
  color: string;
} {
  if (weeklyChange > 20) return { status: 'surge', color: 'red' };
  if (weeklyChange > 10) return { status: 'accelerating', color: 'orange' };
  if (weeklyChange > -5) return { status: 'stable', color: 'gray' };
  if (weeklyChange > -15) return { status: 'declining', color: 'yellow' };
  return { status: 'dropping', color: 'red' };
}

/**
 * Calculate threat level for a competitor
 */
function calculateThreatLevel(
  competitor: MarketOverview['competitors'][0],
  avgGrowth: number,
  stdDev: number
): 'high' | 'medium' | 'low' {
  const highThreshold = avgGrowth + (2 * stdDev);
  const mediumThreshold = avgGrowth + (1 * stdDev);
  
  if (competitor.weeklyChange > highThreshold) return 'high';
  if (competitor.weeklyChange > mediumThreshold) return 'medium';
  return 'low';
}

// ===========================================
// ROUTES
// ===========================================

/**
 * GET /api/competitors
 * Returns list of all tracked competitors with metrics
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    
    // Check cache
    if (!cachedMarketData || (now - lastFetchTime) >= CACHE_DURATION_MS) {
      console.log('Fetching competitor data from DataForSEO...');
      cachedMarketData = await dataForSEOService.fetchMarketOverview();
      lastFetchTime = now;
    }
    
    if (!cachedMarketData) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch competitor data'
      });
    }
    
    const data = cachedMarketData;
    
    // Calculate market stats for threat assessment
    const growthRates = data.competitors.map(c => c.weeklyChange);
    const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
    const variance = growthRates.reduce((sum, rate) => sum + Math.pow(rate - avgGrowth, 2), 0) / growthRates.length;
    const stdDev = Math.sqrt(variance);
    
    // Build competitor list with calculated metrics
    const competitors = data.competitors
      .filter(c => c.name !== 'JACKS') // Exclude your own brand from competitor list
      .map((competitor, index) => {
        const velocityStatus = getVelocityStatus(competitor.weeklyChange);
        const threatLevel = calculateThreatLevel(competitor, avgGrowth, stdDev);
        const marketShare = data.totalMarketVolume > 0
          ? (competitor.totalVolume / data.totalMarketVolume) * 100
          : 0;
        
        return {
          id: index + 1,
          name: competitor.name,
          keywords: competitor.keywords,
          metrics: {
            searchVolume: competitor.totalVolume,
            marketShare: Math.round(marketShare * 10) / 10,
            weeklyChange: competitor.weeklyChange,
            averageValue: competitor.averageValue
          },
          velocity: {
            status: velocityStatus.status,
            color: velocityStatus.color,
            value: competitor.weeklyChange
          },
          threat: {
            level: threatLevel,
            isAnomalous: competitor.weeklyChange > (avgGrowth + 2 * stdDev)
          },
          trend: {
            direction: competitor.weeklyChange > 5 ? 'up' : competitor.weeklyChange < -5 ? 'down' : 'stable',
            data: competitor.trendData.slice(-8) // Last 8 weeks
          }
        };
      });
    
    // Sort by search volume (market size) descending
    competitors.sort((a, b) => b.metrics.searchVolume - a.metrics.searchVolume);
    
    // Add rank
    competitors.forEach((comp, index) => {
      (comp as any).rank = index + 1;
    });
    
    res.json({
      success: true,
      data: {
        competitors,
        summary: {
          total: competitors.length,
          highThreat: competitors.filter(c => c.threat.level === 'high').length,
          mediumThreat: competitors.filter(c => c.threat.level === 'medium').length,
          avgMarketGrowth: Math.round(avgGrowth * 10) / 10,
          marketVolatility: Math.round(stdDev * 10) / 10
        }
      },
      meta: {
        lastUpdated: data.lastUpdated,
        dataSource: dataForSEOService.isReady() ? 'DataForSEO' : 'Mock Data'
      }
    });
  } catch (error: any) {
    console.error('Error in /api/competitors:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/competitors/:name
 * Returns detailed data for a specific competitor
 */
router.get('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const now = Date.now();
    
    // Check cache
    if (!cachedMarketData || (now - lastFetchTime) >= CACHE_DURATION_MS) {
      cachedMarketData = await dataForSEOService.fetchMarketOverview();
      lastFetchTime = now;
    }
    
    if (!cachedMarketData) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch competitor data'
      });
    }
    
    // Find the competitor (case-insensitive)
    const competitor = cachedMarketData.competitors.find(
      c => c.name.toLowerCase() === name.toLowerCase()
    );
    
    if (!competitor) {
      return res.status(404).json({
        success: false,
        error: `Competitor "${name}" not found`
      });
    }
    
    // Calculate detailed metrics
    const data = cachedMarketData;
    const marketShare = data.totalMarketVolume > 0
      ? (competitor.totalVolume / data.totalMarketVolume) * 100
      : 0;
    
    const growthRates = data.competitors.map(c => c.weeklyChange);
    const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
    
    // Find your brand for comparison
    const yourBrand = data.competitors.find(c => c.name === 'JACKS');
    
    res.json({
      success: true,
      data: {
        name: competitor.name,
        keywords: competitor.keywords,
        metrics: {
          searchVolume: competitor.totalVolume,
          marketShare: Math.round(marketShare * 10) / 10,
          weeklyChange: competitor.weeklyChange,
          averageValue: competitor.averageValue,
          vsMarketAvg: Math.round((competitor.weeklyChange - avgGrowth) * 10) / 10,
          vsYourBrand: yourBrand 
            ? Math.round((competitor.weeklyChange - yourBrand.weeklyChange) * 10) / 10 
            : 0
        },
        trendHistory: competitor.trendData,
        analysis: {
          trajectory: competitor.weeklyChange > 10 ? 'accelerating' : 
                     competitor.weeklyChange > 0 ? 'growing' :
                     competitor.weeklyChange > -10 ? 'stable' : 'declining',
          riskAssessment: competitor.weeklyChange > (avgGrowth + 10) ? 'high' :
                         competitor.weeklyChange > avgGrowth ? 'medium' : 'low',
          recommendation: competitor.weeklyChange > (avgGrowth + 15)
            ? `${competitor.name} is growing aggressively. Monitor closely and consider competitive response.`
            : competitor.weeklyChange > avgGrowth
            ? `${competitor.name} is performing above market average. Keep watching.`
            : `${competitor.name} is tracking with or below market. No immediate threat.`
        }
      },
      meta: {
        lastUpdated: data.lastUpdated,
        dataSource: dataForSEOService.isReady() ? 'DataForSEO' : 'Mock Data'
      }
    });
  } catch (error: any) {
    console.error('Error in /api/competitors/:name:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

export default router;
