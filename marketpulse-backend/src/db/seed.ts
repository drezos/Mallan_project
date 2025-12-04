import { query, closePool } from './index.js';
import config from '../config/app.config.js';

// ============================================
// MarketPulse Database Seeding
// Run with: npm run db:seed
// ============================================

async function seed() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // 1. Create default user (you - for personal dashboard first)
    const userResult = await query<{ id: number }>(`
      INSERT INTO users (email, brand_name)
      VALUES ($1, $2)
      ON CONFLICT (email) DO UPDATE SET brand_name = $2
      RETURNING id
    `, ['admin@jacks.nl', config.brand.name]);
    
    const userId = userResult.rows[0].id;
    console.log(`✅ Created/updated user: admin@jacks.nl (id: ${userId})`);

    // 2. Create your brand
    const ownBrandResult = await query<{ id: number }>(`
      INSERT INTO brands (name, keywords, is_own_brand, user_id)
      VALUES ($1, $2, true, $3)
      ON CONFLICT DO NOTHING
      RETURNING id
    `, [config.brand.name, config.brand.keywords, userId]);
    
    if (ownBrandResult.rows[0]) {
      console.log(`✅ Created brand: ${config.brand.name} (your brand)`);
    }

    // 3. Create competitor brands
    for (const competitor of config.competitors) {
      await query(`
        INSERT INTO brands (name, keywords, is_own_brand, user_id)
        VALUES ($1, $2, false, $3)
        ON CONFLICT DO NOTHING
      `, [competitor.name, competitor.keywords, userId]);
      console.log(`✅ Created competitor: ${competitor.name}`);
    }

    // 4. Seed intent keywords into intent_signals (with placeholder data)
    const intentTypes = Object.entries(config.intentKeywords);
    for (const [intentType, keywords] of intentTypes) {
      for (const keyword of keywords) {
        await query(`
          INSERT INTO intent_signals (date, keyword, intent_type, search_volume, region_id)
          VALUES (CURRENT_DATE, $1, $2, 0, $3)
          ON CONFLICT (date, keyword) DO NOTHING
        `, [keyword, intentType, config.market.regionId]);
      }
    }
    console.log(`✅ Seeded ${Object.values(config.intentKeywords).flat().length} intent keywords`);

    // 5. Create some mock historical data (for dashboard development)
    console.log('\n📊 Creating mock historical data for development...');
    
    await createMockData(userId);

    console.log('\n🎉 Seeding completed successfully!');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await closePool();
  }
}

async function createMockData(userId: number) {
  // Get all brand IDs
  const brandsResult = await query<{ id: number; name: string; is_own_brand: boolean }>(`
    SELECT id, name, is_own_brand FROM brands WHERE user_id = $1
  `, [userId]);
  
  const brands = brandsResult.rows;
  const ownBrand = brands.find(b => b.is_own_brand);
  const competitors = brands.filter(b => !b.is_own_brand);

  // Generate 12 weeks of mock data
  for (let weeksAgo = 12; weeksAgo >= 0; weeksAgo--) {
    const date = new Date();
    date.setDate(date.getDate() - (weeksAgo * 7));
    const dateStr = date.toISOString().split('T')[0];

    // Your brand - growing trend
    if (ownBrand) {
      const baseVolume = 5000 + (12 - weeksAgo) * 200; // Growing from 5000 to 7400
      const variance = Math.floor(Math.random() * 500) - 250;
      
      await query(`
        INSERT INTO daily_signals (date, brand_id, keyword, search_volume, region_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (date, brand_id, keyword) DO UPDATE SET search_volume = $4
      `, [dateStr, ownBrand.id, 'jacks casino', baseVolume + variance, config.market.regionId]);
    }

    // Competitors - varying trends
    for (let i = 0; i < competitors.length; i++) {
      const competitor = competitors[i];
      
      // Different growth patterns for each competitor
      let baseVolume: number;
      switch (i) {
        case 0: // Toto - market leader, stable
          baseVolume = 15000 + Math.floor(Math.random() * 1000);
          break;
        case 1: // Unibet - declining
          baseVolume = 12000 - (12 - weeksAgo) * 100 + Math.floor(Math.random() * 500);
          break;
        case 2: // Bet365 - strong growth
          baseVolume = 8000 + (12 - weeksAgo) * 300 + Math.floor(Math.random() * 400);
          break;
        case 3: // BetCity - aggressive growth (potential threat)
          baseVolume = 3000 + (12 - weeksAgo) * 500 + Math.floor(Math.random() * 300);
          break;
        default:
          baseVolume = 4000 + Math.floor(Math.random() * 2000);
      }

      await query(`
        INSERT INTO daily_signals (date, brand_id, keyword, search_volume, region_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (date, brand_id, keyword) DO UPDATE SET search_volume = $4
      `, [dateStr, competitor.id, `${competitor.name.toLowerCase()} casino`, baseVolume, config.market.regionId]);
    }

    // Calculate and store metrics for this date
    const totalMarket = 80000 + Math.floor(Math.random() * 10000);
    const ownShare = ownBrand ? (5000 + (12 - weeksAgo) * 200) / totalMarket * 100 : 0;
    
    await query(`
      INSERT INTO calculated_metrics (date, user_id, market_share_momentum, competitive_pressure, sentiment_score, brand_heat, week_over_week_change)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (date, user_id) DO UPDATE SET 
        market_share_momentum = $3,
        competitive_pressure = $4,
        sentiment_score = $5,
        brand_heat = $6,
        week_over_week_change = $7
    `, [
      dateStr, 
      userId, 
      6.5 + Math.random() * 2,        // momentum: 6.5-8.5
      5 + Math.random() * 3,           // pressure: 5-8
      0.6 + Math.random() * 0.3,       // sentiment: 0.6-0.9
      ownShare,                         // brand heat
      (Math.random() * 10) - 3         // WoW change: -3% to +7%
    ]);
  }

  console.log('✅ Created 12 weeks of mock historical data');

  // Create a few sample alerts
  const alertsData = [
    {
      type: 'emerging_threat',
      severity: 'high',
      message: 'BetCity showing abnormal growth: +85% over 4 weeks. Investigate marketing spend.',
      competitor: 'BetCity',
      value: 85
    },
    {
      type: 'intent_shift',
      severity: 'medium',
      message: 'Problem-related searches increased 35% WoW. Monitor player sentiment.',
      competitor: null,
      value: 35
    },
    {
      type: 'competitive_pressure',
      severity: 'low',
      message: 'Competitive pressure index stable at 6.2/10. Market conditions normal.',
      competitor: null,
      value: 6.2
    }
  ];

  for (const alert of alertsData) {
    await query(`
      INSERT INTO alerts (user_id, alert_type, severity, message, competitor_name, metric_value)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [userId, alert.type, alert.severity, alert.message, alert.competitor, alert.value]);
  }
  
  console.log('✅ Created sample alerts');
}

seed();
