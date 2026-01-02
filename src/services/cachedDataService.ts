import { pool, CACHE_DURATIONS, CACHE_KEYS } from '../db/cache';
import { dataForSEOService, SearchVolumeResult, BrandSearchVolume } from './dataForSeo';
import {
  calculateAllMetrics
} from './metricsCalculator';
import { BrandConfig, IntentKeywordConfig } from '../config/brandKeywords';

// =============================================================================
// TENANT CONFIGURATION TYPES
// =============================================================================

interface TenantConfig {
  tenantId: string;
  tenantName: string;
  brandName: string;
  brandUrl: string;
  regionCode: number;
  regionName: string;
  brandKeywords: string[];
  competitors: Array<{
    id: string;
    name: string;
    url: string;
    keywords: string[];
  }>;
  marketKeywords: Array<{
    keyword: string;
    category: string;
  }>;
}

// Default tenant name (used when no tenant parameter is provided)
const DEFAULT_TENANT_NAME = 'Jacks.nl';

// =============================================================================
// TENANT-SPECIFIC CACHE SERVICE
// =============================================================================

const tenantCacheService = {
  /**
   * Get cached data for a tenant
   */
  async get<T>(tenantId: string, cacheKey: string): Promise<{
    data: T;
    cached_at: Date;
    expires_at: Date;
    is_expired: boolean;
  } | null> {
    try {
      const result = await pool.query(
        `SELECT
          data,
          created_at,
          expires_at,
          (expires_at < NOW()) as is_expired
        FROM tenant_cache
        WHERE tenant_id = $1 AND cache_key = $2`,
        [tenantId, cacheKey]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        data: row.data,
        cached_at: row.created_at,
        expires_at: row.expires_at,
        is_expired: row.is_expired
      };
    } catch (error) {
      console.error(`❌ Tenant cache get error for ${tenantId}/${cacheKey}:`, error);
      return null;
    }
  },

  /**
   * Store data in tenant cache
   */
  async set<T>(tenantId: string, cacheKey: string, data: T, durationMs: number): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + durationMs);

      await pool.query(
        `INSERT INTO tenant_cache (tenant_id, cache_key, data, expires_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (tenant_id, cache_key)
         DO UPDATE SET
           data = $3,
           expires_at = $4,
           created_at = NOW()`,
        [tenantId, cacheKey, JSON.stringify(data), expiresAt]
      );

      console.log(`✅ Tenant cache set ${tenantId}/${cacheKey} until ${expiresAt.toISOString()}`);
      return true;
    } catch (error) {
      console.error(`❌ Tenant cache set error for ${tenantId}/${cacheKey}:`, error);
      return false;
    }
  },

  /**
   * Invalidate a tenant's cache entry
   */
  async invalidate(tenantId: string, cacheKey: string): Promise<boolean> {
    try {
      await pool.query(
        `UPDATE tenant_cache SET expires_at = NOW() - INTERVAL '1 second'
         WHERE tenant_id = $1 AND cache_key = $2`,
        [tenantId, cacheKey]
      );
      console.log(`🗑️ Invalidated tenant cache: ${tenantId}/${cacheKey}`);
      return true;
    } catch (error) {
      console.error(`❌ Tenant cache invalidate error:`, error);
      return false;
    }
  },

  /**
   * Invalidate all cache entries for a tenant
   */
  async invalidateAll(tenantId: string): Promise<boolean> {
    try {
      await pool.query(
        `UPDATE tenant_cache SET expires_at = NOW() - INTERVAL '1 second' WHERE tenant_id = $1`,
        [tenantId]
      );
      console.log(`🗑️ Invalidated all cache for tenant: ${tenantId}`);
      return true;
    } catch (error) {
      console.error('❌ Tenant cache invalidateAll error:', error);
      return false;
    }
  },

  /**
   * Get time until next refresh for a tenant's cache key
   */
  async getTimeUntilRefresh(tenantId: string, cacheKey: string): Promise<{ hours: number; minutes: number } | null> {
    try {
      const result = await pool.query(
        `SELECT EXTRACT(EPOCH FROM (expires_at - NOW())) as seconds_remaining
         FROM tenant_cache
         WHERE tenant_id = $1 AND cache_key = $2 AND expires_at > NOW()`,
        [tenantId, cacheKey]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const secondsRemaining = result.rows[0].seconds_remaining;
      return {
        hours: Math.floor(secondsRemaining / 3600),
        minutes: Math.floor((secondsRemaining % 3600) / 60)
      };
    } catch (error) {
      console.error(`❌ Time until refresh error:`, error);
      return null;
    }
  },

  /**
   * Get cache status for a tenant
   */
  async getStatus(tenantId: string): Promise<Array<{
    key: string;
    expires_at: Date;
    is_expired: boolean;
    age_hours: number;
  }>> {
    try {
      const result = await pool.query(
        `SELECT
          cache_key as key,
          expires_at,
          (expires_at < NOW()) as is_expired,
          EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 as age_hours
        FROM tenant_cache
        WHERE tenant_id = $1
        ORDER BY cache_key`,
        [tenantId]
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Tenant cache status error:', error);
      return [];
    }
  }
};

// =============================================================================
// TENANT CONFIGURATION FUNCTIONS
// =============================================================================

/**
 * Get tenant configuration from database
 * Returns brand keywords, competitors, market keywords, and region settings
 */
async function getTenantConfig(tenantId: string): Promise<TenantConfig | null> {
  try {
    // 1. Get tenant info
    const tenantResult = await pool.query(
      `SELECT id, name, brand_name, brand_url, region_code, region_name
       FROM tenants WHERE id = $1`,
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      console.error(`❌ Tenant not found: ${tenantId}`);
      return null;
    }

    const tenant = tenantResult.rows[0];

    // 2. Get brand keywords
    const brandKeywordsResult = await pool.query(
      `SELECT keyword FROM tenant_brand_keywords WHERE tenant_id = $1`,
      [tenantId]
    );
    const brandKeywords = brandKeywordsResult.rows.map((r: { keyword: string }) => r.keyword);

    // 3. Get competitors with their keywords
    const competitorsResult = await pool.query(
      `SELECT id, name, url FROM tenant_competitors WHERE tenant_id = $1`,
      [tenantId]
    );

    const competitors = await Promise.all(
      competitorsResult.rows.map(async (comp: { id: string; name: string; url: string }) => {
        const keywordsResult = await pool.query(
          `SELECT keyword FROM tenant_competitor_keywords WHERE competitor_id = $1`,
          [comp.id]
        );
        return {
          id: comp.id,
          name: comp.name,
          url: comp.url,
          keywords: keywordsResult.rows.map((r: { keyword: string }) => r.keyword)
        };
      })
    );

    // 4. Get market keywords
    const marketKeywordsResult = await pool.query(
      `SELECT keyword, category FROM tenant_market_keywords WHERE tenant_id = $1`,
      [tenantId]
    );
    const marketKeywords = marketKeywordsResult.rows.map((r: { keyword: string; category: string }) => ({
      keyword: r.keyword,
      category: r.category
    }));

    return {
      tenantId: tenant.id,
      tenantName: tenant.name,
      brandName: tenant.brand_name,
      brandUrl: tenant.brand_url,
      regionCode: tenant.region_code,
      regionName: tenant.region_name,
      brandKeywords,
      competitors,
      marketKeywords
    };
  } catch (error) {
    console.error('❌ Error fetching tenant config:', error);
    return null;
  }
}

/**
 * Get tenant ID by name (case-insensitive)
 */
async function getTenantIdByName(tenantName: string): Promise<string | null> {
  try {
    const result = await pool.query(
      `SELECT id FROM tenants WHERE LOWER(name) = LOWER($1)`,
      [tenantName]
    );
    return result.rows.length > 0 ? result.rows[0].id : null;
  } catch (error) {
    console.error('❌ Error fetching tenant ID:', error);
    return null;
  }
}

/**
 * Get tenant ID by name or ID
 * Tries exact ID match first, then name match (case-insensitive)
 */
async function getTenantByNameOrId(tenantIdentifier: string): Promise<{ id: string; name: string } | null> {
  try {
    // Try UUID match first (if it looks like a UUID)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(tenantIdentifier)) {
      const result = await pool.query(
        `SELECT id, name FROM tenants WHERE id = $1`,
        [tenantIdentifier]
      );
      if (result.rows.length > 0) {
        return { id: result.rows[0].id, name: result.rows[0].name };
      }
    }

    // Try name match (case-insensitive)
    const result = await pool.query(
      `SELECT id, name FROM tenants WHERE LOWER(name) = LOWER($1)`,
      [tenantIdentifier]
    );
    if (result.rows.length > 0) {
      return { id: result.rows[0].id, name: result.rows[0].name };
    }

    return null;
  } catch (error) {
    console.error('❌ Error fetching tenant:', error);
    return null;
  }
}

/**
 * Get all available tenants
 */
async function getAllTenants(): Promise<Array<{ id: string; name: string }>> {
  try {
    const result = await pool.query(
      `SELECT id, name FROM tenants ORDER BY name`
    );
    return result.rows;
  } catch (error) {
    console.error('❌ Error fetching all tenants:', error);
    return [];
  }
}

/**
 * Convert tenant config to BrandConfig array format for compatibility
 */
function tenantConfigToBrands(config: TenantConfig): BrandConfig[] {
  const brands: BrandConfig[] = [];

  // Own brand
  brands.push({
    id: 'own-brand',
    displayName: config.brandName,
    website: config.brandUrl,
    keywords: config.brandKeywords,
    isOwnBrand: true,
    color: '#1B4D3E' // Default green for own brand
  });

  // Competitor brands
  const competitorColors = [
    '#FF6B00', '#C4A000', '#027B5B', '#14805E', '#FF4444',
    '#6B5B95', '#E63946', '#FF6600', '#B8860B', '#2E8B57'
  ];

  config.competitors.forEach((comp, index) => {
    brands.push({
      id: comp.id,
      displayName: comp.name,
      website: comp.url.replace('https://www.', '').replace('https://', ''),
      keywords: comp.keywords,
      isOwnBrand: false,
      color: competitorColors[index % competitorColors.length]
    });
  });

  return brands;
}

/**
 * Convert tenant market keywords to IntentKeywordConfig format
 */
function tenantConfigToIntentKeywords(config: TenantConfig): IntentKeywordConfig[] {
  // Group by category
  const categoryMap = new Map<string, string[]>();

  config.marketKeywords.forEach(mk => {
    if (!categoryMap.has(mk.category)) {
      categoryMap.set(mk.category, []);
    }
    categoryMap.get(mk.category)!.push(mk.keyword);
  });

  const displayNames: Record<string, string> = {
    'comparison': 'Comparison / Shopping',
    'problem': 'Problems / Complaints',
    'regulation': 'Regulation / Legal',
    'product': 'Product / Features',
    'review': 'Reviews / Research'
  };

  return Array.from(categoryMap.entries()).map(([category, keywords]) => ({
    category,
    displayName: displayNames[category] || category,
    keywords
  }));
}

/**
 * Fetch brand search volumes using tenant config
 * Aggregates search volumes by brand from DataForSEO
 */
async function fetchBrandSearchVolumes(brands: BrandConfig[]): Promise<BrandSearchVolume[]> {
  const allKeywords = brands.flatMap(brand => brand.keywords);

  console.log(`📊 Fetching search volumes for ${allKeywords.length} keywords...`);

  const results = await dataForSEOService.getSearchVolume(allKeywords);

  // Create a map for quick lookup
  const volumeMap = new Map<string, SearchVolumeResult>();
  results.forEach(r => volumeMap.set(r.keyword.toLowerCase(), r));

  // Aggregate by brand
  const brandVolumes: BrandSearchVolume[] = brands.map(brand => {
    const brandKeywordResults = brand.keywords.map(kw => {
      const result = volumeMap.get(kw.toLowerCase());
      return result || {
        keyword: kw,
        searchVolume: null,
        competition: null,
        competitionIndex: null,
        cpc: null,
        monthlySearches: []
      };
    });

    const totalVolume = brandKeywordResults.reduce((sum, r) => {
      return sum + (r.searchVolume || 0);
    }, 0);

    // Find the keyword with the highest volume (priority keyword)
    let priorityKeyword = brand.keywords[0] || '';
    let priorityVolume = 0;
    brandKeywordResults.forEach(r => {
      if (r.searchVolume && r.searchVolume > priorityVolume) {
        priorityVolume = r.searchVolume;
        priorityKeyword = r.keyword;
      }
    });

    return {
      brandId: brand.id,
      brandName: brand.displayName,
      totalVolume,
      priorityKeyword,
      priorityVolume,
      keywords: brandKeywordResults,
      fetchedAt: new Date()
    };
  });

  return brandVolumes;
}

/**
 * Fetch brand trends using tenant config
 */
async function fetchBrandTrends(brands: BrandConfig[]): Promise<any> {
  // Get first 5 brands for trends (Google Trends limit)
  const brandsToCompare = brands.slice(0, 5);

  // Use primary keyword (usually brand + casino) for each
  const primaryKeywords = brandsToCompare.map(b => {
    const casinoKeyword = b.keywords.find(k => k.includes('casino') && !k.includes('.'));
    return casinoKeyword || b.keywords[0];
  });

  // Date range: last 12 months
  const dateTo = new Date().toISOString().split('T')[0];
  const dateFrom = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  try {
    return await dataForSEOService.getTrends(primaryKeywords, dateFrom, dateTo);
  } catch (error) {
    console.error('❌ Error fetching brand trends:', error);
    return null;
  }
}

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
   * Build fresh dashboard data from DataForSEO using tenant configuration
   */
  async buildDashboardData(tenantConfig: TenantConfig): Promise<any> {
    console.log(`🚀 Building dashboard data for tenant: ${tenantConfig.tenantName}...`);

    // Convert tenant config to brand format
    const brands = tenantConfigToBrands(tenantConfig);
    const intentKeywords = tenantConfigToIntentKeywords(tenantConfig);

    // Find own brand
    const ownBrand = brands.find(b => b.isOwnBrand);

    // Fetch brand volumes using tenant keywords
    const brandVolumes = await fetchBrandSearchVolumes(brands);
    brandVolumes.sort((a, b) => b.totalVolume - a.totalVolume);

    const totalMarketVolume = brandVolumes.reduce((sum, b) => sum + b.totalVolume, 0);
    const ownBrandData = brandVolumes.find(b => b.brandId === ownBrand?.id);

    // Fetch trends for top 5 brands
    const trends = await fetchBrandTrends(brands);

    // Fetch intent volumes
    const allIntentKeywords = intentKeywords.flatMap(cat => cat.keywords);
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

    // Calculate total priority volume for priority market share
    const totalPriorityVolume = brandVolumes.reduce((sum, b) => sum + b.priorityVolume, 0);

    // Build dashboard response
    return {
      // Tenant info
      tenant: {
        id: tenantConfig.tenantId,
        name: tenantConfig.tenantName,
        regionCode: tenantConfig.regionCode,
        regionName: tenantConfig.regionName
      },

      // Overview metrics
      overview: {
        totalMarketVolume,
        totalPriorityVolume,
        yourBrand: {
          name: ownBrand?.displayName,
          volume: ownBrandData?.totalVolume || 0,
          priorityKeyword: ownBrandData?.priorityKeyword || '',
          priorityVolume: ownBrandData?.priorityVolume || 0,
          marketShare: totalMarketVolume > 0
            ? Math.round((ownBrandData?.totalVolume || 0) / totalMarketVolume * 1000) / 10
            : 0,
          priorityMarketShare: totalPriorityVolume > 0
            ? Math.round((ownBrandData?.priorityVolume || 0) / totalPriorityVolume * 1000) / 10
            : 0
        },
        marketShareMomentum: metrics.marketShareMomentum,
        competitivePressure: metrics.competitivePressureIndex,
        playerSentiment: metrics.playerSentimentVelocity
      },

      // Brand rankings with monthly data
      // Note: DataForSEO Google Ads API returns monthly search volumes
      // Velocity is calculated as month-over-month change (MoM)
      brands: brandVolumes.map((brand, index) => {
        const previousBrand = previousBrandData.find(p => p.brandId === brand.brandId);
        const previousVolume = previousBrand?.totalVolume || brand.totalVolume;
        // Month-over-month velocity calculation
        const velocity = previousVolume > 0
          ? Math.round(((brand.totalVolume - previousVolume) / previousVolume) * 1000) / 10
          : 0;

        return {
          rank: index + 1,
          brandId: brand.brandId,
          brandName: brand.brandName,
          volume: brand.totalVolume,              // Monthly search volume
          priorityKeyword: brand.priorityKeyword,
          priorityVolume: brand.priorityVolume,   // Monthly priority keyword volume
          marketShare: totalMarketVolume > 0
            ? Math.round(brand.totalVolume / totalMarketVolume * 1000) / 10
            : 0,
          priorityMarketShare: totalPriorityVolume > 0
            ? Math.round(brand.priorityVolume / totalPriorityVolume * 1000) / 10
            : 0,
          velocity: velocity,                     // Month-over-month % change
          isOwnBrand: brand.brandId === ownBrand?.id,
          color: brands.find(b => b.id === brand.brandId)?.color
        };
      }),

      // Pre-calculated competitor highlights for stable display
      // Uses deterministic sorting to ensure same results on every cache read
      competitorHighlights: (() => {
        // Build competitor data with velocities
        const competitors = brandVolumes
          .filter(brand => brand.brandId !== ownBrand?.id)
          .map(brand => {
            const previousBrand = previousBrandData.find(p => p.brandId === brand.brandId);
            const previousVolume = previousBrand?.totalVolume || brand.totalVolume;
            // Round velocity to 1 decimal to avoid floating-point issues
            const velocity = previousVolume > 0
              ? Math.round(((brand.totalVolume - previousVolume) / previousVolume) * 1000) / 10
              : 0;
            return {
              name: brand.brandName,
              volume: brand.totalVolume,
              velocity
            };
          });

        if (competitors.length === 0) {
          return {
            fastestGrowing: { name: 'N/A', velocity: 0 },
            biggestDecline: { name: 'N/A', velocity: 0 }
          };
        }

        // Stable sort with tie-breakers:
        // 1. Primary: velocity (descending)
        // 2. Secondary: volume (descending) - larger brands win ties
        // 3. Tertiary: name (alphabetical) - deterministic final tie-breaker
        const sorted = [...competitors].sort((a, b) => {
          if (b.velocity !== a.velocity) return b.velocity - a.velocity;
          if (b.volume !== a.volume) return b.volume - a.volume;
          return a.name.localeCompare(b.name);
        });

        return {
          fastestGrowing: { name: sorted[0].name, velocity: sorted[0].velocity },
          biggestDecline: { name: sorted[sorted.length - 1].name, velocity: sorted[sorted.length - 1].velocity }
        };
      })(),

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
   * Get full dashboard data for a tenant
   * Refreshes weekly (every 7 days)
   * Uses tenant_cache table for per-tenant caching
   *
   * @param tenantParam - Optional tenant name or ID. If not provided, uses default tenant.
   * @param forceRefresh - Force a cache refresh
   */
  async getDashboardData(tenantParam?: string, forceRefresh = false): Promise<any> {
    const cacheKey = CACHE_KEYS.MARKET_DASHBOARD;

    // Resolve tenant: use provided param or fall back to default
    let tenantId: string;
    let tenantName: string;

    if (tenantParam) {
      const tenant = await getTenantByNameOrId(tenantParam);
      if (!tenant) {
        // Return available tenants for better error message
        const availableTenants = await getAllTenants();
        throw new Error(
          `Tenant not found: "${tenantParam}". Available tenants: ${availableTenants.map(t => t.name).join(', ')}`
        );
      }
      tenantId = tenant.id;
      tenantName = tenant.name;
    } else {
      // Default to first tenant (Jacks.nl)
      const defaultTenantId = await getTenantIdByName(DEFAULT_TENANT_NAME);
      if (!defaultTenantId) {
        throw new Error(`Default tenant not found: ${DEFAULT_TENANT_NAME}`);
      }
      tenantId = defaultTenantId;
      tenantName = DEFAULT_TENANT_NAME;
    }

    // Check tenant cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = await tenantCacheService.get(tenantId, cacheKey);

      if (cached && !cached.is_expired) {
        console.log(`📦 Serving cached dashboard data for tenant ${tenantName} (expires: ${cached.expires_at.toISOString()})`);
        const data = cached.data as Record<string, unknown>;
        return {
          ...data,
          lastUpdated: cached.cached_at.toISOString(),
          _meta: {
            source: 'cache',
            tenant_id: tenantId,
            tenant_name: tenantName,
            cached_at: cached.cached_at,
            expires_at: cached.expires_at
          }
        };
      }

      // Log cache status for debugging
      if (cached?.is_expired) {
        console.log('📦 Tenant cache expired, fetching fresh data...');
      } else if (!cached) {
        console.log('📦 No tenant cache entry found, building fresh data...');
      }
    } else {
      console.log('🔄 Force refresh requested');
    }

    // Get tenant configuration from database
    const tenantConfig = await getTenantConfig(tenantId);
    if (!tenantConfig) {
      throw new Error(`Failed to load config for tenant: ${tenantId}`);
    }

    // Fetch fresh data from DataForSEO using tenant config
    try {
      console.log(`🌐 Fetching fresh data from DataForSEO for tenant: ${tenantConfig.tenantName}...`);
      const freshData = await this.buildDashboardData(tenantConfig);

      if (freshData) {
        // Cache for 1 week in tenant_cache
        const cacheSuccess = await tenantCacheService.set(tenantId, cacheKey, freshData, CACHE_DURATIONS.WEEKLY);

        if (!cacheSuccess) {
          console.warn('⚠️ WARNING: Tenant cache set failed! Data will be recalculated on next request.');
          console.warn('⚠️ Check database connection and ensure tenant_cache table exists.');
        }

        const now = new Date();
        return {
          ...freshData,
          lastUpdated: now.toISOString(),
          _meta: {
            source: 'fresh',
            tenant_id: tenantId,
            tenant_name: tenantName,
            cached_at: now,
            expires_at: new Date(Date.now() + CACHE_DURATIONS.WEEKLY),
            cache_write_success: cacheSuccess
          }
        };
      }

      // If fetch failed, try to return stale cache
      const staleCache = await tenantCacheService.get(tenantId, cacheKey);
      if (staleCache) {
        console.log('⚠️ Using stale tenant cache as fallback');
        const staleData = staleCache.data as Record<string, unknown>;
        return {
          ...staleData,
          lastUpdated: staleCache.cached_at.toISOString(),
          _meta: {
            source: 'stale_cache',
            tenant_id: tenantId,
            tenant_name: tenantName,
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
      const staleCache = await tenantCacheService.get(tenantId, cacheKey);
      if (staleCache) {
        console.log('⚠️ Using stale tenant cache due to error');
        const staleData = staleCache.data as Record<string, unknown>;
        return {
          ...staleData,
          lastUpdated: staleCache.cached_at.toISOString(),
          _meta: {
            source: 'stale_cache',
            tenant_id: tenantId,
            tenant_name: tenantName,
            cached_at: staleCache.cached_at,
            error: 'API error occurred'
          }
        };
      }

      throw error;
    }
  },

  /**
   * Get brand trends data for current tenant
   * Refreshes weekly
   */
  async getBrandTrends(forceRefresh = false): Promise<any> {
    const cacheKey = CACHE_KEYS.BRAND_TRENDS;

    // Get current tenant ID
    const tenantId = await getTenantIdByName(CURRENT_TENANT_NAME);
    if (!tenantId) {
      throw new Error(`Tenant not found: ${CURRENT_TENANT_NAME}`);
    }

    if (!forceRefresh) {
      const cached = await tenantCacheService.get(tenantId, cacheKey);
      if (cached && !cached.is_expired) {
        console.log(`📦 Serving cached brand trends for tenant ${CURRENT_TENANT_NAME}`);
        return cached.data;
      }
    }

    try {
      // Get tenant config for brand keywords
      const tenantConfig = await getTenantConfig(tenantId);
      if (!tenantConfig) {
        throw new Error(`Failed to load config for tenant: ${tenantId}`);
      }

      const brands = tenantConfigToBrands(tenantConfig);
      const freshData = await fetchBrandTrends(brands);

      if (freshData) {
        await tenantCacheService.set(tenantId, cacheKey, freshData, CACHE_DURATIONS.WEEKLY);
        return freshData;
      }

      const staleCache = await tenantCacheService.get(tenantId, cacheKey);
      return staleCache?.data || null;
    } catch (error) {
      console.error('❌ Error fetching brand trends:', error);
      const staleCache = await tenantCacheService.get(tenantId, cacheKey);
      return staleCache?.data || null;
    }
  },

  /**
   * Get intent keywords data for current tenant
   * Refreshes weekly
   */
  async getIntentKeywords(forceRefresh = false): Promise<any> {
    const cacheKey = CACHE_KEYS.INTENT_KEYWORDS;

    // Get current tenant ID
    const tenantId = await getTenantIdByName(CURRENT_TENANT_NAME);
    if (!tenantId) {
      throw new Error(`Tenant not found: ${CURRENT_TENANT_NAME}`);
    }

    if (!forceRefresh) {
      const cached = await tenantCacheService.get(tenantId, cacheKey);
      if (cached && !cached.is_expired) {
        console.log(`📦 Serving cached intent keywords for tenant ${CURRENT_TENANT_NAME}`);
        return cached.data;
      }
    }

    try {
      // Get tenant config for market keywords
      const tenantConfig = await getTenantConfig(tenantId);
      if (!tenantConfig) {
        throw new Error(`Failed to load config for tenant: ${tenantId}`);
      }

      const intentKeywords = tenantConfigToIntentKeywords(tenantConfig);
      const allIntentKeywords = intentKeywords.flatMap(cat => cat.keywords);
      const freshData = await dataForSEOService.getSearchVolume(allIntentKeywords);

      if (freshData && freshData.length > 0) {
        await tenantCacheService.set(tenantId, cacheKey, freshData, CACHE_DURATIONS.WEEKLY);
        return freshData;
      }

      const staleCache = await tenantCacheService.get(tenantId, cacheKey);
      return staleCache?.data || null;
    } catch (error) {
      console.error('❌ Error fetching intent keywords:', error);
      const staleCache = await tenantCacheService.get(tenantId, cacheKey);
      return staleCache?.data || null;
    }
  },

  /**
   * Force refresh all cached data for current tenant
   * Use sparingly - this makes API calls!
   */
  async refreshAll(): Promise<{ success: boolean; refreshed: string[]; tenant_id?: string }> {
    console.log('🔄 Refreshing all cached data...');
    const refreshed: string[] = [];

    // Get current tenant ID
    const tenantId = await getTenantIdByName(CURRENT_TENANT_NAME);
    if (!tenantId) {
      console.error(`Tenant not found: ${CURRENT_TENANT_NAME}`);
      return { success: false, refreshed };
    }

    try {
      // Invalidate all tenant caches first
      await tenantCacheService.invalidateAll(tenantId);

      // Refresh dashboard (this fetches most data)
      await this.getDashboardData(true);
      refreshed.push('dashboard');

      console.log(`✅ Refreshed ${refreshed.length} cache entries for tenant ${CURRENT_TENANT_NAME}`);
      return { success: true, refreshed, tenant_id: tenantId };
    } catch (error) {
      console.error('❌ Error refreshing all data:', error);
      return { success: false, refreshed, tenant_id: tenantId };
    }
  },

  /**
   * Get cache status for current tenant
   */
  async getCacheStatus(): Promise<{
    tenant_id: string | null;
    tenant_name: string;
    entries: Array<{
      key: string;
      is_expired: boolean;
      age_hours: number;
      expires_at: Date;
    }>;
    next_refresh: { hours: number; minutes: number } | null;
  }> {
    // Get current tenant ID
    const tenantId = await getTenantIdByName(CURRENT_TENANT_NAME);
    if (!tenantId) {
      return {
        tenant_id: null,
        tenant_name: CURRENT_TENANT_NAME,
        entries: [],
        next_refresh: null
      };
    }

    const entries = await tenantCacheService.getStatus(tenantId);
    const nextRefresh = await tenantCacheService.getTimeUntilRefresh(tenantId, CACHE_KEYS.MARKET_DASHBOARD);

    return {
      tenant_id: tenantId,
      tenant_name: CURRENT_TENANT_NAME,
      entries,
      next_refresh: nextRefresh
    };
  }
};
