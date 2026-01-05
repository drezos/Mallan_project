-- Seed Quicklets Malta tenant with competitors and market keywords
-- Run with: psql $DATABASE_URL -f src/db/seed-quicklets-data.sql

-- Start transaction
BEGIN;

-- Get Quicklets tenant_id
DO $$
DECLARE
  v_tenant_id UUID;
  v_dhalia_id UUID;
  v_franksalt_id UUID;
  v_alliance_id UUID;
  v_perry_id UUID;
  v_benestates_id UUID;
  v_zanzi_id UUID;
BEGIN
  -- Get tenant ID
  SELECT id INTO v_tenant_id FROM tenants WHERE name = 'Quicklets';

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Quicklets tenant not found. Please create the tenant first.';
  END IF;

  RAISE NOTICE 'Found Quicklets tenant: %', v_tenant_id;

  -- ===========================================
  -- ADD COMPETITORS
  -- ===========================================

  -- 1. Dhalia
  INSERT INTO tenant_competitors (tenant_id, name, url)
  VALUES (v_tenant_id, 'Dhalia', 'https://www.dhalia.com')
  RETURNING id INTO v_dhalia_id;

  -- Dhalia keywords
  INSERT INTO tenant_competitor_keywords (tenant_id, competitor_id, keyword) VALUES
    (v_tenant_id, v_dhalia_id, 'dhalia'),
    (v_tenant_id, v_dhalia_id, 'dhalia malta'),
    (v_tenant_id, v_dhalia_id, 'dhalia property');

  RAISE NOTICE 'Added Dhalia with 3 keywords';

  -- 2. Frank Salt
  INSERT INTO tenant_competitors (tenant_id, name, url)
  VALUES (v_tenant_id, 'Frank Salt', 'https://www.franksalt.com.mt')
  RETURNING id INTO v_franksalt_id;

  -- Frank Salt keywords
  INSERT INTO tenant_competitor_keywords (tenant_id, competitor_id, keyword) VALUES
    (v_tenant_id, v_franksalt_id, 'frank salt'),
    (v_tenant_id, v_franksalt_id, 'frank salt malta'),
    (v_tenant_id, v_franksalt_id, 'frank salt property');

  RAISE NOTICE 'Added Frank Salt with 3 keywords';

  -- 3. Alliance
  INSERT INTO tenant_competitors (tenant_id, name, url)
  VALUES (v_tenant_id, 'Alliance', 'https://www.alliance.com.mt')
  RETURNING id INTO v_alliance_id;

  -- Alliance keywords
  INSERT INTO tenant_competitor_keywords (tenant_id, competitor_id, keyword) VALUES
    (v_tenant_id, v_alliance_id, 'alliance malta'),
    (v_tenant_id, v_alliance_id, 'alliance property');

  RAISE NOTICE 'Added Alliance with 2 keywords';

  -- 4. Perry
  INSERT INTO tenant_competitors (tenant_id, name, url)
  VALUES (v_tenant_id, 'Perry', 'https://www.perry.com.mt')
  RETURNING id INTO v_perry_id;

  -- Perry keywords
  INSERT INTO tenant_competitor_keywords (tenant_id, competitor_id, keyword) VALUES
    (v_tenant_id, v_perry_id, 'perry malta'),
    (v_tenant_id, v_perry_id, 'perry real estate');

  RAISE NOTICE 'Added Perry with 2 keywords';

  -- 5. Benestates
  INSERT INTO tenant_competitors (tenant_id, name, url)
  VALUES (v_tenant_id, 'Benestates', 'https://www.benestates.com')
  RETURNING id INTO v_benestates_id;

  -- Benestates keywords
  INSERT INTO tenant_competitor_keywords (tenant_id, competitor_id, keyword) VALUES
    (v_tenant_id, v_benestates_id, 'benestates'),
    (v_tenant_id, v_benestates_id, 'benestates malta');

  RAISE NOTICE 'Added Benestates with 2 keywords';

  -- 6. Zanzi
  INSERT INTO tenant_competitors (tenant_id, name, url)
  VALUES (v_tenant_id, 'Zanzi', 'https://www.zanzi.com.mt')
  RETURNING id INTO v_zanzi_id;

  -- Zanzi keywords
  INSERT INTO tenant_competitor_keywords (tenant_id, competitor_id, keyword) VALUES
    (v_tenant_id, v_zanzi_id, 'zanzi homes'),
    (v_tenant_id, v_zanzi_id, 'zanzi malta');

  RAISE NOTICE 'Added Zanzi with 2 keywords';

  -- ===========================================
  -- ADD MARKET KEYWORDS (category: comparison)
  -- ===========================================

  INSERT INTO tenant_market_keywords (tenant_id, keyword, category) VALUES
    (v_tenant_id, 'apartments for rent malta', 'comparison'),
    (v_tenant_id, 'apartments for sale in malta', 'comparison'),
    (v_tenant_id, 'buy apartment malta', 'comparison'),
    (v_tenant_id, 'property malta for sale', 'comparison');

  RAISE NOTICE 'Added 4 market keywords';

  -- ===========================================
  -- CLEAR TENANT CACHE
  -- ===========================================

  DELETE FROM tenant_cache WHERE tenant_id = v_tenant_id;

  RAISE NOTICE 'Cleared Quicklets tenant cache';
  RAISE NOTICE 'Successfully seeded Quicklets Malta data!';

END $$;

COMMIT;

-- Verify the data was inserted
SELECT 'Competitors:' as info;
SELECT tc.name, tc.url, COUNT(tck.id) as keyword_count
FROM tenant_competitors tc
LEFT JOIN tenant_competitor_keywords tck ON tc.id = tck.competitor_id
WHERE tc.tenant_id = (SELECT id FROM tenants WHERE name = 'Quicklets')
GROUP BY tc.id, tc.name, tc.url
ORDER BY tc.name;

SELECT 'Market Keywords:' as info;
SELECT keyword, category
FROM tenant_market_keywords
WHERE tenant_id = (SELECT id FROM tenants WHERE name = 'Quicklets')
ORDER BY keyword;
