import { cacheService, CACHE_DURATIONS, CACHE_KEYS } from '../db/cache';
import { dataForSEOService } from './dataForSeo';
import {
  calculateAllMetrics
} from './metricsCalculator';
import { brands, intentKeywords, getAllIntentKeywords, getOwnBrand } from '../config/brandKeywords';

/**
 * Cached Market Data Service
 *
 * Wraps DataForSEO calls with database-backed caching.
 * Only fetches fresh data when cache expires (weekly by default).
 *
 * This prevents burning API credits on every page refresh.
 */
export const cachedDataService = {
  /**
   * Build fresh dashboard data from DataForSEO
   */
  async buildDashboardData(): Promise<any> {
    console.log('🚀 Building complete dashboard data...');

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
    return {
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
      brands: brandVolumes.map((brand, index) => {
        const previousBrand = previousBrandData.find(p => p.brandId === brand.brandId);
        const previousVolume = previousBrand?.totalVolume || brand.totalVolume;
        const velocity = previousVolume > 0
          ? Math.round(((brand.totalVolume - previousVolume) / previousVolume) * 1000) / 10
          : 0;

        return {
          rank: index + 1,
          brandId: brand.brandId,
          brandName: brand.brandName,
          volume: brand.totalVolume,
          marketShare: totalMarketVolume > 0
            ? Math.round(brand.totalVolume / totalMarketVolume * 1000) / 10
            : 0,
          velocity: velocity,
          isOwnBrand: brand.brandId === ownBrand?.id,
          color: brands.find(b => b.id === brand.brandId)?.color
        };
      }),

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
    };
  },

  /**
   * Get full dashboard data
   * Refreshes weekly (every 7 days)
   */
  async getDashboardData(forceRefresh = false): Promise<any> {
    const cacheKey = CACHE_KEYS.MARKET_DASHBOARD;

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = await cacheService.get(cacheKey);

      if (cached && !cached.is_expired) {
        console.log(`📦 Serving cached dashboard data (expires: ${cached.expires_at.toISOString()})`);
        const data = cached.data as Record<string, unknown>;
        return {
          ...data,
          _meta: {
            source: 'cache',
            cached_at: cached.cached_at,
            expires_at: cached.expires_at
          }
        };
      }

      // If cached but expired, log it
      if (cached?.is_expired) {
        console.log('📦 Cache expired, fetching fresh data...');
      }
    } else {
      console.log('🔄 Force refresh requested');
    }

    // Fetch fresh data from DataForSEO
    try {
      console.log('🌐 Fetching fresh data from DataForSEO...');
      const freshData = await this.buildDashboardData();

      if (freshData) {
        // Cache for 1 week
        await cacheService.set(cacheKey, freshData, CACHE_DURATIONS.WEEKLY);

        return {
          ...freshData,
          _meta: {
            source: 'fresh',
            cached_at: new Date(),
            expires_at: new Date(Date.now() + CACHE_DURATIONS.WEEKLY)
          }
        };
      }

      // If fetch failed, try to return stale cache
      const staleCache = await cacheService.get(cacheKey);
      if (staleCache) {
        console.log('⚠️ Using stale cache as fallback');
        const staleData = staleCache.data as Record<string, unknown>;
        return {
          ...staleData,
          _meta: {
            source: 'stale_cache',
            cached_at: staleCache.cached_at,
            expires_at: staleCache.expires_at,
            warning: 'Using stale data due to API error'
          }
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);

      // Return stale cache on error
      const staleCache = await cacheService.get(cacheKey);
      if (staleCache) {
        console.log('⚠️ Using stale cache due to error');
        const staleData = staleCache.data as Record<string, unknown>;
        return {
          ...staleData,
          _meta: {
            source: 'stale_cache',
            cached_at: staleCache.cached_at,
            error: 'API error occurred'
          }
        };
      }

      throw error;
    }
  },

  /**
   * Get brand trends data
   * Refreshes weekly
   */
  async getBrandTrends(forceRefresh = false): Promise<any> {
    const cacheKey = CACHE_KEYS.BRAND_TRENDS;

    if (!forceRefresh) {
      const cached = await cacheService.get(cacheKey);
      if (cached && !cached.is_expired) {
        console.log(`📦 Serving cached brand trends`);
        return cached.data;
      }
    }

    try {
      // Call your DataForSEO brand trends method
      const freshData = await dataForSEOService.getBrandTrends?.();
      
      if (freshData) {
        await cacheService.set(cacheKey, freshData, CACHE_DURATIONS.WEEKLY);
        return freshData;
      }

      const staleCache = await cacheService.get(cacheKey);
      return staleCache?.data || null;
    } catch (error) {
      console.error('❌ Error fetching brand trends:', error);
      const staleCache = await cacheService.get(cacheKey);
      return staleCache?.data || null;
    }
  },

  /**
   * Get intent keywords data
   * Refreshes weekly
   */
  async getIntentKeywords(forceRefresh = false): Promise<any> {
    const cacheKey = CACHE_KEYS.INTENT_KEYWORDS;

    if (!forceRefresh) {
      const cached = await cacheService.get(cacheKey);
      if (cached && !cached.is_expired) {
        console.log(`📦 Serving cached intent keywords`);
        return cached.data;
      }
    }

    try {
      // Fetch intent keyword volumes using getSearchVolume
      const allIntentKeywords = getAllIntentKeywords();
      const freshData = await dataForSEOService.getSearchVolume(allIntentKeywords);

      if (freshData && freshData.length > 0) {
        await cacheService.set(cacheKey, freshData, CACHE_DURATIONS.WEEKLY);
        return freshData;
      }

      const staleCache = await cacheService.get(cacheKey);
      return staleCache?.data || null;
    } catch (error) {
      console.error('❌ Error fetching intent keywords:', error);
      const staleCache = await cacheService.get(cacheKey);
      return staleCache?.data || null;
    }
  },

  /**
   * Force refresh all cached data
   * Use sparingly - this makes API calls!
   */
  async refreshAll(): Promise<{ success: boolean; refreshed: string[] }> {
    console.log('🔄 Refreshing all cached data...');
    const refreshed: string[] = [];

    try {
      // Invalidate all caches first
      await cacheService.invalidateAll();

      // Refresh dashboard (this fetches most data)
      await this.getDashboardData(true);
      refreshed.push('dashboard');

      console.log(`✅ Refreshed ${refreshed.length} cache entries`);
      return { success: true, refreshed };
    } catch (error) {
      console.error('❌ Error refreshing all data:', error);
      return { success: false, refreshed };
    }
  },

  /**
   * Get cache status for monitoring
   */
  async getCacheStatus(): Promise<{
    entries: Array<{
      key: string;
      is_expired: boolean;
      age_hours: number;
      expires_at: Date;
    }>;
    next_refresh: { hours: number; minutes: number } | null;
  }> {
    const entries = await cacheService.getStatus();
    const nextRefresh = await cacheService.getTimeUntilRefresh(CACHE_KEYS.MARKET_DASHBOARD);

    return {
      entries,
      next_refresh: nextRefresh
    };
  }
};
