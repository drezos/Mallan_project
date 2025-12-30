// Mock data for MarketPulse dashboard
// Used as fallback when API is unavailable

// ===========================================
// HELPER FUNCTIONS
// ===========================================

export function getVelocityStatus(change: number): 'accelerating' | 'stable' | 'decelerating' {
  if (change > 5) return 'accelerating';
  if (change < -5) return 'decelerating';
  return 'stable';
}

export function calculateSoS(volume: number, totalMarket: number): number {
  if (totalMarket === 0) return 0;
  return (volume / totalMarket) * 100;
}

// ===========================================
// BRAND DATA
// ===========================================

export const mockBrandData = {
  name: 'Jacks Casino',
  searchVolume: 165000, // Priority keyword volume for "jacks casino"
  growth: 8.2,
  marketShare: 8.2,
};

// ===========================================
// SHARE OF SEARCH
// ===========================================

export const mockShareOfSearch = {
  current: 8.2,
  change: 0.3,
  monthlyHistory: [7.5, 7.8, 7.6, 7.9, 8.0, 7.8, 8.1, 8.0, 8.2, 8.1, 8.3, 8.2],
};

// ===========================================
// MARKET RANK
// ===========================================

export const mockMarketRank = {
  current: 6,
  previous: 7,
  change: 1,
  total: 10,
  totalCompetitors: 10,
};

// ===========================================
// MARKET OPPORTUNITY
// ===========================================

export const mockMarketOpportunity = {
  yourBrand: 2400,
  competitors: 28000,
  generic: 12500,
  total: 42900,
};

// ===========================================
// TAM (Total Addressable Market)
// ===========================================

export const mockTAM = {
  total: 33080,
  growth: 6,
};

export const mockTAMGrowth = 6;

export const mockTAMTrendData = [
  { week: 'W1', tam: 28500, yourBrand: 2100 },
  { week: 'W2', tam: 29200, yourBrand: 2150 },
  { week: 'W3', tam: 28800, yourBrand: 2080 },
  { week: 'W4', tam: 30100, yourBrand: 2200 },
  { week: 'W5', tam: 29800, yourBrand: 2180 },
  { week: 'W6', tam: 31200, yourBrand: 2250 },
  { week: 'W7', tam: 30500, yourBrand: 2220 },
  { week: 'W8', tam: 31800, yourBrand: 2300 },
  { week: 'W9', tam: 32100, yourBrand: 2350 },
  { week: 'W10', tam: 31500, yourBrand: 2320 },
  { week: 'W11', tam: 32800, yourBrand: 2380 },
  { week: 'W12', tam: 33080, yourBrand: 2400 },
];

// ===========================================
// COMPETITORS
// Note: searchVolume values represent priority keyword volume (highest single keyword per brand)
// ===========================================

export const mockCompetitors = [
  { id: 1, name: 'OneCasino', searchVolume: 250000, monthlyChange: 5.2, marketShare: 18.5, velocityTrend: 'up', riskLevel: 'medium' },
  { id: 2, name: 'BetCity', searchVolume: 200000, monthlyChange: 3.2, marketShare: 15.8, velocityTrend: 'up', riskLevel: 'high' },
  { id: 3, name: 'Toto', searchVolume: 180000, monthlyChange: 4.5, marketShare: 14.9, velocityTrend: 'up', riskLevel: 'medium' },
  { id: 4, name: 'Jacks Casino', searchVolume: 165000, monthlyChange: 8.2, marketShare: 12.1, velocityTrend: 'up', riskLevel: 'none' },
  { id: 5, name: 'Holland Casino', searchVolume: 150000, monthlyChange: 1.5, marketShare: 10.5, velocityTrend: 'stable', riskLevel: 'low' },
  { id: 6, name: 'Unibet', searchVolume: 120000, monthlyChange: -2.1, marketShare: 8.2, velocityTrend: 'down', riskLevel: 'low' },
  { id: 7, name: 'Bet365', searchVolume: 100000, monthlyChange: 8.5, marketShare: 7.0, velocityTrend: 'up', riskLevel: 'medium' },
  { id: 8, name: 'Circus', searchVolume: 80000, monthlyChange: -1.8, marketShare: 5.6, velocityTrend: 'down', riskLevel: 'low' },
  { id: 9, name: 'Kansino', searchVolume: 60000, monthlyChange: 12.3, marketShare: 4.2, velocityTrend: 'up', riskLevel: 'high' },
  { id: 10, name: 'LeoVegas', searchVolume: 50000, monthlyChange: -0.5, marketShare: 3.5, velocityTrend: 'stable', riskLevel: 'low' },
  { id: 11, name: '711', searchVolume: 40000, monthlyChange: 2.5, marketShare: 2.8, velocityTrend: 'up', riskLevel: 'low' },
];

// Top rivals for competitive trend chart
export const topRivals = ['OneCasino', 'BetCity', 'Toto', 'Holland Casino', 'Unibet'];

// ===========================================
// COMPETITIVE TREND DATA (12 weeks)
// Note: Values represent priority keyword volume per brand
// ===========================================

export const mockCompetitiveTrendData = [
  { week: 'W1', 'Jacks Casino': 157000, 'OneCasino': 238000, 'BetCity': 190000, 'Toto': 171000, 'Holland Casino': 143000, 'Unibet': 114000 },
  { week: 'W2', 'Jacks Casino': 158000, 'OneCasino': 240000, 'BetCity': 192000, 'Toto': 173000, 'Holland Casino': 144000, 'Unibet': 115000 },
  { week: 'W3', 'Jacks Casino': 159000, 'OneCasino': 242000, 'BetCity': 193000, 'Toto': 174000, 'Holland Casino': 145000, 'Unibet': 116000 },
  { week: 'W4', 'Jacks Casino': 160000, 'OneCasino': 244000, 'BetCity': 194000, 'Toto': 175000, 'Holland Casino': 146000, 'Unibet': 117000 },
  { week: 'W5', 'Jacks Casino': 161000, 'OneCasino': 245000, 'BetCity': 195000, 'Toto': 176000, 'Holland Casino': 147000, 'Unibet': 117500 },
  { week: 'W6', 'Jacks Casino': 162000, 'OneCasino': 246000, 'BetCity': 196000, 'Toto': 177000, 'Holland Casino': 148000, 'Unibet': 118000 },
  { week: 'W7', 'Jacks Casino': 162500, 'OneCasino': 247000, 'BetCity': 197000, 'Toto': 177500, 'Holland Casino': 148500, 'Unibet': 118500 },
  { week: 'W8', 'Jacks Casino': 163000, 'OneCasino': 248000, 'BetCity': 198000, 'Toto': 178000, 'Holland Casino': 149000, 'Unibet': 119000 },
  { week: 'W9', 'Jacks Casino': 163500, 'OneCasino': 248500, 'BetCity': 198500, 'Toto': 178500, 'Holland Casino': 149200, 'Unibet': 119200 },
  { week: 'W10', 'Jacks Casino': 164000, 'OneCasino': 249000, 'BetCity': 199000, 'Toto': 179000, 'Holland Casino': 149500, 'Unibet': 119500 },
  { week: 'W11', 'Jacks Casino': 164500, 'OneCasino': 249500, 'BetCity': 199500, 'Toto': 179500, 'Holland Casino': 149700, 'Unibet': 119700 },
  { week: 'W12', 'Jacks Casino': 165000, 'OneCasino': 250000, 'BetCity': 200000, 'Toto': 180000, 'Holland Casino': 150000, 'Unibet': 120000 },
];

// ===========================================
// ANOMALIES / ALERTS
// ===========================================

export const mockAnomalies = [
  {
    id: '1',
    type: 'emerging_threat',
    impact: 'high' as const,
    title: 'Kansino Rapid Growth',
    message: 'Kansino search volume up 12.3% MoM — significantly above market average',
    metric: 'Search Volume',
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'emerging_threat',
    impact: 'high' as const,
    title: 'BetMGM Aggressive Expansion',
    message: 'BetMGM showing 15.8% monthly growth — new market entrant scaling fast',
    metric: 'Search Volume',
    timestamp: new Date().toISOString(),
  },
  {
    id: '3',
    type: 'intent_shift',
    impact: 'info' as const,
    title: 'Problem Searches Rising',
    message: 'Problem-related searches up 8.4% this week — monitor for market-wide issues',
    metric: 'Intent Shift',
    timestamp: new Date().toISOString(),
  },
  {
    id: '4',
    type: 'competitive_pressure',
    impact: 'info' as const,
    title: 'Bet365 Acceleration',
    message: 'Bet365 growing 8.5% MoM — above their historical average',
    metric: 'Search Volume',
    timestamp: new Date().toISOString(),
  },
  {
    id: '5',
    type: 'market_opportunity',
    impact: 'info' as const,
    title: 'TAM Growing',
    message: 'Total addressable market up 6% (12W) — healthy market expansion',
    metric: 'TAM',
    timestamp: new Date().toISOString(),
  },
];

// ===========================================
// INTENT CATEGORIES
// ===========================================

export const mockIntentCategories = [
  { name: 'comparison', volume: 12500, percentage: 37.8, trend: 'stable', change: -3.2 },
  { name: 'product', volume: 18500, percentage: 55.9, trend: 'stable', change: 2.1 },
  { name: 'problem', volume: 4800, percentage: 14.5, trend: 'growing', change: 8.4 },
  { name: 'regulation', volume: 2200, percentage: 6.7, trend: 'growing', change: 2.1 },
  { name: 'review', volume: 6200, percentage: 18.7, trend: 'stable', change: -1.5 },
];
