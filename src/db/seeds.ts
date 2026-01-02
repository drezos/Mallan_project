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
