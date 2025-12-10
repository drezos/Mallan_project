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
// With full weekly history for trend chart
// ===========================================
export const mockCompetitors = [
  {
    id: '1',
    name: 'Holland Casino',
    searchVolume: 35200,
    weeklyHistory: [36000, 35800, 35500, 35200, 35000, 34800, 34500, 34200, 34000, 33800, 35000, 35200],
    growth: -3,
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
    growth: 180,
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
  volume: 45000,
  weeklyHistory: [42000, 42500, 43000, 43200, 43500, 44000, 44200, 44500, 44700, 44800, 44900, 45000],
  growth: 3,
}

// ===========================================
// CALCULATED TOTALS
// ===========================================
const totalCompetitorVolume = mockCompetitors.reduce((sum, c) => sum + c.searchVolume, 0)

export const mockTAM = {
  total: mockBrandData.searchVolume + totalCompetitorVolume + mockGenericMarket.volume,
  competitorVolume: totalCompetitorVolume,
  genericVolume: mockGenericMarket.volume,
  yourVolume: mockBrandData.searchVolume,
}

// ===========================================
// MARKET RANK CALCULATION
// Formula: Sort all entities by volume, find position
// ===========================================
function calculateMarketRank() {
  const allEntities = [
    { name: mockBrandData.name, volume: mockBrandData.searchVolume, isYou: true },
    ...mockCompetitors.map(c => ({ name: c.name, volume: c.searchVolume, isYou: false }))
  ]
  
  // Sort by volume descending
  const sorted = [...allEntities].sort((a, b) => b.volume - a.volume)
  const currentRank = sorted.findIndex(e => e.isYou) + 1
  
  // Calculate previous week rank
  const prevWeekEntities = [
    { name: mockBrandData.name, volume: mockBrandData.weeklyHistory[10], isYou: true }, // Week 11
    ...mockCompetitors.map(c => ({ name: c.name, volume: c.weeklyHistory[10], isYou: false }))
  ]
  const prevSorted = [...prevWeekEntities].sort((a, b) => b.volume - a.volume)
  const previousRank = prevSorted.findIndex(e => e.isYou) + 1
  
  const rankChange = previousRank - currentRank // Positive = moved up
  
  return {
    current: currentRank,
    previous: previousRank,
    change: rankChange,
    totalCompetitors: mockCompetitors.length + 1,
  }
}

export const mockMarketRank = calculateMarketRank()

// ===========================================
// SHARE OF SEARCH CALCULATION
// ===========================================
const currentSoS = (mockBrandData.searchVolume / mockTAM.total) * 100
const historicalSoS = mockBrandData.weeklyHistory.slice(0, -1).map((vol, i) => {
  const historicalTAM = vol + totalCompetitorVolume + mockGenericMarket.weeklyHistory[i]
  return (vol / historicalTAM) * 100
})
const avgSoS = historicalSoS.reduce((a, b) => a + b, 0) / historicalSoS.length

export const mockShareOfSearch = {
  current: currentSoS,
  change: currentSoS - avgSoS,
  weeklyHistory: [...historicalSoS, currentSoS],
  quarterlyAvg: avgSoS,
}

// ===========================================
// ESTIMATED MARKET VALUE
// ===========================================
export const mockMarketValue = {
  value: mockBrandData.searchVolume * INDUSTRY_CPC,
  cpc: INDUSTRY_CPC,
}

// ===========================================
// TRAFFIC QUALITY MIX (for Zone 2 left panel)
// ===========================================
export const mockTrafficMix = {
  brandShare: 60,
  genericShare: 40,
  brandVolume: Math.round(mockBrandData.searchVolume * 0.6),
  genericVolume: Math.round(mockBrandData.searchVolume * 0.4),
  genericTrend: -5,
  insight: 'Generic acquisition down -5% due to lower market demand.',
}

// ===========================================
// MARKET OPPORTUNITY DATA (Stacked Bar)
// ===========================================
export const mockMarketOpportunity = {
  yourBrand: mockBrandData.searchVolume,
  competitors: totalCompetitorVolume, // "Warm Leads"
  generic: mockGenericMarket.volume,  // "Undecided"
  total: mockTAM.total,
}

// ===========================================
// TAM TREND DATA (Dual Axis Chart - Zone 2 Right)
// ===========================================
export const mockTAMTrendData = Array.from({ length: 12 }, (_, i) => {
  const brandVol = mockBrandData.weeklyHistory[i]
  const competitorVol = mockCompetitors.reduce((sum, c) => sum + c.weeklyHistory[i], 0)
  const genericVol = mockGenericMarket.weeklyHistory[i]
  const totalTAM = brandVol + competitorVol + genericVol
  
  return {
    week: `W${i + 1}`,
    yourBrand: brandVol,
    tam: totalTAM,
  }
})

// Calculate TAM growth
const firstTAM = mockTAMTrendData[0].tam
const lastTAM = mockTAMTrendData[11].tam
export const mockTAMGrowth = ((lastTAM - firstTAM) / firstTAM * 100)

// ===========================================
// COMPETITIVE TREND DATA (Zone 3 Right - Multi-line)
// Your brand vs Top 10 competitors over 12 weeks
// ===========================================
export const mockCompetitiveTrendData = Array.from({ length: 12 }, (_, weekIndex) => {
  const dataPoint: Record<string, number | string> = {
    week: `W${weekIndex + 1}`,
    'Jacks.nl': mockBrandData.weeklyHistory[weekIndex],
  }
  
  mockCompetitors.forEach(comp => {
    dataPoint[comp.name] = comp.weeklyHistory[weekIndex]
  })
  
  return dataPoint
})

// Get top 3 closest rivals (by current volume closest to yours)
export const topRivals = [...mockCompetitors]
  .sort((a, b) => Math.abs(a.searchVolume - mockBrandData.searchVolume) - Math.abs(b.searchVolume - mockBrandData.searchVolume))
  .slice(0, 3)
  .map(c => c.name)

// ===========================================
// VELOCITY THRESHOLDS (for heatmap)
// ===========================================
export const velocityThresholds = {
  stagnant: 5,
  moderate: 20,
  surge: 20,
}

export function getVelocityStatus(growth: number): 'stagnant' | 'moderate' | 'surge' {
  const absGrowth = Math.abs(growth)
  if (absGrowth < velocityThresholds.stagnant) return 'stagnant'
  if (absGrowth < velocityThresholds.moderate) return 'moderate'
  return 'surge'
}

// ===========================================
// MARKET ANOMALIES (Smart Alerts)
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
