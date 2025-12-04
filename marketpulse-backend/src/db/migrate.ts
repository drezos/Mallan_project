import { query, closePool } from './index.js';

// ============================================
// MarketPulse Database Migration
// Run with: npm run db:migrate
// ============================================

async function migrate() {
  console.log('🚀 Starting database migration...\n');

  try {
    // Users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        clerk_id VARCHAR(255) UNIQUE,
        brand_name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created users table');

    // Brands table (your brand + competitors)
    await query(`
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        keywords TEXT[] NOT NULL,
        is_own_brand BOOLEAN DEFAULT FALSE,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created brands table');

    // Daily signals (raw search volume data)
    await query(`
      CREATE TABLE IF NOT EXISTS daily_signals (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        brand_id INT REFERENCES brands(id) ON DELETE CASCADE,
        keyword VARCHAR(255) NOT NULL,
        search_volume INT DEFAULT 0,
        region_id INT NOT NULL DEFAULT 2528,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, brand_id, keyword)
      )
    `);
    console.log('✅ Created daily_signals table');

    // Intent keywords tracking
    await query(`
      CREATE TABLE IF NOT EXISTS intent_signals (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        keyword VARCHAR(255) NOT NULL,
        intent_type VARCHAR(50) NOT NULL,
        search_volume INT DEFAULT 0,
        region_id INT NOT NULL DEFAULT 2528,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, keyword)
      )
    `);
    console.log('✅ Created intent_signals table');

    // Calculated metrics (formula outputs)
    await query(`
      CREATE TABLE IF NOT EXISTS calculated_metrics (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        market_share_momentum FLOAT,
        competitive_pressure FLOAT,
        sentiment_score FLOAT,
        brand_heat FLOAT,
        week_over_week_change FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, user_id)
      )
    `);
    console.log('✅ Created calculated_metrics table');

    // Competitor metrics (per-competitor analysis)
    await query(`
      CREATE TABLE IF NOT EXISTS competitor_metrics (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        brand_id INT REFERENCES brands(id) ON DELETE CASCADE,
        total_search_volume INT DEFAULT 0,
        growth_rate_weekly FLOAT,
        growth_rate_monthly FLOAT,
        market_share FLOAT,
        anomaly_score FLOAT,
        risk_level VARCHAR(20) DEFAULT 'low',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, brand_id)
      )
    `);
    console.log('✅ Created competitor_metrics table');

    // Alerts
    await query(`
      CREATE TABLE IF NOT EXISTS alerts (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        alert_type VARCHAR(50) NOT NULL,
        severity VARCHAR(20) NOT NULL DEFAULT 'medium',
        message TEXT NOT NULL,
        competitor_name VARCHAR(255),
        metric_value FLOAT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created alerts table');

    // Create indexes for performance
    await query(`CREATE INDEX IF NOT EXISTS idx_daily_signals_date ON daily_signals(date)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_daily_signals_brand_date ON daily_signals(brand_id, date)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_intent_signals_date ON intent_signals(date)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_calculated_metrics_date ON calculated_metrics(date, user_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_alerts_user_created ON alerts(user_id, created_at DESC)`);
    console.log('✅ Created indexes');

    console.log('\n🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

migrate();
