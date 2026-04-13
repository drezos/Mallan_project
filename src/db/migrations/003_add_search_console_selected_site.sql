-- Migration: Add selected Search Console site column to tenant_connections
-- Purpose: Persist which Search Console site a tenant has picked for their Google connection.
-- The user chooses a site from GET /api/connections/google/search-console-sites and
-- the selection is saved via POST /api/connections/google/search-console-site.

ALTER TABLE tenant_connections
  ADD COLUMN IF NOT EXISTS selected_search_console_site_url VARCHAR(500);
