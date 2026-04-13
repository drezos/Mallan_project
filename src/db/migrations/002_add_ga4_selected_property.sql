-- Migration: Add selected GA4 property columns to tenant_connections
-- Purpose: Persist which GA4 property a tenant has picked for their Google connection.
-- The user chooses a property from GET /api/connections/google/ga4-properties and
-- the selection is saved via POST /api/connections/google/ga4-property.

ALTER TABLE tenant_connections
  ADD COLUMN IF NOT EXISTS selected_property_id VARCHAR(255);

ALTER TABLE tenant_connections
  ADD COLUMN IF NOT EXISTS selected_property_name VARCHAR(500);
