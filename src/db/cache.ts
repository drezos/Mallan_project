import { Pool } from 'pg';

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Cache duration constants
export const CACHE_DURATIONS = {
  WEEKLY: 7 * 24 * 60 * 60 * 1000,   // 7 days in milliseconds
  MONTHLY: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  HOURLY: 60 * 60 * 1000,            // 1 hour (fallback for errors)
} as const;

// Cache key constants
export const CACHE_KEYS = {
  MARKET_DASHBOARD: 'market_dashboard',
  BRAND_TRENDS: 'brand_trends',
  INTENT_KEYWORDS: 'intent_keywords',
  SEARCH_VOLUMES: 'search_volumes',
} as const;

interface CacheEntry<T = any> {
  data: T;
  cached_at: Date;
  expires_at: Date;
  is_expired: boolean;
}

/**
 * Database Cache Service
 * Persists cache to PostgreSQL so it survives container restarts
 */
export const cacheService = {
  /**
   * Initialize the cache table if it doesn't exist
   */
  async init(): Promise<void> {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS api_cache (
          id SERIAL PRIMARY KEY,
          cache_key VARCHAR(255) UNIQUE NOT NULL,
          cache_data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          last_refreshed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);

      await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_cache_key ON api_cache(cache_key)
      `);

      // Verify the table was created successfully
      const verifyResult = await pool.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'api_cache'
        )`
      );

      if (verifyResult.rows[0]?.exists) {
        console.log('✅ Cache table initialized and verified');
      } else {
        console.error('⚠️ Cache table creation may have failed - table not found');
      }
    } catch (error) {
      console.error('❌ Failed to initialize cache table:', error);
      console.error('⚠️ Caching will NOT work - all requests will fetch fresh data');
    }
  },

  /**
   * Get cached data if not expired
   */
  async get<T>(key: string): Promise<CacheEntry<T> | null> {
    try {
      console.log(`   [cache.get] Querying database for key: ${key}`);
      const result = await pool.query(
        `SELECT
          cache_data,
          created_at,
          expires_at,
          (expires_at < NOW()) as is_expired,
          NOW() as current_time
        FROM api_cache
        WHERE cache_key = $1`,
        [key]
      );

      console.log(`   [cache.get] Query returned ${result.rows.length} rows`);

      if (result.rows.length === 0) {
        console.log(`   [cache.get] No cache entry in database for key: ${key}`);
        return null;
      }

      const row = result.rows[0];
      console.log(`   [cache.get] Database times: NOW()=${row.current_time}, expires_at=${row.expires_at}`);
      console.log(`   [cache.get] is_expired=${row.is_expired}`);

      return {
        data: row.cache_data,
        cached_at: row.created_at,
        expires_at: row.expires_at,
        is_expired: row.is_expired
      };
    } catch (error) {
      console.error(`❌ [cache.get] Database error for ${key}:`, error);
      return null;
    }
  },

  /**
   * Store data in cache with expiry
   */
  async set<T>(key: string, data: T, durationMs: number): Promise<boolean> {
    try {
      const expiresAt = new Date(Date.now() + durationMs);
      console.log(`   [cache.set] Saving to database: key=${key}, expires=${expiresAt.toISOString()}`);

      const dataStr = JSON.stringify(data);
      console.log(`   [cache.set] Data size: ${dataStr.length} characters`);

      await pool.query(
        `INSERT INTO api_cache (cache_key, cache_data, expires_at, last_refreshed_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (cache_key)
         DO UPDATE SET
           cache_data = $2,
           expires_at = $3,
           last_refreshed_at = NOW()`,
        [key, dataStr, expiresAt]
      );

      // Verify it was saved
      const verify = await pool.query(
        `SELECT cache_key, expires_at FROM api_cache WHERE cache_key = $1`,
        [key]
      );
      console.log(`   [cache.set] Verification: ${verify.rows.length > 0 ? 'SAVED SUCCESSFULLY' : 'SAVE FAILED'}`);

      console.log(`✅ Cached ${key} until ${expiresAt.toISOString()}`);
      return true;
    } catch (error) {
      console.error(`❌ [cache.set] Database error for ${key}:`, error);
      return false;
    }
  },

  /**
   * Force invalidate a cache entry
   */
  async invalidate(key: string): Promise<boolean> {
    try {
      await pool.query(
        `UPDATE api_cache SET expires_at = NOW() - INTERVAL '1 second' WHERE cache_key = $1`,
        [key]
      );
      console.log(`🗑️ Invalidated cache: ${key}`);
      return true;
    } catch (error) {
      console.error(`❌ Cache invalidate error for ${key}:`, error);
      return false;
    }
  },

  /**
   * Invalidate all cache entries
   */
  async invalidateAll(): Promise<boolean> {
    try {
      await pool.query(
        `UPDATE api_cache SET expires_at = NOW() - INTERVAL '1 second'`
      );
      console.log('🗑️ Invalidated all cache entries');
      return true;
    } catch (error) {
      console.error('❌ Cache invalidateAll error:', error);
      return false;
    }
  },

  /**
   * Get cache status for all entries
   */
  async getStatus(): Promise<Array<{
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
          EXTRACT(EPOCH FROM (NOW() - last_refreshed_at)) / 3600 as age_hours
        FROM api_cache
        ORDER BY cache_key`
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Cache status error:', error);
      return [];
    }
  },

  /**
   * Get time until next refresh for a key
   */
  async getTimeUntilRefresh(key: string): Promise<{ hours: number; minutes: number } | null> {
    try {
      const result = await pool.query(
        `SELECT EXTRACT(EPOCH FROM (expires_at - NOW())) as seconds_remaining
         FROM api_cache 
         WHERE cache_key = $1 AND expires_at > NOW()`,
        [key]
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
      console.error(`❌ Time until refresh error for ${key}:`, error);
      return null;
    }
  }
};

export { pool };
