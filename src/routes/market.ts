/**
 * Market Data Routes
 * 
 * API endpoints for fetching market intelligence data
 */

import { Router, Request, Response } from 'express';
import { dataForSEOService } from '../services/dataForSeo';
import { 
  calculateMarketShareMomentum,
  calculateCompetitivePressureIndex,
  calculateEmergingCompetitorAlerts,
  calculateIntentShiftIndex,
  calculatePlayerSentimentVelocity,
  calculateAllMetrics
} from '../services/metricsCalculator';
import { brands, intentKeywords, getAllIntentKeywords, getOwnBrand } from '../config/brandKeywords';

const router = Router();

// =============================================================================
// GET /api/market/status - Check DataForSEO connection
// =============================================================================

router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await dataForSEOService.checkStatus();
    res.json({
      success: true,
      dataForSeo: status,
      config: {
        brands: brands.length,
        ownBrand: getOwnBrand()?.displayName,
        intentCategories: intentKeywords.length,
        totalKeywords: brands.reduce((sum, b) => sum + b.keywords.length, 0) + 
                       intentKeywords.reduce((sum, i) => sum + i.keywords.length, 0)
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// GET /api/market/brands - Get all brand search volumes
// =============================================================================

router.get('/brands', async (req: Request, res: Response) => {
  try {
    console.log('📊 Fetching brand search volumes...');
    const brandVolumes = await dataForSEOService.getBrandSearchVolumes();
    
    // Sort by volume (highest first)
    brandVolumes.sort((a, b) => b.totalVolume - a.totalVolume);

    // Calculate market totals
    const totalMarketVolume = brandVolumes.reduce((sum, b) => sum + b.totalVolume, 0);
    
    // Add market share percentage to each brand
    const brandsWithShare = brandVolumes.map(brand => ({
      ...brand,
      marketShare: totalMarketVolume > 0 
        ? Math.round((brand.totalVolume / totalMarketVolume) * 1000) / 10 
        : 0
    }));

    res.json({
      success: true,
      data: {
        brands: brandsWithShare,
        totalMarketVolume,
        fetchedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching brands:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// GET /api/market/trends - Get Google Trends comparison
// =============================================================================

router.get('/trends', async (req: Request, res: Response) => {
  try {
    const brandIds = req.query.brands 
      ? (req.query.brands as string).split(',') 
      : undefined;

    console.log('📈 Fetching brand trends...');
    const trends = await dataForSEOService.getBrandTrends(brandIds);

    if (!trends) {
      return res.status(404).json({
        success: false,
        error: 'No trend data available'
      });
    }

    res.json({
      success: true,
      data: trends
    });
  } catch (error: any) {
    console.error('❌ Error fetching trends:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// GET /api/market/serp/:keyword - Get SERP rankings for a keyword
// =============================================================================

router.get('/serp/:keyword', async (req: Request, res: Response) => {
  try {
    const { keyword } = req.params;
    const depth = parseInt(req.query.depth as string) || 10;

    console.log(`🔍 Fetching SERP for "${keyword}"...`);
    const serpResult = await dataForSEOService.getSerpResults(keyword, depth);

    if (!serpResult) {
      return res.status(404).json({
        success: false,
        error: 'No SERP data available'
      });
    }

    // Find where tracked brands appear
    const brandRankings = await dataForSEOService.getBrandRankingsForKeyword(keyword);

    res.json({
      success: true,
      data: {
        keyword,
        totalResults: serpResult.totalResults,
        items: serpResult.items,
        brandRankings: brandRankings.filter(b => b.position !== null)
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching SERP:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// GET /api/market/intent - Get intent keyword analysis
// =============================================================================

router.get('/intent', async (req: Request, res: Response) => {
  try {
    console.log('🎯 Fetching intent keyword volumes...');
    
    // Get all intent keywords
    const allIntentKeywords = getAllIntentKeywords();
    const volumes = await dataForSEOService.getSearchVolume(allIntentKeywords);

    // Group by category
    const byCategory = intentKeywords.map(category => {
      const categoryVolumes = category.keywords.map(kw => {
        const found = volumes.find(v => v.keyword.toLowerCase() === kw.toLowerCase());
        return {
          keyword: kw,
          volume: found?.searchVolume || 0,
          cpc: found?.cpc || null
        };
      });

      const totalVolume = categoryVolumes.reduce((sum, v) => sum + v.volume, 0);

      return {
        category: category.category,
        displayName: category.displayName,
        totalVolume,
        keywords: categoryVolumes.sort((a, b) => b.volume - a.volume)
      };
    });

    res.json({
      success: true,
      data: {
        categories: byCategory,
        totalIntentVolume: byCategory.reduce((sum, c) => sum + c.totalVolume, 0),
        fetchedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching intent data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// GET /api/market/metrics - Get calculated metrics (all 5 formulas)
// =============================================================================

router.get('/metrics', async (req: Request, res: Response) => {
  try {
    console.log('📊 Calculating market metrics...');

    // Fetch current brand volumes
    const currentBrandData = await dataForSEOService.getBrandSearchVolumes();

    // For now, use simulated previous data (in production, this comes from database)
    // Apply a random -5% to +10% change to simulate previous period
    const previousBrandData = currentBrandData.map(brand => ({
      ...brand,
      totalVolume: Math.round(brand.totalVolume * (0.95 + Math.random() * 0.15)),
      fetchedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1 week ago
    }));

    // Fetch intent keyword volumes
    const allIntentKeywords = getAllIntentKeywords();
    const intentVolumes = await dataForSEOService.getSearchVolume(allIntentKeywords);
    
    // Convert to Map
    const currentIntentVolumes = new Map<string, number>();
    intentVolumes.forEach(v => {
      currentIntentVolumes.set(v.keyword.toLowerCase(), v.searchVolume || 0);
    });

    // Simulated previous intent volumes
    const previousIntentVolumes = new Map<string, number>();
    intentVolumes.forEach(v => {
      const previousVolume = Math.round((v.searchVolume || 0) * (0.9 + Math.random() * 0.2));
      previousIntentVolumes.set(v.keyword.toLowerCase(), previousVolume);
    });

    // Calculate all metrics
    const metrics = calculateAllMetrics(
      currentBrandData,
      previousBrandData,
      [previousBrandData], // Historical data (would have multiple periods in production)
      currentIntentVolumes,
      previousIntentVolumes
    );

    res.json({
      success: true,
      data: metrics
    });
  } catch (error: any) {
    console.error('❌ Error calculating metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =============================================================================
// GET /api/market/dashboard - Get all dashboard data in one call
// =============================================================================

router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    console.log('🚀 Fetching complete dashboard data...');

    // Fetch brand volumes
    const brandVolumes = await dataForSEOService.getBrandSearchVolumes();
    brandVolumes.sort((a, b) => b.totalVolume - a.totalVolume);

    const totalMarketVolume = brandVolumes.reduce((sum, b) => sum + b.totalVolume, 0);
    const ownBrand = getOwnBrand();
    const ownBrandData = brandVolumes.find(b => b.brandId === ownBrand?.id);

    // Fetch trends for top 5 brands
    const trends = await dataForSEOService.getBrandTrends();

    // Fetch intent volumes
    const allIntentKeywords = getAllIntentKeywords();
    const intentVolumes = await dataForSEOService.getSearchVolume(allIntentKeywords);
    
    const currentIntentVolumes = new Map<string, number>();
    intentVolumes.forEach(v => {
      currentIntentVolumes.set(v.keyword.toLowerCase(), v.searchVolume || 0);
    });

    // Simulated previous data for metrics calculation
    const previousBrandData = brandVolumes.map(brand => ({
      ...brand,
      totalVolume: Math.round(brand.totalVolume * (0.95 + Math.random() * 0.15))
    }));

    const previousIntentVolumes = new Map<string, number>();
    intentVolumes.forEach(v => {
      previousIntentVolumes.set(v.keyword.toLowerCase(), 
        Math.round((v.searchVolume || 0) * (0.9 + Math.random() * 0.2)));
    });

    // Calculate metrics
    const metrics = calculateAllMetrics(
      brandVolumes,
      previousBrandData,
      [previousBrandData],
      currentIntentVolumes,
      previousIntentVolumes
    );

    // Build dashboard response
    res.json({
      success: true,
      data: {
        // Overview metrics
        overview: {
          totalMarketVolume,
          yourBrand: {
            name: ownBrand?.displayName,
            volume: ownBrandData?.totalVolume || 0,
            marketShare: totalMarketVolume > 0 
              ? Math.round((ownBrandData?.totalVolume || 0) / totalMarketVolume * 1000) / 10
              : 0
          },
          marketShareMomentum: metrics.marketShareMomentum,
          competitivePressure: metrics.competitivePressureIndex,
          playerSentiment: metrics.playerSentimentVelocity
        },
        
        // Brand rankings
        brands: brandVolumes.map((brand, index) => ({
          rank: index + 1,
          brandId: brand.brandId,
          brandName: brand.brandName,
          volume: brand.totalVolume,
          marketShare: totalMarketVolume > 0 
            ? Math.round(brand.totalVolume / totalMarketVolume * 1000) / 10
            : 0,
          isOwnBrand: brand.brandId === ownBrand?.id,
          color: brands.find(b => b.id === brand.brandId)?.color
        })),

        // Trends
        trends: trends,

        // Intent breakdown
        intentCategories: intentKeywords.map(category => {
          let totalVolume = 0;
          category.keywords.forEach(kw => {
            totalVolume += currentIntentVolumes.get(kw.toLowerCase()) || 0;
          });
          return {
            category: category.category,
            displayName: category.displayName,
            volume: totalVolume
          };
        }),

        // Alerts
        alerts: [
          ...metrics.emergingCompetitorAlerts
            .filter(a => a.severity !== 'none')
            .slice(0, 5)
            .map(a => ({
              type: 'competitor',
              severity: a.severity,
              message: a.message
            })),
          ...metrics.intentShiftIndex
            .filter(i => i.severity !== 'none')
            .map(i => ({
              type: 'intent',
              severity: i.severity,
              message: `${i.displayName}: ${i.changePercent > 0 ? '+' : ''}${i.changePercent}% - ${i.interpretation}`
            }))
        ],

        // Full metrics for detail views
        metrics,

        // Metadata
        fetchedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('❌ Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
