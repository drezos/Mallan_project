// Mock data for MarketPulse dashboard
// This will be replaced with real API calls in Week 2

// ===========================================
// MARKET OPPORTUNITY DATA (Clean Buckets)
// ===========================================

// Your brand - aggregate all variations
export const mockBrandData = {
  name: 'Jacks.nl',
  searchVolume: 12400, // "jacks.nl" + "jacks casino" + "jack casino" combined
  growth: 15, // % change WoW
  trend: 'up' as const,
  weeklyHistory: [9200, 9400, 9100, 9800, 10200, 10500, 10100, 10800, 11200, 11600, 12000, 12400], // 12 weeks
}

// Competitors - ONE primary keyword each (no double counting)
export const mockCompetitors = [
  {
    id: '1',
    name: 'Holland Casino',
    searchVolume: 35200, // Primary keyword only
    growth: -3,
    trend: 'down' as const,
    status: 'normal' as const,
  },
  {
    id: '2',
    name: 'Toto',
    searchVolume: 28500,
    growth: 8,
    trend: 'stable' as const,
    status: 'normal' as const,
  },
  {
    id: '3',
    name: 'Unibet',
    searchVolume: 22300,
    growth: 12,
    trend: 'up' as const,
    status: 'watching' as const,
  },
  {
    id: '4',
    name: 'BetCity',
    searchVolume: 18900,
    growth: 180, // Anomaly - this triggers alert
    trend: 'spike' as const,
    status: 'threat' as const,
    driver: 'Welcome Bonus keywords', // Attribution for alert
  },
  {
    id: '5',
    name: 'Bet365',
    searchVolume: 15600,
    growth: 5,
    trend: 'stable' as const,
    status: 'normal' as const,
  },
]

// Generic market - non-branded intent keywords
export const mockGenericMarket = {
  totalVolume: 85000, // "best casino", "casino bonus", "online casino NL" etc.
  growth: 3, // % change WoW
  trend: 'stable' as const,
  weeklyHistory: [78000, 79500, 77000, 81000, 82000, 83500, 82000, 84000, 84500, 85000, 84000, 85000],
}

// Calculated totals
export const mockMarketTotals = {
  yourBrand: 12400,
  competitorBrands: 120500, // Sum of all competitor volumes (warm opportunities)
  genericMarket: 85000, // Cold opportunities
  totalAddressable: 217900, // Sum of all three
  yourShareOfTotal: 5.7, // 12400 / 217900
  marketGrowth: 5, // Overall market trend
}

// ===========================================
// KPI CARD METRICS
// ===========================================

export const mockKPIMetrics = {
  // Card 1: Share of Search
  shareOfSearch: {
    value: 5.7, // Your brand / total addressable
    change: 0.8, // vs 12-week average
    trend: 'up' as const,
    weeklyHistory: [4.2, 4.3, 4.3, 4.5, 4.7, 4.8, 4.7, 4.9, 5.1, 5.3, 5.5, 5.7],
  },
  
  // Card 2: Market Opportunity
  marketOpportunity: {
    genericVolume: 85000, // The addressable pool
    competitorVolume: 120500, // Warm leads (already gamblers)
    yourBrandVolume: 12400, // Your locked-in demand
    brandToGenericRatio: 6.9, // For every 1 loyal searcher, 6.9 are up for grabs
  },
  
  // Card 3: Total Addressable Market
  totalMarket: {
    volume: 217900,
    growth: 5, // % WoW
    trend: 'up' as const,
    isHealthy: true, // Market is growing
  },
  
  // Card 4: Market Trend Context (Panic Killer)
  marketContext: {
    yourGrowth: 15,
    marketGrowth: 5,
    outperforming: true, // You're growing faster than market
    delta: 10, // You're +10% ahead of market growth
  },
}

// ===========================================
// CHART DATA (Dual Y-Axis Ready)
// ===========================================

export const mockTrendData = [
  { week: 'W1', yourBrand: 9200, genericMarket: 78000, date: '2024-09-16' },
  { week: 'W2', yourBrand: 9400, genericMarket: 79500, date: '2024-09-23' },
  { week: 'W3', yourBrand: 9100, genericMarket: 77000, date: '2024-09-30' },
  { week: 'W4', yourBrand: 9800, genericMarket: 81000, date: '2024-10-07' },
  { week: 'W5', yourBrand: 10200, genericMarket: 82000, date: '2024-10-14' },
  { week: 'W6', yourBrand: 10500, genericMarket: 83500, date: '2024-10-21' },
  { week: 'W7', yourBrand: 10100, genericMarket: 82000, date: '2024-10-28' },
  { week: 'W8', yourBrand: 10800, genericMarket: 84000, date: '2024-11-04' },
  { week: 'W9', yourBrand: 11200, genericMarket: 84500, date: '2024-11-11' },
  { week: 'W10', yourBrand: 11600, genericMarket: 85000, date: '2024-11-18' },
  { week: 'W11', yourBrand: 12000, genericMarket: 84000, date: '2024-11-25' },
  { week: 'W12', yourBrand: 12400, genericMarket: 85000, date: '2024-12-02' },
]

// ===========================================
// ALERTS (Renamed to Market Anomalies)
// ===========================================

export const mockAnomalies = [
  // HIGH IMPACT - Volume >5k AND growth >20%
  {
    id: '1',
    type: 'competitor_surge',
    impact: 'high' as const,
    title: 'BetCity Surge Detected',
    message: 'BetCity +180% growth with 18.9K volume.',
    driver: 'Welcome Bonus keywords', // Attribution
    competitor: 'BetCity',
    metric: '+180%',
    volume: 18900,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actionable: true,
  },
  {
    id: '2',
    type: 'intent_shift',
    impact: 'high' as const,
    title: 'Withdrawal Searches Spiking',
    message: '"Casino withdrawal" +85% WoW.',
    driver: 'Potential liquidity concerns in market',
    metric: '+85%',
    volume: 8200,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    actionable: true,
  },
  // FOR INFO - Lower volume or smaller growth
  {
    id: '3',
    type: 'competitor_growth',
    impact: 'info' as const,
    title: 'Unibet Steady Growth',
    message: 'Unibet +12% growth, tracking above market average (+5%).',
    driver: 'Brand campaign activity',
    competitor: 'Unibet',
    metric: '+12%',
    volume: 22300,
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    actionable: false,
  },
  {
    id: '4',
    type: 'opportunity',
    impact: 'info' as const,
    title: 'Sports Betting Interest Rising',
    message: 'Sports betting keywords +45% WoW.',
    driver: 'Seasonal trend (football season)',
    metric: '+45%',
    volume: 12000,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    actionable: false,
  },
]

// Market average growth for competitor context
export const marketAverageGrowth = 5 // 5% is the baseline
