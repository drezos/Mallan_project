-- Migration: Add selected Google Ads account columns to tenant_connections
-- Purpose: Persist which Google Ads account a tenant has picked for their Google connection.
-- The user chooses an account from GET /api/connections/google/ads-accounts and
-- the selection is saved via POST /api/connections/google/ads-account.

ALTER TABLE tenant_connections
  ADD COLUMN IF NOT EXISTS selected_google_ads_customer_id VARCHAR(255);

ALTER TABLE tenant_connections
  ADD COLUMN IF NOT EXISTS selected_google_ads_account_name VARCHAR(500);

ALTER TABLE tenant_connections
  ADD COLUMN IF NOT EXISTS selected_google_ads_currency_code VARCHAR(10);
