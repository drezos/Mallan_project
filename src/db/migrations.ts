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
