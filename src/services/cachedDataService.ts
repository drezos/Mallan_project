import { cacheService, CACHE_DURATIONS, CACHE_KEYS } from '../db/cache';

// Import your existing DataForSEO service
// Adjust this import path to match your project structure
import { dataForSEOService } from './dataForSeo';

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
        return {
          ...cached.data,
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
      const freshData = await dataForSEOService.fetchMarketOverview();
      
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
        return {
          ...staleCache.data,
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
        return {
          ...staleCache.data,
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
      // This would call your DataForSEO intent analysis method
      const freshData = await dataForSEOService.getIntentAnalysis?.();
      
      if (freshData) {
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
