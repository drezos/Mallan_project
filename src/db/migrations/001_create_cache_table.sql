-- Migration: Create cache table for DataForSEO data
-- Purpose: Store API responses with weekly expiry to minimize API costs

CREATE TABLE IF NOT EXISTS api_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,
  cache_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  last_refreshed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_cache_key ON api_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON api_cache(expires_at);

-- Cache keys we'll use:
-- 'market_dashboard' - Full dashboard data (weekly refresh)
-- 'brand_trends' - Brand comparison trends (weekly refresh)
-- 'intent_keywords' - Intent category data (weekly refresh)
-- 'search_volumes' - Absolute search volumes (monthly refresh)
