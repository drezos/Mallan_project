// Mock data for MarketPulse dashboard
// Used as fallback when API is unavailable

// ===========================================
// BRAND DATA
// ===========================================

export const mockBrandData = {
  name: 'Jacks.nl',
  searchVolume: 2400,
  growth: 8.2,
  marketShare: 8.2,
};

// ===========================================
// SHARE OF SEARCH
// ===========================================

export const mockShareOfSearch = {
  current: 8.2,
  change: 0.3,
  weeklyHistory: [7.5, 7.8, 7.6, 7.9, 8.0, 7.8, 8.1, 8.0, 8.2, 8.1, 8.3, 8.2],
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
  { week: 'W1', tam: 28500, yourShare: 2100 },
  { week: 'W2', tam: 29200, yourShare: 2150 },
  { week: 'W3', tam: 28800, yourShare: 2080 },
  { week: 'W4', tam: 30100, yourShare: 2200 },
  { week: 'W5', tam: 29800, yourShare: 2180 },
  { week: 'W6', tam: 31200, yourShare: 2250 },
  { week: 'W7', tam: 30500, yourShare: 2220 },
  { week: 'W8', tam: 31800, yourShare: 2300 },
  { week: 'W9', tam: 32100, yourShare: 2350 },
  { week: 'W10', tam: 31500, yourShare: 2320 },
  { week: 'W11', tam: 32800, yourShare: 2380 },
  { week: 'W12', tam: 33080, yourShare: 2400 },
];

// ===========================================
// COMPETITORS
// ===========================================

export const mockCompetitors = [
  { id: 1, name: 'Toto', searchVolume: 8500, weeklyChange: 5.2, marketShare: 18.5, velocityTrend: 'up', riskLevel: 'medium' },
  { id: 2, name: 'Unibet', searchVolume: 7200, weeklyChange: -2.1, marketShare: 15.8, velocityTrend: 'down', riskLevel: 'low' },
  { id: 3, name: 'Bet365', searchVolume: 6800, weeklyChange: 8.5, marketShare: 14.9, velocityTrend: 'up', riskLevel: 'high' },
  { id: 4, name: 'BetCity', searchVolume: 5500, weeklyChange: 3.2, marketShare: 12.1, velocityTrend: 'up', riskLevel: 'medium' },
  { id: 5, name: 'Holland Casino', searchVolume: 4800, weeklyChange: 1.5, marketShare: 10.5, velocityTrend: 'stable', riskLevel: 'low' },
  { id: 6, name: 'Jacks.nl', searchVolume: 2400, weeklyChange: 8.2, marketShare: 8.2, velocityTrend: 'up', riskLevel: 'none' },
  { id: 7, name: 'Circus', searchVolume: 2100, weeklyChange: -1.8, marketShare: 4.6, velocityTrend: 'down', riskLevel: 'low' },
  { id: 8, name: '711', searchVolume: 1800, weeklyChange: 2.5, marketShare: 3.9, velocityTrend: 'up', riskLevel: 'low' },
  { id: 9, name: 'Kansino', searchVolume: 1500, weeklyChange: 12.3, marketShare: 3.3, velocityTrend: 'up', riskLevel: 'high' },
  { id: 10, name: 'BetMGM', searchVolume: 1200, weeklyChange: 15.8, marketShare: 2.6, velocityTrend: 'up', riskLevel: 'high' },
  { id: 11, name: 'LeoVegas', searchVolume: 1100, weeklyChange: -0.5, marketShare: 2.4, velocityTrend: 'stable', riskLevel: 'low' },
];

// Top rivals for competitive trend chart
export const topRivals = ['Toto', 'Unibet', 'Bet365', 'BetCity', 'Holland Casino'];

// ===========================================
// COMPETITIVE TREND DATA (12 weeks)
// ===========================================

export const mockCompetitiveTrendData = [
  { week: 'W1', 'Jacks.nl': 2100, 'Toto': 7800, 'Unibet': 7500, 'Bet365': 6200, 'BetCity': 5100 },
  { week: 'W2', 'Jacks.nl': 2150, 'Toto': 7900, 'Unibet': 7400, 'Bet365': 6300, 'BetCity': 5200 },
  { week: 'W3', 'Jacks.nl': 2080, 'Toto': 8000, 'Unibet': 7350, 'Bet365': 6400, 'BetCity': 5150 },
  { week: 'W4', 'Jacks.nl': 2200, 'Toto': 8100, 'Unibet': 7300, 'Bet365': 6500, 'BetCity': 5250 },
  { week: 'W5', 'Jacks.nl': 2180, 'Toto': 8150, 'Unibet': 7250, 'Bet365': 6550, 'BetCity': 5300 },
  { week: 'W6', 'Jacks.nl': 2250, 'Toto': 8200, 'Unibet': 7200, 'Bet365': 6600, 'BetCity': 5350 },
  { week: 'W7', 'Jacks.nl': 2220, 'Toto': 8250, 'Unibet': 7180, 'Bet365': 6650, 'BetCity': 5400 },
  { week: 'W8', 'Jacks.nl': 2300, 'Toto': 8300, 'Unibet': 7150, 'Bet365': 6700, 'BetCity': 5450 },
  { week: 'W9', 'Jacks.nl': 2350, 'Toto': 8400, 'Unibet': 7180, 'Bet365': 6750, 'BetCity': 5480 },
  { week: 'W10', 'Jacks.nl': 2320, 'Toto': 8450, 'Unibet': 7200, 'Bet365': 6780, 'BetCity': 5500 },
  { week: 'W11', 'Jacks.nl': 2380, 'Toto': 8480, 'Unibet': 7210, 'Bet365': 6800, 'BetCity': 5520 },
  { week: 'W12', 'Jacks.nl': 2400, 'Toto': 8500, 'Unibet': 7200, 'Bet365': 6800, 'BetCity': 5500 },
];

// ===========================================
// ANOMALIES / ALERTS
// ===========================================

export const mockAnomalies = [
  {
    id: '1',
    type: 'emerging_threat',
    severity: 'high' as const,
    title: 'Kansino Rapid Growth',
    message: 'Kansino search volume up 12.3% WoW — significantly above market average',
    metric: 'Search Volume',
    value: 1500,
    change: 12.3,
    timestamp: new Date().toISOString(),
  },
  {
    id: '2',
    type: 'emerging_threat',
    severity: 'high' as const,
    title: 'BetMGM Aggressive Expansion',
    message: 'BetMGM showing 15.8% weekly growth — new market entrant scaling fast',
    metric: 'Search Volume',
    value: 1200,
    change: 15.8,
    timestamp: new Date().toISOString(),
  },
  {
    id: '3',
    type: 'intent_shift',
    severity: 'medium' as const,
    title: 'Problem Searches Rising',
    message: 'Problem-related searches up 8.4% — monitor for market-wide issues',
    metric: 'Intent Shift',
    value: 4800,
    change: 8.4,
    timestamp: new Date().toISOString(),
  },
  {
    id: '4',
    type: 'competitive_pressure',
    severity: 'medium' as const,
    title: 'Bet365 Acceleration',
    message: 'Bet365 growing 8.5% WoW — above their historical average',
    metric: 'Search Volume',
    value: 6800,
    change: 8.5,
    timestamp: new Date().toISOString(),
  },
  {
    id: '5',
    type: 'market_opportunity',
    severity: 'low' as const,
    title: 'TAM Growing',
    message: 'Total addressable market up 6% — healthy market expansion',
    metric: 'TAM',
    value: 33080,
    change: 6,
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
