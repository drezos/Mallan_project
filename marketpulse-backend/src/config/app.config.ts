import type { AppConfig, IntentType } from '../types/index.js';

// ============================================
// MarketPulse Configuration
// Configured for: Jacks.nl (Netherlands iGaming)
// ============================================

export const config: AppConfig = {
  // Your brand (Jacks.nl)
  brand: {
    name: 'Jacks.nl',
    keywords: [
      'jacks.nl',
      'jacks casino',
      'jack casino',
      'jacks nl',
      'jacks online casino'
    ]
  },

  // 10 Competitors to track
  competitors: [
    {
      name: 'Toto',
      keywords: ['toto casino', 'toto sport', 'toto.nl', 'toto online']
    },
    {
      name: 'Unibet',
      keywords: ['unibet', 'unibet nederland', 'unibet casino', 'unibet nl']
    },
    {
      name: 'Bet365',
      keywords: ['bet365', 'bet365 nederland', 'bet365 nl', 'bet365 casino']
    },
    {
      name: 'BetCity',
      keywords: ['betcity', 'betcity.nl', 'betcity casino', 'bet city']
    },
    {
      name: 'Holland Casino',
      keywords: ['holland casino', 'holland casino online', 'hollandcasino.nl']
    },
    {
      name: 'Circus',
      keywords: ['circus casino', 'circus.nl', 'circus online', 'circus bet']
    },
    {
      name: '711',
      keywords: ['711 casino', '711.nl', '711 online casino', 'seveneleven casino']
    },
    {
      name: 'Kansino',
      keywords: ['kansino', 'kansino.nl', 'kansino casino', 'kansino online']
    },
    {
      name: 'BetMGM',
      keywords: ['betmgm', 'betmgm nederland', 'betmgm nl', 'betmgm casino']
    },
    {
      name: 'LeoVegas',
      keywords: ['leovegas', 'leovegas nederland', 'leovegas nl', 'leo vegas casino']
    }
  ],

  // Netherlands market settings
  market: {
    regionId: 2528,      // Netherlands location code for DataForSEO
    regionName: 'Netherlands',
    languageCode: 'nl',  // Dutch
    currency: 'EUR'
  },

  // 20 Intent keywords (Dutch) organized by category
  intentKeywords: {
    // Comparison intent - players looking for best options
    comparison: [
      'beste online casino',           // best online casino
      'casino vergelijken',            // compare casinos
      'top casino nederland',          // top casino netherlands
      'welk casino is het beste'       // which casino is best
    ],

    // Problem intent - players experiencing issues
    problem: [
      'casino uitbetaling problemen',  // casino withdrawal problems
      'casino klacht',                 // casino complaint
      'casino geen uitbetaling',       // casino no payout
      'casino traag'                   // casino slow
    ],

    // Regulation intent - compliance/safety concerns
    regulation: [
      'casino vergunning nederland',   // casino license netherlands
      'legaal online casino',          // legal online casino
      'veilig casino',                 // safe casino
      'ksa vergunning casino'          // KSA licensed casino
    ],

    // Product intent - looking for features/bonuses
    product: [
      'casino bonus',                  // casino bonus
      'welkomstbonus casino',          // welcome bonus casino
      'gratis spins',                  // free spins
      'casino storten'                 // casino deposit
    ],

    // Review intent - researching experiences
    review: [
      'casino review',                 // casino review
      'casino ervaring',               // casino experience
      'casino betrouwbaar',            // casino trustworthy
      'casino reddit nederland'        // casino reddit netherlands
    ],

    // Brand intent - direct brand searches (tracked separately)
    brand: [
      // These are populated dynamically from brand + competitor keywords
    ]
  }
};

// ============================================
// Helper Functions
// ============================================

// Get all keywords to track (flat array)
export function getAllKeywords(): string[] {
  const keywords: string[] = [];
  
  // Add brand keywords
  keywords.push(...config.brand.keywords);
  
  // Add competitor keywords
  config.competitors.forEach(competitor => {
    keywords.push(...competitor.keywords);
  });
  
  // Add intent keywords
  Object.values(config.intentKeywords).forEach(intentKeywords => {
    keywords.push(...intentKeywords);
  });
  
  return [...new Set(keywords)]; // Remove duplicates
}

// Get intent type for a keyword
export function getIntentType(keyword: string): IntentType | null {
  for (const [intentType, keywords] of Object.entries(config.intentKeywords)) {
    if (keywords.includes(keyword.toLowerCase())) {
      return intentType as IntentType;
    }
  }
  return null;
}

// Get competitor by name
export function getCompetitorByName(name: string) {
  return config.competitors.find(
    c => c.name.toLowerCase() === name.toLowerCase()
  );
}

// Check if keyword belongs to a brand
export function getBrandForKeyword(keyword: string): string | null {
  const lowerKeyword = keyword.toLowerCase();
  
  // Check your brand
  if (config.brand.keywords.some(k => lowerKeyword.includes(k.toLowerCase()))) {
    return config.brand.name;
  }
  
  // Check competitors
  for (const competitor of config.competitors) {
    if (competitor.keywords.some(k => lowerKeyword.includes(k.toLowerCase()))) {
      return competitor.name;
    }
  }
  
  return null;
}

export default config;
