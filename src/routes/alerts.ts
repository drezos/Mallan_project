// Alerts API Routes
// Returns market intelligence alerts based on DataForSEO data

import { Router, Request, Response } from 'express';
import { dataForSEOService, MarketOverview } from '../services/dataForSeo';

const router = Router();

// Share cached data
let cachedMarketData: MarketOverview | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// ===========================================
// ALERT TYPES
// ===========================================

interface Alert {
  id: string;
  type: 'emerging_threat' | 'intent_shift' | 'market_opportunity' | 'competitive_pressure' | 'sentiment_warning';
  severity: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  metric?: {
    name: string;
    value: number;
    change: number;
  };
  timestamp: string;
  actionable: boolean;
  recommendation?: string;
}

// ===========================================
// ALERT GENERATION FUNCTIONS
// ===========================================

/**
 * Generate emerging competitor threat alerts
 */
function generateCompetitorAlerts(competitors: MarketOverview['competitors']): Alert[] {
  const alerts: Alert[] = [];
  
  // Calculate baseline statistics
  const growthRates = competitors.filter(c => c.name !== 'JACKS').map(c => c.weeklyChange);
  const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
  const variance = growthRates.reduce((sum, rate) => sum + Math.pow(rate - avgGrowth, 2), 0) / growthRates.length;
  const stdDev = Math.sqrt(variance);
  
  const highThreshold = avgGrowth + (2 * stdDev);
  const mediumThreshold = avgGrowth + (1 * stdDev);
  
  for (const competitor of competitors) {
    if (competitor.name === 'JACKS') continue;
    
    if (competitor.weeklyChange > highThreshold) {
      alerts.push({
        id: `threat-${competitor.name.toLowerCase()}-${Date.now()}`,
        type: 'emerging_threat',
        severity: 'high',
        title: `🚨 ${competitor.name} Surge Detected`,
        message: `${competitor.name} is growing ${competitor.weeklyChange.toFixed(1)}% WoW — ${(competitor.weeklyChange - avgGrowth).toFixed(1)}pp above market average. This is a statistically significant anomaly.`,
        metric: {
          name: 'Weekly Growth',
          value: competitor.weeklyChange,
          change: competitor.weeklyChange - avgGrowth
        },
        timestamp: new Date().toISOString(),
        actionable: true,
        recommendation: `Investigate ${competitor.name}'s recent marketing activity. Consider monitoring their ad spend and positioning changes. May indicate new funding or aggressive expansion.`
      });
    } else if (competitor.weeklyChange > mediumThreshold && competitor.weeklyChange > 10) {
      alerts.push({
        id: `threat-${competitor.name.toLowerCase()}-${Date.now()}`,
        type: 'emerging_threat',
        severity: 'medium',
        title: `⚠️ ${competitor.name} Accelerating`,
        message: `${competitor.name} is growing ${competitor.weeklyChange.toFixed(1)}% WoW — above the market average of ${avgGrowth.toFixed(1)}%.`,
        metric: {
          name: 'Weekly Growth',
          value: competitor.weeklyChange,
          change: competitor.weeklyChange - avgGrowth
        },
        timestamp: new Date().toISOString(),
        actionable: true,
        recommendation: `Keep ${competitor.name} on your watchlist. Review their recent campaigns and positioning.`
      });
    }
  }
  
  return alerts;
}

/**
 * Generate search intent shift alerts
 */
function generateIntentAlerts(intentCategories: MarketOverview['intentCategories']): Alert[] {
  const alerts: Alert[] = [];
  
  for (const intent of intentCategories) {
    // Problem searches spiking - market distress signal
    if (intent.category === 'problem' && intent.weeklyChange > 15) {
      alerts.push({
        id: `intent-problem-${Date.now()}`,
        type: 'intent_shift',
        severity: intent.weeklyChange > 30 ? 'high' : 'medium',
        title: intent.weeklyChange > 30 ? '🔴 Market Distress Signal' : '⚠️ Problem Searches Rising',
        message: `Problem-related searches (withdrawals, complaints) are up ${intent.weeklyChange.toFixed(1)}% WoW. This may indicate player dissatisfaction across the market.`,
        metric: {
          name: 'Problem Searches',
          value: intent.totalVolume,
          change: intent.weeklyChange
        },
        timestamp: new Date().toISOString(),
        actionable: true,
        recommendation: intent.weeklyChange > 30
          ? 'Urgent: Check your own withdrawal times and customer complaints. Consider proactive communication with players.'
          : 'Monitor your customer support queue for increased complaints. Review competitor reviews for common issues.'
      });
    }
    
    // Regulation searches spiking - regulatory activity
    if (intent.category === 'regulation' && intent.weeklyChange > 20) {
      alerts.push({
        id: `intent-regulation-${Date.now()}`,
        type: 'intent_shift',
        severity: intent.weeklyChange > 50 ? 'high' : 'medium',
        title: intent.weeklyChange > 50 ? '🔴 Regulatory Alert' : '⚠️ Regulation Interest Spike',
        message: `Searches for licensing and regulation are up ${intent.weeklyChange.toFixed(1)}% WoW. May indicate upcoming regulatory changes or enforcement.`,
        metric: {
          name: 'Regulation Searches',
          value: intent.totalVolume,
          change: intent.weeklyChange
        },
        timestamp: new Date().toISOString(),
        actionable: true,
        recommendation: 'Check KSA announcements and industry news. Review your compliance status and prepare for potential regulatory communications.'
      });
    }
    
    // Comparison searches dropping - market consolidation signal
    if (intent.category === 'comparison' && intent.weeklyChange < -15) {
      alerts.push({
        id: `intent-comparison-${Date.now()}`,
        type: 'market_opportunity',
        severity: 'low',
        title: '📊 Market Consolidation Signal',
        message: `Comparison searches are down ${Math.abs(intent.weeklyChange).toFixed(1)}% WoW. Players may be settling on preferred brands — loyalty matters more now.`,
        metric: {
          name: 'Comparison Searches',
          value: intent.totalVolume,
          change: intent.weeklyChange
        },
        timestamp: new Date().toISOString(),
        actionable: true,
        recommendation: 'Focus on retention over acquisition. Existing players are less likely to shop around — invest in loyalty programs.'
      });
    }
    
    // Product searches growing - opportunity
    if (intent.category === 'product' && intent.weeklyChange > 15) {
      alerts.push({
        id: `intent-product-${Date.now()}`,
        type: 'market_opportunity',
        severity: 'low',
        title: '🟢 Product Interest Growing',
        message: `Product-related searches (bonuses, slots, sports) are up ${intent.weeklyChange.toFixed(1)}% WoW. Market appetite is healthy.`,
        metric: {
          name: 'Product Searches',
          value: intent.totalVolume,
          change: intent.weeklyChange
        },
        timestamp: new Date().toISOString(),
        actionable: true,
        recommendation: 'Good time to promote your product offerings. Consider launching new features or promotions to capture this interest.'
      });
    }
  }
  
  return alerts;
}

/**
 * Generate competitive pressure alerts
 */
function generatePressureAlerts(competitors: MarketOverview['competitors']): Alert[] {
  const alerts: Alert[] = [];
  
  // Calculate market-wide competitive intensity
  const growthRates = competitors.filter(c => c.name !== 'JACKS').map(c => c.weeklyChange);
  const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
  const positiveGrowthCount = growthRates.filter(r => r > 5).length;
  
  // If most competitors are growing aggressively
  if (positiveGrowthCount >= growthRates.length * 0.7 && avgGrowth > 8) {
    alerts.push({
      id: `pressure-high-${Date.now()}`,
      type: 'competitive_pressure',
      severity: avgGrowth > 15 ? 'high' : 'medium',
      title: avgGrowth > 15 ? '🔴 High Competitive Pressure' : '⚠️ Competitive Pressure Rising',
      message: `${positiveGrowthCount} of ${growthRates.length} competitors are growing above 5% WoW. Average market growth is ${avgGrowth.toFixed(1)}%. CAC likely increasing.`,
      metric: {
        name: 'Market Avg Growth',
        value: avgGrowth,
        change: 0
      },
      timestamp: new Date().toISOString(),
      actionable: true,
      recommendation: avgGrowth > 15
        ? 'Consider shifting budget from acquisition to retention. CAC is likely elevated across the market. Focus on high-LTV segments.'
        : 'Monitor your CAC closely. Be selective with acquisition spend and focus on efficiency.'
    });
  }
  
  // If market is contracting
  const negativeGrowthCount = growthRates.filter(r => r < -5).length;
  if (negativeGrowthCount >= growthRates.length * 0.6) {
    alerts.push({
      id: `pressure-contraction-${Date.now()}`,
      type: 'market_opportunity',
      severity: 'medium',
      title: '📉 Market Contraction Detected',
      message: `${negativeGrowthCount} of ${growthRates.length} competitors are declining. Average market growth is ${avgGrowth.toFixed(1)}%. This may be an opportunity to gain share.`,
      metric: {
        name: 'Market Avg Growth',
        value: avgGrowth,
        change: 0
      },
      timestamp: new Date().toISOString(),
      actionable: true,
      recommendation: 'Competitors are pulling back. This could be a good time for controlled acquisition spend to gain market share while CAC is lower.'
    });
  }
  
  return alerts;
}

/**
 * Generate your brand performance alerts
 */
function generateBrandAlerts(competitors: MarketOverview['competitors'], brandShare: number): Alert[] {
  const alerts: Alert[] = [];
  
  const yourBrand = competitors.find(c => c.name === 'JACKS');
  if (!yourBrand) return alerts;
  
  const otherCompetitors = competitors.filter(c => c.name !== 'JACKS');
  const avgGrowth = otherCompetitors.reduce((sum, c) => sum + c.weeklyChange, 0) / otherCompetitors.length;
  
  // You're outperforming the market
  if (yourBrand.weeklyChange > avgGrowth + 5) {
    alerts.push({
      id: `brand-winning-${Date.now()}`,
      type: 'market_opportunity',
      severity: 'low',
      title: '✅ Outperforming Market',
      message: `Jacks.nl is growing ${yourBrand.weeklyChange.toFixed(1)}% WoW vs market average of ${avgGrowth.toFixed(1)}%. You're gaining share.`,
      metric: {
        name: 'Your Growth',
        value: yourBrand.weeklyChange,
        change: yourBrand.weeklyChange - avgGrowth
      },
      timestamp: new Date().toISOString(),
      actionable: true,
      recommendation: 'Your current strategy is working. Consider scaling successful campaigns while maintaining efficiency.'
    });
  }
  
  // You're underperforming the market
  if (yourBrand.weeklyChange < avgGrowth - 5) {
    alerts.push({
      id: `brand-lagging-${Date.now()}`,
      type: 'sentiment_warning',
      severity: yourBrand.weeklyChange < avgGrowth - 10 ? 'high' : 'medium',
      title: yourBrand.weeklyChange < avgGrowth - 10 ? '🔴 Losing Market Share' : '⚠️ Below Market Average',
      message: `Jacks.nl is growing ${yourBrand.weeklyChange.toFixed(1)}% WoW vs market average of ${avgGrowth.toFixed(1)}%. You're losing ground.`,
      metric: {
        name: 'Your Growth',
        value: yourBrand.weeklyChange,
        change: yourBrand.weeklyChange - avgGrowth
      },
      timestamp: new Date().toISOString(),
      actionable: true,
      recommendation: 'Review your marketing mix and messaging. Competitors may be outspending or out-positioning you. Consider A/B testing new campaigns.'
    });
  }
  
  return alerts;
}

// ===========================================
// ROUTES
// ===========================================

/**
 * GET /api/alerts
 * Returns all active alerts based on current market data
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    
    // Check cache
    if (!cachedMarketData || (now - lastFetchTime) >= CACHE_DURATION_MS) {
      console.log('Fetching market data for alerts...');
      cachedMarketData = await dataForSEOService.fetchMarketOverview();
      lastFetchTime = now;
    }
    
    if (!cachedMarketData) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch market data'
      });
    }
    
    // Generate all alerts
    const competitorAlerts = generateCompetitorAlerts(cachedMarketData.competitors);
    const intentAlerts = generateIntentAlerts(cachedMarketData.intentCategories);
    const pressureAlerts = generatePressureAlerts(cachedMarketData.competitors);
    const brandAlerts = generateBrandAlerts(cachedMarketData.competitors, cachedMarketData.brandShare);
    
    // Combine and sort by severity
    const allAlerts = [...competitorAlerts, ...intentAlerts, ...pressureAlerts, ...brandAlerts];
    
    const severityOrder = { high: 0, medium: 1, low: 2 };
    allAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    
    res.json({
      success: true,
      data: {
        alerts: allAlerts,
        summary: {
          total: allAlerts.length,
          high: allAlerts.filter(a => a.severity === 'high').length,
          medium: allAlerts.filter(a => a.severity === 'medium').length,
          low: allAlerts.filter(a => a.severity === 'low').length,
          byType: {
            emerging_threat: allAlerts.filter(a => a.type === 'emerging_threat').length,
            intent_shift: allAlerts.filter(a => a.type === 'intent_shift').length,
            market_opportunity: allAlerts.filter(a => a.type === 'market_opportunity').length,
            competitive_pressure: allAlerts.filter(a => a.type === 'competitive_pressure').length,
            sentiment_warning: allAlerts.filter(a => a.type === 'sentiment_warning').length
          }
        }
      },
      meta: {
        lastUpdated: cachedMarketData.lastUpdated,
        dataSource: dataForSEOService.isReady() ? 'DataForSEO' : 'Mock Data'
      }
    });
  } catch (error: any) {
    console.error('Error in /api/alerts:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

/**
 * GET /api/alerts/high-priority
 * Returns only high-severity alerts
 */
router.get('/high-priority', async (req: Request, res: Response) => {
  try {
    const now = Date.now();
    
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
    
    // Generate all alerts
    const allAlerts = [
      ...generateCompetitorAlerts(cachedMarketData.competitors),
      ...generateIntentAlerts(cachedMarketData.intentCategories),
      ...generatePressureAlerts(cachedMarketData.competitors),
      ...generateBrandAlerts(cachedMarketData.competitors, cachedMarketData.brandShare)
    ];
    
    // Filter to high priority only
    const highPriority = allAlerts.filter(a => a.severity === 'high');
    
    res.json({
      success: true,
      data: {
        alerts: highPriority,
        count: highPriority.length
      },
      meta: {
        lastUpdated: cachedMarketData.lastUpdated,
        dataSource: dataForSEOService.isReady() ? 'DataForSEO' : 'Mock Data'
      }
    });
  } catch (error: any) {
    console.error('Error in /api/alerts/high-priority:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});

export default router;
