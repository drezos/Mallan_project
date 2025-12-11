// Mock data for MarketPulse dashboard
// This will be replaced with real API calls once connected

// ===========================================
// HELPER FUNCTIONS (exported for components)
// ===========================================

export function getVelocityStatus(weeklyChange: number): 'accelerating' | 'stable' | 'decelerating' {
  if (weeklyChange > 10) return 'accelerating';
  if (weeklyChange < -5) return 'decelerating';
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
  name: 'Jacks.nl',
  searchVolume: 14800,
  growth: 12.5,
  marketShare: 8.2,
};

// ===========================================
// SHARE OF SEARCH
// ===========================================
export const mockShareOfSearch = {
  current: 8.2,
  change: 0.8,
  weeklyHistory: [7.1, 7.3, 7.2, 7.5, 7.4, 7.6, 7.8, 7.5, 7.9, 8.0, 7.8, 8.2],
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
// MARKET OPPORTUNITY (Zone 2 Left Panel)
// ===========================================
export const mockMarketOpportunity = {
  yourBrand: 14800,
  competitors: 125400,
  generic: 45200,
  total: 185400,
};

// ===========================================
// TAM TREND DATA (Zone 2 Right Panel)
// ===========================================
export const mockTAMTrendData = [
  { week: 'W1', yourBrand: 12100, tam: 165000 },
  { week: 'W2', yourBrand: 12400, tam: 168000 },
  { week: 'W3', yourBrand: 12800, tam: 170500 },
  { week: 'W4', yourBrand: 13100, tam: 172000 },
  { week: 'W5', yourBrand: 12900, tam: 169000 },
  { week: 'W6', yourBrand: 13400, tam: 174500 },
  { week: 'W7', yourBrand: 13700, tam: 176000 },
  { week: 'W8', yourBrand: 14000, tam: 178500 },
  { week: 'W9', yourBrand: 13600, tam: 175000 },
  { week: 'W10', yourBrand: 14200, tam: 180000 },
  { week: 'W11', yourBrand: 14500, tam: 182500 },
  { week: 'W12', yourBrand: 14800, tam: 185400 },
];

export const mockTAM = {
  total: 185400,
  growth: 12.4,
};

export const mockTAMGrowth = 12.4;

// ===========================================
// COMPETITORS DATA (Zone 3)
// ===========================================
export const mockCompetitors = [
  {
    id: 1,
    name: 'Toto',
    searchVolume: 45200,
    weeklyChange: 5.2,
    marketShare: 24.4,
    velocityTrend: 'stable',
    riskLevel: 'medium',
  },
  {
    id: 2,
    name: 'Holland Casino',
    searchVolume: 38500,
    weeklyChange: -2.1,
    marketShare: 20.8,
    velocityTrend: 'decelerating',
    riskLevel: 'low',
  },
  {
    id: 3,
    name: 'Unibet',
    searchVolume: 22100,
    weeklyChange: 18.5,
    marketShare: 11.9,
    velocityTrend: 'accelerating',
    riskLevel: 'high',
  },
  {
    id: 4,
    name: 'Bet365',
    searchVolume: 18900,
    weeklyChange: 3.2,
    marketShare: 10.2,
    velocityTrend: 'stable',
    riskLevel: 'medium',
  },
  {
    id: 5,
    name: 'BetCity',
    searchVolume: 15200,
    weeklyChange: 8.7,
    marketShare: 8.2,
    velocityTrend: 'accelerating',
    riskLevel: 'medium',
  },
  {
    id: 6,
    name: 'Circus',
    searchVolume: 9800,
    weeklyChange: -5.3,
    marketShare: 5.3,
    velocityTrend: 'decelerating',
    riskLevel: 'low',
  },
  {
    id: 7,
    name: 'Kansino',
    searchVolume: 8200,
    weeklyChange: 25.4,
    marketShare: 4.4,
    velocityTrend: 'accelerating',
    riskLevel: 'high',
  },
  {
    id: 8,
    name: '711',
    searchVolume: 6500,
    weeklyChange: 1.2,
    marketShare: 3.5,
    velocityTrend: 'stable',
    riskLevel: 'low',
  },
  {
    id: 9,
    name: 'BetMGM',
    searchVolume: 4200,
    weeklyChange: 42.1,
    marketShare: 2.3,
    velocityTrend: 'accelerating',
    riskLevel: 'high',
  },
  {
    id: 10,
    name: 'LeoVegas',
    searchVolume: 3800,
    weeklyChange: -8.2,
    marketShare: 2.1,
    velocityTrend: 'decelerating',
    riskLevel: 'low',
  },
];

// ===========================================
// COMPETITIVE TREND DATA (12-week history)
// ===========================================
export const mockCompetitiveTrendData = [
  { week: 'W1', 'Jacks.nl': 12100, 'Toto': 42800, 'Holland Casino': 39200, 'Unibet': 18600 },
  { week: 'W2', 'Jacks.nl': 12400, 'Toto': 43100, 'Holland Casino': 39500, 'Unibet': 18900 },
  { week: 'W3', 'Jacks.nl': 12800, 'Toto': 43500, 'Holland Casino': 39100, 'Unibet': 19200 },
  { week: 'W4', 'Jacks.nl': 13100, 'Toto': 43800, 'Holland Casino': 38800, 'Unibet': 19600 },
  { week: 'W5', 'Jacks.nl': 12900, 'Toto': 43200, 'Holland Casino': 39000, 'Unibet': 19400 },
  { week: 'W6', 'Jacks.nl': 13400, 'Toto': 44100, 'Holland Casino': 38600, 'Unibet': 20100 },
  { week: 'W7', 'Jacks.nl': 13700, 'Toto': 44400, 'Holland Casino': 38900, 'Unibet': 20500 },
  { week: 'W8', 'Jacks.nl': 14000, 'Toto': 44700, 'Holland Casino': 38400, 'Unibet': 20900 },
  { week: 'W9', 'Jacks.nl': 13600, 'Toto': 44200, 'Holland Casino': 38700, 'Unibet': 20600 },
  { week: 'W10', 'Jacks.nl': 14200, 'Toto': 44900, 'Holland Casino': 38200, 'Unibet': 21300 },
  { week: 'W11', 'Jacks.nl': 14500, 'Toto': 45000, 'Holland Casino': 38600, 'Unibet': 21700 },
  { week: 'W12', 'Jacks.nl': 14800, 'Toto': 45200, 'Holland Casino': 38500, 'Unibet': 22100 },
];

// Top rivals for the trend chart
export const topRivals = ['Toto', 'Holland Casino', 'Unibet'];

// ===========================================
// ANOMALIES / ALERTS
// ===========================================
export const mockAnomalies = [
  {
    id: 1,
    type: 'emerging_threat',
    severity: 'high',
    title: 'BetMGM Accelerating',
    message: 'BetMGM search volume up 42% WoW — fastest growing competitor',
    metric: 'search_volume',
    value: 4200,
    change: 42.1,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    type: 'competitor_surge',
    severity: 'high',
    title: 'Kansino Breaking Out',
    message: 'Kansino volume +25% WoW, now threatening your position',
    metric: 'search_volume',
    value: 8200,
    change: 25.4,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    type: 'market_shift',
    severity: 'medium',
    title: 'Unibet Momentum',
    message: 'Unibet maintaining 18%+ growth for 3 consecutive weeks',
    metric: 'velocity',
    value: 22100,
    change: 18.5,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    type: 'opportunity',
    severity: 'low',
    title: 'Holland Casino Declining',
    message: 'Market leader losing ground — opportunity to capture share',
    metric: 'search_volume',
    value: 38500,
    change: -2.1,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ===========================================
// INTENT KEYWORDS (for future use)
// ===========================================
export const mockIntentKeywords = {
  comparison: [
    { keyword: 'beste online casino', volume: 12400, change: -5.2 },
    { keyword: 'casino vergelijken', volume: 8200, change: 3.1 },
    { keyword: 'top casino nederland', volume: 6800, change: 8.5 },
  ],
  problem: [
    { keyword: 'casino uitbetaling', volume: 4200, change: 15.2 },
    { keyword: 'casino klacht', volume: 1800, change: 22.4 },
    { keyword: 'casino problemen', volume: 2100, change: 8.7 },
  ],
  regulation: [
    { keyword: 'casino vergunning', volume: 890, change: 45.2 },
    { keyword: 'legaal gokken nederland', volume: 3200, change: 12.1 },
  ],
  product: [
    { keyword: 'casino bonus', volume: 9800, change: -8.3 },
    { keyword: 'casino slots', volume: 7200, change: 2.1 },
    { keyword: 'live casino', volume: 5400, change: 15.8 },
  ],
};
