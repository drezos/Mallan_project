import { pool } from './cache';

/**
 * User Competitors Migration
 * Creates the user_competitors table and seeds initial data
 */

const INITIAL_COMPETITORS = [
  { name: 'Toto', url: 'https://www.toto.nl' },
  { name: 'Unibet', url: 'https://www.unibet.nl' },
  { name: 'Bet365', url: 'https://www.bet365.nl' },
  { name: 'BetCity', url: 'https://www.betcity.nl' },
  { name: 'Holland Casino', url: 'https://www.hollandcasino.nl' },
  { name: 'Circus', url: 'https://www.circus.nl' },
  { name: '711', url: 'https://www.711.nl' },
  { name: 'Kansino', url: 'https://www.kansino.nl' },
  { name: 'BetMGM', url: 'https://www.betmgm.nl' },
  { name: 'LeoVegas', url: 'https://www.leovegas.nl' },
];

/**
 * Run multi-tenant schema migrations
 */
async function runMultiTenantMigrations(): Promise<void> {
  console.log('🏢 Running multi-tenant schema migrations...');

  // Create UUID extension if not exists
  await pool.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  // Create market_keyword_category enum type
  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE market_keyword_category AS ENUM (
        'comparison', 'problem', 'product', 'regulation', 'review'
      );
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  // 1. Create tenants table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tenants (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      brand_name VARCHAR(255) NOT NULL,
      brand_url VARCHAR(500) NOT NULL,
      region_code INTEGER NOT NULL,
      region_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tenants_name ON tenants(name)
  `);

  console.log('  ✅ tenants table created');

  // 2. Create tenant_brand_keywords table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tenant_brand_keywords (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      keyword VARCHAR(500) NOT NULL,
      search_volume INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tenant_brand_keywords_tenant ON tenant_brand_keywords(tenant_id)
  `);

  console.log('  ✅ tenant_brand_keywords table created');

  // 3. Create tenant_competitors table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tenant_competitors (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      url VARCHAR(500) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tenant_competitors_tenant ON tenant_competitors(tenant_id)
  `);

  console.log('  ✅ tenant_competitors table created');

  // 4. Create tenant_competitor_keywords table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tenant_competitor_keywords (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      competitor_id UUID NOT NULL REFERENCES tenant_competitors(id) ON DELETE CASCADE,
      keyword VARCHAR(500) NOT NULL,
      search_volume INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tenant_competitor_keywords_tenant ON tenant_competitor_keywords(tenant_id)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tenant_competitor_keywords_competitor ON tenant_competitor_keywords(competitor_id)
  `);

  console.log('  ✅ tenant_competitor_keywords table created');

  // 5. Create tenant_market_keywords table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tenant_market_keywords (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      keyword VARCHAR(500) NOT NULL,
      category market_keyword_category NOT NULL,
      search_volume INTEGER,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tenant_market_keywords_tenant ON tenant_market_keywords(tenant_id)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tenant_market_keywords_category ON tenant_market_keywords(category)
  `);

  console.log('  ✅ tenant_market_keywords table created');

  // 6. Create tenant_cache table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tenant_cache (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
      cache_key VARCHAR(255) NOT NULL,
      data JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      UNIQUE(tenant_id, cache_key)
    )
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tenant_cache_tenant ON tenant_cache(tenant_id)
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_tenant_cache_key ON tenant_cache(tenant_id, cache_key)
  `);

  console.log('  ✅ tenant_cache table created');
  console.log('✅ Multi-tenant schema migrations complete');
}

/**
 * Run database migrations for user competitors
 */
export async function runMigrations(): Promise<void> {
  try {
    // Create user_competitors table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_competitors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        url VARCHAR(500),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create index for faster lookups
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_competitors_name ON user_competitors(name)
    `);

    // Check if table is empty (first run)
    const countResult = await pool.query('SELECT COUNT(*) as count FROM user_competitors');
    const count = parseInt(countResult.rows[0].count, 10);

    if (count === 0) {
      // Seed initial competitors
      console.log('📦 Seeding initial competitors...');

      for (const competitor of INITIAL_COMPETITORS) {
        await pool.query(
          'INSERT INTO user_competitors (name, url) VALUES ($1, $2)',
          [competitor.name, competitor.url]
        );
      }

      console.log(`✅ Seeded ${INITIAL_COMPETITORS.length} initial competitors`);
    }

    console.log('✅ User competitors table initialized');

    // Run multi-tenant migrations
    await runMultiTenantMigrations();
  } catch (error) {
    console.error('❌ Failed to run migrations:', error);
    throw error;
  }
}

/**
 * Helper function to execute queries
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export { pool };
