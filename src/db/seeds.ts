import { pool } from './cache';
import { brands, intentKeywords } from '../config/brandKeywords';

/**
 * Jacks.nl Tenant Seed Data
 * Seeds the first tenant with existing hardcoded configuration
 */

// The 10 competitors to seed
const COMPETITORS_TO_SEED = [
  'toto',
  'unibet',
  'bet365',
  'betcity',
  'holland-casino',
  'circus',
  '711',
  'kansino',
  'betmgm',
  'leovegas',
];

/**
 * Seed Jacks.nl as the first tenant with all brand keywords,
 * competitors, competitor keywords, and market keywords
 */
export async function seedJacksTenant(): Promise<void> {
  // Check if tenants table already has data
  const existingTenants = await pool.query('SELECT COUNT(*) as count FROM tenants');
  if (parseInt(existingTenants.rows[0].count, 10) > 0) {
    console.log('⏭️  Tenants already seeded, skipping...');
    return;
  }

  console.log('🌱 Seeding Jacks.nl tenant...');

  // 1. Create the tenant
  const tenantResult = await pool.query(
    `INSERT INTO tenants (name, brand_name, brand_url, region_code, region_name)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    ['Jacks.nl', 'Jacks Casino', 'jacks.nl', 2528, 'Netherlands']
  );
  const tenantId = tenantResult.rows[0].id;

  // 2. Get Jacks brand and copy keywords to tenant_brand_keywords
  const jacksBrand = brands.find(b => b.id === 'jacks');
  let brandKeywordCount = 0;

  if (jacksBrand) {
    for (const keyword of jacksBrand.keywords) {
      await pool.query(
        `INSERT INTO tenant_brand_keywords (tenant_id, keyword)
         VALUES ($1, $2)`,
        [tenantId, keyword]
      );
      brandKeywordCount++;
    }
  }

  console.log(`  ✅ Added ${brandKeywordCount} brand keywords`);

  // 3. Create competitors and their keywords
  let competitorCount = 0;
  let competitorKeywordCount = 0;

  for (const competitorId of COMPETITORS_TO_SEED) {
    const competitor = brands.find(b => b.id === competitorId);
    if (!competitor) continue;

    // Insert competitor
    const competitorResult = await pool.query(
      `INSERT INTO tenant_competitors (tenant_id, name, url)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [tenantId, competitor.displayName, `https://www.${competitor.website}`]
    );
    const dbCompetitorId = competitorResult.rows[0].id;
    competitorCount++;

    // Insert competitor keywords
    for (const keyword of competitor.keywords) {
      await pool.query(
        `INSERT INTO tenant_competitor_keywords (tenant_id, competitor_id, keyword)
         VALUES ($1, $2, $3)`,
        [tenantId, dbCompetitorId, keyword]
      );
      competitorKeywordCount++;
    }
  }

  console.log(`  ✅ Added ${competitorCount} competitors with ${competitorKeywordCount} keywords`);

  // 4. Copy intent keywords as market keywords
  let marketKeywordCount = 0;

  for (const intentCategory of intentKeywords) {
    for (const keyword of intentCategory.keywords) {
      await pool.query(
        `INSERT INTO tenant_market_keywords (tenant_id, keyword, category)
         VALUES ($1, $2, $3)`,
        [tenantId, keyword, intentCategory.category]
      );
      marketKeywordCount++;
    }
  }

  console.log(`  ✅ Added ${marketKeywordCount} market keywords`);

  console.log(`✅ Seeded Jacks.nl tenant with ${brandKeywordCount} brand keywords, ${competitorCount} competitors, ${marketKeywordCount} market keywords`);
}

/**
 * Quicklets Malta Competitor and Market Keyword Data
 * Seeds competitors and market keywords for Malta real estate tenant
 */

// Malta real estate competitors
const QUICKLETS_COMPETITORS = [
  {
    name: 'Dhalia',
    url: 'https://www.dhalia.com',
    keywords: ['dhalia', 'dhalia malta', 'dhalia property'],
  },
  {
    name: 'Frank Salt',
    url: 'https://www.franksalt.com.mt',
    keywords: ['frank salt', 'frank salt malta', 'frank salt property'],
  },
  {
    name: 'Alliance',
    url: 'https://www.alliance.com.mt',
    keywords: ['alliance malta', 'alliance property'],
  },
  {
    name: 'Perry',
    url: 'https://www.perry.com.mt',
    keywords: ['perry malta', 'perry real estate'],
  },
  {
    name: 'Benestates',
    url: 'https://www.benestates.com',
    keywords: ['benestates', 'benestates malta'],
  },
  {
    name: 'Zanzi',
    url: 'https://www.zanzi.com.mt',
    keywords: ['zanzi homes', 'zanzi malta'],
  },
];

// Malta market keywords (comparison category)
const QUICKLETS_MARKET_KEYWORDS = [
  'apartments for rent malta',
  'apartments for sale in malta',
  'buy apartment malta',
  'property malta for sale',
];

/**
 * Seed Quicklets tenant with Malta real estate competitors and market keywords
 */
export async function seedQuickletsData(): Promise<void> {
  console.log('🌱 Seeding Quicklets Malta data...');

  // Get Quicklets tenant ID
  const tenantResult = await pool.query(
    "SELECT id FROM tenants WHERE name = 'Quicklets'"
  );

  if (tenantResult.rows.length === 0) {
    console.log('❌ Quicklets tenant not found. Please create the tenant first.');
    return;
  }

  const tenantId = tenantResult.rows[0].id;
  console.log(`  Found Quicklets tenant: ${tenantId}`);

  // Check if competitors already exist
  const existingCompetitors = await pool.query(
    'SELECT COUNT(*) as count FROM tenant_competitors WHERE tenant_id = $1',
    [tenantId]
  );

  if (parseInt(existingCompetitors.rows[0].count, 10) > 0) {
    console.log('⏭️  Quicklets competitors already seeded, skipping...');
    return;
  }

  // Add competitors and their keywords
  let competitorCount = 0;
  let competitorKeywordCount = 0;

  for (const competitor of QUICKLETS_COMPETITORS) {
    // Insert competitor
    const competitorResult = await pool.query(
      `INSERT INTO tenant_competitors (tenant_id, name, url)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [tenantId, competitor.name, competitor.url]
    );
    const competitorId = competitorResult.rows[0].id;
    competitorCount++;

    // Insert competitor keywords
    for (const keyword of competitor.keywords) {
      await pool.query(
        `INSERT INTO tenant_competitor_keywords (tenant_id, competitor_id, keyword)
         VALUES ($1, $2, $3)`,
        [tenantId, competitorId, keyword]
      );
      competitorKeywordCount++;
    }
  }

  console.log(`  ✅ Added ${competitorCount} competitors with ${competitorKeywordCount} keywords`);

  // Add market keywords
  let marketKeywordCount = 0;

  for (const keyword of QUICKLETS_MARKET_KEYWORDS) {
    await pool.query(
      `INSERT INTO tenant_market_keywords (tenant_id, keyword, category)
       VALUES ($1, $2, $3)`,
      [tenantId, keyword, 'comparison']
    );
    marketKeywordCount++;
  }

  console.log(`  ✅ Added ${marketKeywordCount} market keywords (category: comparison)`);

  // Clear tenant cache
  await pool.query(
    'DELETE FROM tenant_cache WHERE tenant_id = $1',
    [tenantId]
  );
  console.log('  ✅ Cleared Quicklets tenant cache');

  console.log(`✅ Seeded Quicklets Malta: ${competitorCount} competitors, ${competitorKeywordCount} competitor keywords, ${marketKeywordCount} market keywords`);
}
