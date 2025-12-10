// Mock data for MarketPulse dashboard
// Formulas and calculations as specified

// ===========================================
// CONSTANTS
// ===========================================
const INDUSTRY_CPC = 3.50 // €3.50 average CPC for iGaming Netherlands

// ===========================================
// YOUR BRAND DATA
// ===========================================
export const mockBrandData = {
  name: 'Jacks.nl',
  searchVolume: 12400,
  weeklyHistory: [9200, 9400, 9100, 9800, 10200, 10500, 10100, 10800, 11200, 11600, 12000, 12400],
  growth: 15, // Current week vs 4-week average
  trend: 'up' as const,
}

// ===========================================
// COMPETITORS (One primary keyword each)
// ===========================================
export const mockCompetitors = [
  {
    id: '1',
    name: 'Holland Casino',
    searchVolume: 35200,
    weeklyHistory: [36000, 35800, 35500, 35200, 35000, 34800, 34500, 34200, 34000, 33800, 33500, 35200],
    growth: -3, // Velocity: current vs 4-week avg
    status: 'normal' as const,
  },
  {
    id: '2',
    name: 'Toto',
    searchVolume: 28500,
    weeklyHistory: [26000, 26200, 26500, 27000, 27200, 27500, 27800, 28000, 28100, 28200, 28300, 28500],
    growth: 8,
    status: 'normal' as const,
  },
  {
    id: '3',
    name: 'Unibet',
    searchVolume: 22300,
    weeklyHistory: [19500, 19800, 20000, 20200, 20500, 20800, 21000, 21300, 21500, 21800, 22000, 22300],
    growth: 12,
    status: 'watching' as const,
  },
  {
    id: '4',
    name: 'BetCity',
    searchVolume: 18900,
    weeklyHistory: [6200, 6500, 7100, 8200, 9800, 11500, 13200, 14800, 16100, 17500, 18200, 18900],
    growth: 180, // Surge - anomaly
    status: 'threat' as const,
    driver: 'Welcome Bonus keywords',
  },
  {
    id: '5',
    name: 'Bet365',
    searchVolume: 15600,
    weeklyHistory: [14800, 14900, 15000, 15100, 15200, 15300, 15350, 15400, 15450, 15500, 15550, 15600],
    growth: 5,
    status: 'normal' as const,
  },
  {
    id: '6',
    name: 'Circus',
    searchVolume: 8200,
    weeklyHistory: [8500, 8400, 8350, 8300, 8280, 8260, 8240, 8230, 8220, 8210, 8205, 8200],
    growth: -2,
    status: 'normal' as const,
  },
  {
    id: '7',
    name: 'Kansino',
    searchVolume: 6800,
    weeklyHistory: [5200, 5400, 5600, 5800, 6000, 6200, 6300, 6400, 6500, 6600, 6700, 6800],
    growth: 18,
    status: 'watching' as const,
  },
  {
    id: '8',
    name: '711',
    searchVolume: 4500,
    weeklyHistory: [4200, 4250, 4300, 4320, 4350, 4380, 4400, 4420, 4450, 4470, 4490, 4500],
    growth: 3,
    status: 'normal' as const,
  },
  {
    id: '9',
    name: 'BetMGM',
    searchVolume: 3200,
    weeklyHistory: [2800, 2850, 2900, 2950, 3000, 3020, 3050, 3080, 3100, 3130, 3160, 3200],
    growth: 8,
    status: 'normal' as const,
  },
  {
    id: '10',
    name: 'LeoVegas',
    searchVolume: 2900,
    weeklyHistory: [3200, 3150, 3100, 3050, 3020, 3000, 2980, 2960, 2940, 2920, 2910, 2900],
    growth: -6,
    status: 'normal' as const,
  },
]

// ===========================================
// GENERIC MARKET (Non-branded searches)
// ===========================================
export const mockGenericMarket = {
  volume: 45000, // "best casino", "online casino NL", etc.
  weeklyHistory: [42000, 42500, 43000, 43200, 43500, 44000, 44200, 44500, 44700, 44800, 44900, 45000],
  growth: 3,
}

// ===========================================
// CALCULATED TOTALS
// ===========================================

// Total Addressable Market (TAM) = Your Brand + All Competitors + Generic
const totalCompetitorVolume = mockCompetitors.reduce((sum, c) => sum + c.searchVolume, 0)
export const mockTAM = {
  total: mockBrandData.searchVolume + totalCompetitorVolume + mockGenericMarket.volume,
  competitorVolume: totalCompetitorVolume,
  genericVolume: mockGenericMarket.volume,
  yourVolume: mockBrandData.searchVolume,
}

// Share of Search = (Your Brand / TAM) * 100
const currentSoS = (mockBrandData.searchVolume / mockTAM.total) * 100
const historicalSoS = mockBrandData.weeklyHistory.slice(0, -1).map((vol, i) => {
  // Calculate historical TAM for each week (simplified - using current competitor volumes)
  const historicalTAM = vol + totalCompetitorVolume + mockGenericMarket.weeklyHistory[i]
  return (vol / historicalTAM) * 100
})
const avgSoS = historicalSoS.reduce((a, b) => a + b, 0) / historicalSoS.length

export const mockShareOfSearch = {
  current: currentSoS,
  change: currentSoS - avgSoS, // vs 12-week (quarterly) average
  weeklyHistory: [...historicalSoS, currentSoS],
  quarterlyAvg: avgSoS,
}

// Estimated Market Value = Volume * CPC
export const mockMarketValue = {
  value: mockBrandData.searchVolume * INDUSTRY_CPC,
  cpc: INDUSTRY_CPC,
}

// ===========================================
// TRAFFIC QUALITY MIX
// ===========================================
export const mockTrafficMix = {
  brandShare: 60, // 60% of your traffic is branded
  genericShare: 40, // 40% is from generic searches
  brandVolume: Math.round(mockBrandData.searchVolume * 0.6),
  genericVolume: Math.round(mockBrandData.searchVolume * 0.4),
  genericTrend: -5, // Generic acquisition down 5%
  insight: 'Generic acquisition down -5% due to lower market demand.',
}

// ===========================================
// CHART DATA (12 weeks)
// ===========================================
export const mockChartData = [
  { week: 'W1', yourBrand: 9200, tam: 195000 },
  { week: 'W2', yourBrand: 9400, tam: 197000 },
  { week: 'W3', yourBrand: 9100, tam: 194000 },
  { week: 'W4', yourBrand: 9800, tam: 199000 },
  { week: 'W5', yourBrand: 10200, tam: 201000 },
  { week: 'W6', yourBrand: 10500, tam: 203000 },
  { week: 'W7', yourBrand: 10100, tam: 200000 },
  { week: 'W8', yourBrand: 10800, tam: 205000 },
  { week: 'W9', yourBrand: 11200, tam: 207000 },
  { week: 'W10', yourBrand: 11600, tam: 209000 },
  { week: 'W11', yourBrand: 12000, tam: 211000 },
  { week: 'W12', yourBrand: 12400, tam: 213500 },
]

// ===========================================
// VELOCITY THRESHOLDS (for heatmap)
// ===========================================
export const velocityThresholds = {
  stagnant: 5,   // < 5% = grey
  moderate: 20,  // 5-20% = orange
  surge: 20,     // > 20% = red
}

export function getVelocityStatus(growth: number): 'stagnant' | 'moderate' | 'surge' {
  const absGrowth = Math.abs(growth)
  if (absGrowth < velocityThresholds.stagnant) return 'stagnant'
  if (absGrowth < velocityThresholds.moderate) return 'moderate'
  return 'surge'
}

// ===========================================
// MARKET ANOMALIES (Smart Alerts)
// Trigger: Current Volume > 12-week avg + (2 * StdDev)
// ===========================================
export const mockAnomalies = [
  {
    id: '1',
    type: 'competitor_surge',
    impact: 'high' as const,
    title: 'BetCity Surge',
    message: '+180% velocity detected',
    driver: 'Welcome Bonus keywords',
    metric: '+180%',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'intent_shift',
    impact: 'high' as const,
    title: 'Withdrawal Searches Up',
    message: '"Casino withdrawal" +85% WoW',
    driver: 'Potential liquidity concerns',
    metric: '+85%',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'competitor_growth',
    impact: 'info' as const,
    title: 'Kansino Growing',
    message: '+18% velocity, approaching threshold',
    driver: 'New TV campaign',
    metric: '+18%',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'market_trend',
    impact: 'info' as const,
    title: 'TAM Expanding',
    message: 'Total market +9.5% over 12 weeks',
    driver: 'Seasonal uptick',
    metric: '+9.5%',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
]

// ===========================================
// HELPER: Calculate Share of Search for any entity
// ===========================================
export function calculateSoS(volume: number): number {
  return (volume / mockTAM.total) * 100
}
