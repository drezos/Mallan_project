// Mock data for MarketPulse dashboard
// This will be replaced with real API calls in Week 2

export const mockMetrics = {
  marketShareMomentum: 7.2,
  marketShareMomentumChange: 0.8,
  competitivePressure: 6,
  competitivePressureChange: -0.3,
  brandHeat: 8.2,
  brandHeatChange: 0.3,
  sentimentScore: 72,
  sentimentChange: 5,
  lastUpdated: new Date().toISOString(),
}

export const mockAlerts = [
  {
    id: '1',
    type: 'emerging_threat',
    severity: 'high' as const,
    title: 'Emerging Threat Detected',
    message: 'BetCity showing +180% growth vs baseline. Aggressive acquisition campaign likely.',
    competitor: 'BetCity',
    metric: '+180%',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  },
  {
    id: '2',
    type: 'intent_shift',
    severity: 'high' as const,
    title: 'Search Intent Shift',
    message: '"Casino withdrawal" searches up 85% WoW. Potential market liquidity concerns.',
    metric: '+85% WoW',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
  },
  {
    id: '3',
    type: 'competitive_pressure',
    severity: 'medium' as const,
    title: 'Competitive Pressure Rising',
    message: 'Market-wide acquisition intensity increased. Consider retention focus.',
    metric: '6.5/10',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
  },
  {
    id: '4',
    type: 'opportunity',
    severity: 'low' as const,
    title: 'Vertical Opportunity',
    message: 'Sports betting intent keywords trending +45%. Expansion window detected.',
    metric: '+45%',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
  },
]

export const mockCompetitors = [
  {
    id: '1',
    name: 'Toto',
    searchVolume: 28500,
    growth: 8,
    trend: 'stable' as const,
    status: 'normal' as const,
    marketShare: 18.5,
  },
  {
    id: '2',
    name: 'Unibet',
    searchVolume: 22300,
    growth: 12,
    trend: 'up' as const,
    status: 'watching' as const,
    marketShare: 14.2,
  },
  {
    id: '3',
    name: 'BetCity',
    searchVolume: 18900,
    growth: 180,
    trend: 'spike' as const,
    status: 'threat' as const,
    marketShare: 11.8,
  },
  {
    id: '4',
    name: 'Holland Casino',
    searchVolume: 35200,
    growth: -3,
    trend: 'down' as const,
    status: 'normal' as const,
    marketShare: 22.1,
  },
  {
    id: '5',
    name: 'Bet365',
    searchVolume: 15600,
    growth: 5,
    trend: 'stable' as const,
    status: 'normal' as const,
    marketShare: 9.8,
  },
]

// Your brand data
export const mockBrandData = {
  name: 'Jacks.nl',
  searchVolume: 12400,
  growth: 15,
  trend: 'up' as const,
  marketShare: 8.2,
}

// 12-week trend data for charts
export const mockTrendData = [
  { week: 'W1', yourBrand: 9200, market: 145000, date: '2024-09-16' },
  { week: 'W2', yourBrand: 9400, market: 148000, date: '2024-09-23' },
  { week: 'W3', yourBrand: 9100, market: 144000, date: '2024-09-30' },
  { week: 'W4', yourBrand: 9800, market: 152000, date: '2024-10-07' },
  { week: 'W5', yourBrand: 10200, market: 155000, date: '2024-10-14' },
  { week: 'W6', yourBrand: 10500, market: 158000, date: '2024-10-21' },
  { week: 'W7', yourBrand: 10100, market: 154000, date: '2024-10-28' },
  { week: 'W8', yourBrand: 10800, market: 160000, date: '2024-11-04' },
  { week: 'W9', yourBrand: 11200, market: 162000, date: '2024-11-11' },
  { week: 'W10', yourBrand: 11600, market: 165000, date: '2024-11-18' },
  { week: 'W11', yourBrand: 12000, market: 168000, date: '2024-11-25' },
  { week: 'W12', yourBrand: 12400, market: 172000, date: '2024-12-02' },
]

// Intent keyword breakdown
export const mockIntentData = {
  comparison: { volume: 45000, change: -5, keywords: ['best casino', 'top casino', 'casino comparison'] },
  problem: { volume: 8200, change: 85, keywords: ['casino withdrawal', 'casino complaint', 'casino slow'] },
  regulation: { volume: 2100, change: 150, keywords: ['casino license', 'responsible gambling', 'verification'] },
  product: { volume: 12400, change: -12, keywords: ['casino bonus', 'casino sports', 'casino slots'] },
  review: { volume: 6300, change: 0, keywords: ['casino review', 'casino reddit', 'casino safety'] },
}

// For the area chart - competitor comparison
export const mockCompetitorTrends = [
  { week: 'W1', jacks: 9.2, toto: 28.1, unibet: 21.5, betcity: 6.2, hollandCasino: 36.0 },
  { week: 'W2', jacks: 9.4, toto: 28.3, unibet: 21.8, betcity: 6.5, hollandCasino: 35.8 },
  { week: 'W3', jacks: 9.1, toto: 27.9, unibet: 21.2, betcity: 7.1, hollandCasino: 35.5 },
  { week: 'W4', jacks: 9.8, toto: 28.0, unibet: 21.9, betcity: 8.2, hollandCasino: 35.2 },
  { week: 'W5', jacks: 10.2, toto: 28.2, unibet: 22.1, betcity: 9.8, hollandCasino: 35.0 },
  { week: 'W6', jacks: 10.5, toto: 28.4, unibet: 22.0, betcity: 11.5, hollandCasino: 34.8 },
  { week: 'W7', jacks: 10.1, toto: 28.1, unibet: 21.8, betcity: 13.2, hollandCasino: 34.5 },
  { week: 'W8', jacks: 10.8, toto: 28.3, unibet: 22.2, betcity: 14.8, hollandCasino: 34.2 },
  { week: 'W9', jacks: 11.2, toto: 28.5, unibet: 22.4, betcity: 16.1, hollandCasino: 34.0 },
  { week: 'W10', jacks: 11.6, toto: 28.4, unibet: 22.3, betcity: 17.5, hollandCasino: 33.8 },
  { week: 'W11', jacks: 12.0, toto: 28.6, unibet: 22.5, betcity: 18.2, hollandCasino: 33.5 },
  { week: 'W12', jacks: 12.4, toto: 28.5, unibet: 22.3, betcity: 18.9, hollandCasino: 35.2 },
]
