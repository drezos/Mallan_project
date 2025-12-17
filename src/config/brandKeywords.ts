/**
 * Brand Keyword Configuration - Dutch iGaming Market
 * 
 * This file defines all brands and their associated keywords
 * for the MarketPulse competitive intelligence dashboard.
 * 
 * Pattern per brand:
 * - URL (domain)
 * - brand + casino
 * - brand + sport
 * - brand + nl (location abbreviation)
 * - brand + inloggen (login)
 */

export interface BrandConfig {
  id: string;
  displayName: string;
  website: string;
  keywords: string[];
  isOwnBrand: boolean;
  color: string;
}

export interface IntentKeywordConfig {
  category: string;
  displayName: string;
  keywords: string[];
}

// =============================================================================
// BRAND CONFIGURATIONS
// =============================================================================

export const brands: BrandConfig[] = [
  // YOUR BRAND
  {
    id: "jacks",
    displayName: "Jacks Casino",
    website: "jacks.nl",
    isOwnBrand: true,
    color: "#1B4D3E",
    keywords: [
      "jacks.nl",
      "jacks casino",
      "jacks sport",
      "jacks nl",
      "jacks inloggen",
      "jack casino",
      "jacks online casino",
      "jacks gokken"
    ]
  },

  // COMPETITORS
  {
    id: "toto",
    displayName: "Toto",
    website: "toto.nl",
    isOwnBrand: false,
    color: "#FF6B00",
    keywords: [
      "toto.nl",
      "toto casino",
      "toto sport",
      "toto nl",
      "toto inloggen",
      "toto gokken",
      "toto online"
    ]
  },

  {
    id: "holland-casino",
    displayName: "Holland Casino",
    website: "hollandcasino.nl",
    isOwnBrand: false,
    color: "#C4A000",
    keywords: [
      "hollandcasino.nl",
      "holland casino",
      "holland casino sport",
      "holland casino nl",
      "holland casino inloggen",
      "holland casino online",
      "hc online"
    ]
  },

  {
    id: "bet365",
    displayName: "Bet365",
    website: "bet365.nl",
    isOwnBrand: false,
    color: "#027B5B",
    keywords: [
      "bet365.nl",
      "bet365 casino",
      "bet365 sport",
      "bet365 nl",
      "bet365 inloggen",
      "bet365 nederland",
      "bet 365"
    ]
  },

  {
    id: "unibet",
    displayName: "Unibet",
    website: "unibet.nl",
    isOwnBrand: false,
    color: "#14805E",
    keywords: [
      "unibet.nl",
      "unibet casino",
      "unibet sport",
      "unibet nl",
      "unibet inloggen",
      "unibet nederland",
      "unibet online"
    ]
  },

  {
    id: "betcity",
    displayName: "BetCity",
    website: "betcity.nl",
    isOwnBrand: false,
    color: "#FF4444",
    keywords: [
      "betcity.nl",
      "betcity casino",
      "betcity sport",
      "betcity nl",
      "betcity inloggen",
      "bet city",
      "betcity online"
    ]
  },

  {
    id: "kansino",
    displayName: "Kansino",
    website: "kansino.nl",
    isOwnBrand: false,
    color: "#6B5B95",
    keywords: [
      "kansino.nl",
      "kansino casino",
      "kansino sport",
      "kansino nl",
      "kansino inloggen",
      "kansino online"
    ]
  },

  {
    id: "circus",
    displayName: "Circus",
    website: "circus.nl",
    isOwnBrand: false,
    color: "#E63946",
    keywords: [
      "circus.nl",
      "circus casino",
      "circus sport",
      "circus nl",
      "circus inloggen",
      "circus online casino",
      "circus gokken"
    ]
  },

  {
    id: "leovegas",
    displayName: "LeoVegas",
    website: "leovegas.nl",
    isOwnBrand: false,
    color: "#FF6600",
    keywords: [
      "leovegas.nl",
      "leovegas casino",
      "leovegas sport",
      "leovegas nl",
      "leovegas inloggen",
      "leo vegas",
      "leovegas nederland"
    ]
  },

  {
    id: "betmgm",
    displayName: "BetMGM",
    website: "betmgm.nl",
    isOwnBrand: false,
    color: "#B8860B",
    keywords: [
      "betmgm.nl",
      "betmgm casino",
      "betmgm sport",
      "betmgm nl",
      "betmgm inloggen",
      "bet mgm",
      "betmgm nederland"
    ]
  },

  {
    id: "711",
    displayName: "711",
    website: "711.nl",
    isOwnBrand: false,
    color: "#2E8B57",
    keywords: [
      "711.nl",
      "711 casino",
      "711 sport",
      "711 nl",
      "711 inloggen",
      "711 online casino",
      "seven eleven casino"
    ]
  },

  {
    id: "tonybet",
    displayName: "TonyBet",
    website: "tonybet.nl",
    isOwnBrand: false,
    color: "#1E90FF",
    keywords: [
      "tonybet.nl",
      "tonybet casino",
      "tonybet sport",
      "tonybet nl",
      "tonybet inloggen",
      "tony bet",
      "tonybet nederland"
    ]
  },

  {
    id: "hardrock",
    displayName: "Hard Rock Casino",
    website: "hardrockcasino.nl",
    isOwnBrand: false,
    color: "#8B0000",
    keywords: [
      "hardrockcasino.nl",
      "hard rock casino",
      "hardrock casino sport",
      "hard rock nl",
      "hard rock inloggen",
      "hardrock casino nederland",
      "hard rock casino online"
    ]
  },

  {
    id: "onecasino",
    displayName: "OneCasino",
    website: "nl.onecasino.com",
    isOwnBrand: false,
    color: "#4169E1",
    keywords: [
      "nl.onecasino.com",
      "onecasino",
      "one casino",
      "onecasino sport",
      "onecasino nl",
      "onecasino inloggen",
      "one casino nederland"
    ]
  }
];

// =============================================================================
// INTENT KEYWORD CONFIGURATIONS
// =============================================================================

export const intentKeywords: IntentKeywordConfig[] = [
  {
    category: "comparison",
    displayName: "Comparison / Shopping",
    keywords: [
      "beste online casino",
      "beste casino nederland",
      "casino vergelijken",
      "top online casino",
      "welk casino is het beste",
      "betrouwbaar online casino",
      "veilig online casino"
    ]
  },
  {
    category: "problem",
    displayName: "Problems / Complaints",
    keywords: [
      "casino uitbetaling",
      "casino klacht",
      "casino probleem",
      "casino betaalt niet uit",
      "casino traag",
      "geld kwijt casino",
      "casino oplichting"
    ]
  },
  {
    category: "regulation",
    displayName: "Regulation / Legal",
    keywords: [
      "casino vergunning",
      "legaal casino nederland",
      "ksa vergunning",
      "kansspelautoriteit",
      "verantwoord gokken",
      "cruks register",
      "gokverbod nederland"
    ]
  },
  {
    category: "product",
    displayName: "Product / Features",
    keywords: [
      "casino bonus",
      "free spins",
      "welkomstbonus casino",
      "casino zonder storting",
      "live casino",
      "casino slots",
      "sportweddenschappen"
    ]
  },
  {
    category: "review",
    displayName: "Reviews / Research",
    keywords: [
      "casino review",
      "casino ervaring",
      "casino recensie",
      "casino betrouwbaar",
      "casino test",
      "casino beoordeling"
    ]
  }
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function getBrandKeywords(brandId: string): string[] {
  const brand = brands.find(b => b.id === brandId);
  return brand?.keywords || [];
}

export function getAllBrandKeywords(): string[] {
  return brands.flatMap(b => b.keywords);
}

export function getAllIntentKeywords(): string[] {
  return intentKeywords.flatMap(i => i.keywords);
}

export function getAllKeywords(): string[] {
  return [...getAllBrandKeywords(), ...getAllIntentKeywords()];
}

export function getOwnBrand(): BrandConfig | undefined {
  return brands.find(b => b.isOwnBrand);
}

export function getCompetitorBrands(): BrandConfig[] {
  return brands.filter(b => !b.isOwnBrand);
}

export function getBrandById(id: string): BrandConfig | undefined {
  return brands.find(b => b.id === id);
}

export function getKeywordCounts(): { brands: number; intent: number; total: number } {
  const brandCount = getAllBrandKeywords().length;
  const intentCount = getAllIntentKeywords().length;
  return {
    brands: brandCount,
    intent: intentCount,
    total: brandCount + intentCount
  };
}

// =============================================================================
// API CONFIGURATION
// =============================================================================

export const apiConfig = {
  dataForSeo: {
    location_code: 2528,        // Netherlands
    language_code: "nl",        // Dutch
    include_adult_keywords: true // Required for gambling keywords!
  },
  
  schedules: {
    searchVolume: "monthly",    // Google Ads Search Volume - 1st of month
    trends: "weekly",           // Google Trends - Every Monday
    serp: "weekly"              // SERP rankings - Every Monday
  },
  
  costs: {
    searchVolume: 0.075,        // Per request (up to 1000 keywords)
    trends: 0.009,              // Per request (up to 5 keywords)
    serp: 0.002                 // Per keyword
  }
};
