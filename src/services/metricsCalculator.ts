/**
 * Metrics Calculator
 * 
 * Implements the 5 proprietary formulas for MarketPulse:
 * 1. Market Share Momentum Score (0-10)
 * 2. Emerging Competitor Alert
 * 3. Search Intent Shift Index
 * 4. Competitive Pressure Index (0-10)
 * 5. Player Sentiment Velocity
 */

import { BrandSearchVolume } from './dataForSeo';
import { brands, intentKeywords, getOwnBrand } from '../config/brandKeywords';

// =============================================================================
// TYPES
// =============================================================================

export interface MarketShareMomentum {
  score: number;              // 0-10
  yourGrowth: number;         // % change
  marketGrowth: number;       // % change
  confidence: number;         // 0-1
  interpretation: string;
  trend: 'gaining' | 'losing' | 'stable';
}

export interface EmergingCompetitorAlert {
  brandId: string;
  brandName: string;
  currentGrowth: number;      // % growth
  baseline: number;           // historical average
  threshold: number;          // baseline + 2σ
  anomalyScore: number;       // 0-100
  severity: 'critical' | 'high' | 'medium' | 'low' | 'none';
  message: string;
}

export interface IntentShiftIndex {
  category: string;
  displayName: string;
  currentVolume: number;
  previousVolume: number;
  changePercent: number;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'none';
  interpretation: string;
}

export interface CompetitivePressureIndex {
  score: number;              // 0-10
  avgCompetitorGrowth: number;
  growthVolatility: number;
  interpretation: string;
  intensity: 'extreme' | 'high' | 'medium' | 'low';
}

export interface PlayerSentimentVelocity {
  score: number;              // -100 to +100 (negative = deteriorating)
  positiveVolume: number;
  negativeVolume: number;
  sentimentRatio: number;
  previousRatio: number;
  velocity: number;           // % change in ratio
  trend: 'improving' | 'deteriorating' | 'stable';
  interpretation: string;
}

export interface CalculatedMetrics {
  marketShareMomentum: MarketShareMomentum;
  emergingCompetitorAlerts: EmergingCompetitorAlert[];
  intentShiftIndex: IntentShiftIndex[];
  competitivePressureIndex: CompetitivePressureIndex;
  playerSentimentVelocity: PlayerSentimentVelocity;
  calculatedAt: Date;
}

// =============================================================================
// FORMULA 1: MARKET SHARE MOMENTUM SCORE (0-10)
// =============================================================================

export function calculateMarketShareMomentum(
  currentData: BrandSearchVolume[],
  previousData: BrandSearchVolume[]
): MarketShareMomentum {
  const ownBrand = getOwnBrand();
  if (!ownBrand) {
    return {
      score: 5,
      yourGrowth: 0,
      marketGrowth: 0,
      confidence: 0,
      interpretation: 'No own brand configured',
      trend: 'stable'
    };
  }

  // Find your brand's data
  const yourCurrent = currentData.find(b => b.brandId === ownBrand.id);
  const yourPrevious = previousData.find(b => b.brandId === ownBrand.id);

  // Calculate market totals
  const currentMarketTotal = currentData.reduce((sum, b) => sum + b.totalVolume, 0);
  const previousMarketTotal = previousData.reduce((sum, b) => sum + b.totalVolume, 0);

  // Calculate growth rates
  const yourGrowth = yourPrevious && yourPrevious.totalVolume > 0
    ? ((yourCurrent?.totalVolume || 0) - yourPrevious.totalVolume) / yourPrevious.totalVolume * 100
    : 0;

  const marketGrowth = previousMarketTotal > 0
    ? (currentMarketTotal - previousMarketTotal) / previousMarketTotal * 100
    : 0;

  // Calculate confidence based on volume
  const minVolumeThreshold = 1000;
  const confidence = Math.min(1, (yourCurrent?.totalVolume || 0) / minVolumeThreshold);

  // Calculate raw momentum
  let rawMomentum = 5; // neutral
  if (marketGrowth !== 0) {
    rawMomentum = ((yourGrowth - marketGrowth) / Math.abs(marketGrowth)) * 5 + 5;
  } else if (yourGrowth > 0) {
    rawMomentum = 7.5;
  } else if (yourGrowth < 0) {
    rawMomentum = 2.5;
  }

  // Apply confidence and clamp to 0-10
  const score = Math.max(0, Math.min(10, rawMomentum * confidence + 5 * (1 - confidence)));

  // Determine trend
  let trend: 'gaining' | 'losing' | 'stable' = 'stable';
  if (yourGrowth > marketGrowth + 2) trend = 'gaining';
  else if (yourGrowth < marketGrowth - 2) trend = 'losing';

  // Generate interpretation
  let interpretation = '';
  if (score >= 8) interpretation = 'Strongly outperforming market. Scale marketing spend.';
  else if (score >= 6) interpretation = 'Gaining ground. Maintain current strategy.';
  else if (score >= 4) interpretation = 'Tracking with market. Look for differentiation.';
  else if (score >= 2) interpretation = 'Losing ground. Review competitive positioning.';
  else interpretation = 'Significantly underperforming. Urgent strategy review needed.';

  return {
    score: Math.round(score * 10) / 10,
    yourGrowth: Math.round(yourGrowth * 10) / 10,
    marketGrowth: Math.round(marketGrowth * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    interpretation,
    trend
  };
}

// =============================================================================
// FORMULA 2: EMERGING COMPETITOR ALERT
// =============================================================================

export function calculateEmergingCompetitorAlerts(
  currentData: BrandSearchVolume[],
  historicalData: BrandSearchVolume[][] // Array of weekly/monthly snapshots
): EmergingCompetitorAlert[] {
  const ownBrand = getOwnBrand();
  const competitors = currentData.filter(b => b.brandId !== ownBrand?.id);

  return competitors.map(competitor => {
    // Calculate historical growth rates
    const growthRates: number[] = [];
    
    for (let i = 1; i < historicalData.length; i++) {
      const prev = historicalData[i - 1].find(b => b.brandId === competitor.brandId);
      const curr = historicalData[i].find(b => b.brandId === competitor.brandId);
      
      if (prev && curr && prev.totalVolume > 0) {
        const growth = (curr.totalVolume - prev.totalVolume) / prev.totalVolume * 100;
        growthRates.push(growth);
      }
    }

    // Calculate baseline and standard deviation
    const baseline = growthRates.length > 0
      ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
      : 5; // Default 5% baseline

    const variance = growthRates.length > 1
      ? growthRates.reduce((sum, g) => sum + Math.pow(g - baseline, 2), 0) / (growthRates.length - 1)
      : 25; // Default variance

    const stdDev = Math.sqrt(variance);
    const threshold = baseline + 2 * stdDev;

    // Calculate current growth
    const previousTotal = historicalData.length > 0
      ? historicalData[historicalData.length - 1].find(b => b.brandId === competitor.brandId)?.totalVolume || 0
      : 0;

    const currentGrowth = previousTotal > 0
      ? (competitor.totalVolume - previousTotal) / previousTotal * 100
      : 0;

    // Calculate anomaly score (0-100)
    let anomalyScore = 0;
    if (currentGrowth > threshold && threshold > 0) {
      anomalyScore = Math.min(100, ((currentGrowth - threshold) / threshold) * 100);
    }

    // Determine severity
    let severity: 'critical' | 'high' | 'medium' | 'low' | 'none' = 'none';
    if (anomalyScore >= 75) severity = 'critical';
    else if (anomalyScore >= 50) severity = 'high';
    else if (anomalyScore >= 25) severity = 'medium';
    else if (anomalyScore > 0) severity = 'low';

    // Generate message
    let message = `${competitor.brandName}: Normal growth pattern`;
    if (severity === 'critical') {
      message = `🚨 CRITICAL: ${competitor.brandName} growing ${Math.round(currentGrowth)}% - significantly above normal!`;
    } else if (severity === 'high') {
      message = `⚠️ HIGH: ${competitor.brandName} accelerating at ${Math.round(currentGrowth)}% growth`;
    } else if (severity === 'medium') {
      message = `📈 WATCH: ${competitor.brandName} showing elevated growth (${Math.round(currentGrowth)}%)`;
    }

    return {
      brandId: competitor.brandId,
      brandName: competitor.brandName,
      currentGrowth: Math.round(currentGrowth * 10) / 10,
      baseline: Math.round(baseline * 10) / 10,
      threshold: Math.round(threshold * 10) / 10,
      anomalyScore: Math.round(anomalyScore),
      severity,
      message
    };
  }).sort((a, b) => b.anomalyScore - a.anomalyScore); // Sort by threat level
}

// =============================================================================
// FORMULA 3: SEARCH INTENT SHIFT INDEX
// =============================================================================

export function calculateIntentShiftIndex(
  currentIntentVolumes: Map<string, number>,
  previousIntentVolumes: Map<string, number>
): IntentShiftIndex[] {
  return intentKeywords.map(category => {
    // Sum volumes for all keywords in this category
    let currentVolume = 0;
    let previousVolume = 0;

    category.keywords.forEach(keyword => {
      currentVolume += currentIntentVolumes.get(keyword.toLowerCase()) || 0;
      previousVolume += previousIntentVolumes.get(keyword.toLowerCase()) || 0;
    });

    // Calculate change
    const changePercent = previousVolume > 0
      ? ((currentVolume - previousVolume) / previousVolume) * 100
      : 0;

    // Determine severity based on category and change
    let severity: 'critical' | 'high' | 'medium' | 'low' | 'none' = 'none';
    
    // Problem and regulation categories get higher severity for increases
    if (category.category === 'problem' || category.category === 'regulation') {
      if (changePercent > 100) severity = 'critical';
      else if (changePercent > 50) severity = 'high';
      else if (changePercent > 25) severity = 'medium';
      else if (changePercent > 10) severity = 'low';
    } else {
      // Other categories use absolute change
      if (Math.abs(changePercent) > 50) severity = 'high';
      else if (Math.abs(changePercent) > 25) severity = 'medium';
      else if (Math.abs(changePercent) > 10) severity = 'low';
    }

    // Generate interpretation
    let interpretation = '';
    switch (category.category) {
      case 'comparison':
        if (changePercent > 20) interpretation = 'Increased shopping behavior - good time for acquisition campaigns';
        else if (changePercent < -20) interpretation = 'Reduced comparison searches - market may be consolidating';
        else interpretation = 'Stable comparison activity';
        break;
      case 'problem':
        if (changePercent > 30) interpretation = '⚠️ Market stress signal - players experiencing issues';
        else if (changePercent > 10) interpretation = 'Slight increase in problem searches - monitor closely';
        else interpretation = 'Problem searches at normal levels';
        break;
      case 'regulation':
        if (changePercent > 50) interpretation = '🚨 Regulatory attention spike - possible incoming changes';
        else if (changePercent > 20) interpretation = 'Increased regulatory interest - stay compliant';
        else interpretation = 'Normal regulatory search activity';
        break;
      case 'product':
        if (changePercent > 20) interpretation = 'High product interest - opportunity for feature promotion';
        else if (changePercent < -20) interpretation = 'Declining product interest - review offerings';
        else interpretation = 'Stable product interest';
        break;
      case 'review':
        if (changePercent > 20) interpretation = 'Players doing research - ensure positive reviews visible';
        else interpretation = 'Normal review activity';
        break;
    }

    return {
      category: category.category,
      displayName: category.displayName,
      currentVolume,
      previousVolume,
      changePercent: Math.round(changePercent * 10) / 10,
      severity,
      interpretation
    };
  });
}

// =============================================================================
// FORMULA 4: COMPETITIVE PRESSURE INDEX (0-10)
// =============================================================================

export function calculateCompetitivePressureIndex(
  currentData: BrandSearchVolume[],
  previousData: BrandSearchVolume[]
): CompetitivePressureIndex {
  const ownBrand = getOwnBrand();
  const competitors = currentData.filter(b => b.brandId !== ownBrand?.id);

  // Calculate growth rates for all competitors
  const growthRates: number[] = competitors.map(competitor => {
    const previous = previousData.find(b => b.brandId === competitor.brandId);
    if (!previous || previous.totalVolume === 0) return 0;
    return ((competitor.totalVolume - previous.totalVolume) / previous.totalVolume) * 100;
  });

  // Calculate average growth
  const avgCompetitorGrowth = growthRates.length > 0
    ? growthRates.reduce((a, b) => a + b, 0) / growthRates.length
    : 0;

  // Calculate volatility (standard deviation)
  const variance = growthRates.length > 1
    ? growthRates.reduce((sum, g) => sum + Math.pow(g - avgCompetitorGrowth, 2), 0) / (growthRates.length - 1)
    : 0;
  const growthVolatility = Math.sqrt(variance);

  // Calculate intensity score (0-10)
  // High avg growth + high volatility = high pressure
  const aggressionMultiplier = 1.5;
  const rawIntensity = avgCompetitorGrowth + (growthVolatility * aggressionMultiplier);
  
  // Normalize to 0-10 scale (assuming typical range is -10% to +30%)
  const score = Math.max(0, Math.min(10, (rawIntensity + 10) / 4));

  // Determine intensity level
  let intensity: 'extreme' | 'high' | 'medium' | 'low' = 'low';
  if (score >= 8) intensity = 'extreme';
  else if (score >= 6) intensity = 'high';
  else if (score >= 4) intensity = 'medium';

  // Generate interpretation
  let interpretation = '';
  if (intensity === 'extreme') {
    interpretation = '🔥 Hyper-competitive market. CAC rising fast. Consider retention focus.';
  } else if (intensity === 'high') {
    interpretation = '⚠️ High competitive pressure. Monitor CAC sustainability closely.';
  } else if (intensity === 'medium') {
    interpretation = 'Normal competitive activity. Balanced acquisition/retention approach.';
  } else {
    interpretation = 'Low competitive pressure. Good opportunity for market share gains.';
  }

  return {
    score: Math.round(score * 10) / 10,
    avgCompetitorGrowth: Math.round(avgCompetitorGrowth * 10) / 10,
    growthVolatility: Math.round(growthVolatility * 10) / 10,
    interpretation,
    intensity
  };
}

// =============================================================================
// FORMULA 5: PLAYER SENTIMENT VELOCITY
// =============================================================================

// Sentiment keyword classification
const positiveKeywords = [
  'beste online casino',
  'beste casino nederland',
  'top online casino',
  'betrouwbaar online casino',
  'veilig online casino',
  'casino bonus',
  'free spins',
  'welkomstbonus casino'
];

const negativeKeywords = [
  'casino uitbetaling',
  'casino klacht',
  'casino probleem',
  'casino betaalt niet uit',
  'casino traag',
  'geld kwijt casino',
  'casino oplichting'
];

export function calculatePlayerSentimentVelocity(
  currentIntentVolumes: Map<string, number>,
  previousIntentVolumes: Map<string, number>
): PlayerSentimentVelocity {
  // Calculate positive volume
  let positiveVolume = 0;
  positiveKeywords.forEach(kw => {
    positiveVolume += currentIntentVolumes.get(kw.toLowerCase()) || 0;
  });

  // Calculate negative volume
  let negativeVolume = 0;
  negativeKeywords.forEach(kw => {
    negativeVolume += currentIntentVolumes.get(kw.toLowerCase()) || 0;
  });

  // Calculate previous volumes
  let prevPositiveVolume = 0;
  positiveKeywords.forEach(kw => {
    prevPositiveVolume += previousIntentVolumes.get(kw.toLowerCase()) || 0;
  });

  let prevNegativeVolume = 0;
  negativeKeywords.forEach(kw => {
    prevNegativeVolume += previousIntentVolumes.get(kw.toLowerCase()) || 0;
  });

  // Calculate sentiment ratios (negative / positive)
  const sentimentRatio = positiveVolume > 0 ? negativeVolume / positiveVolume : 0;
  const previousRatio = prevPositiveVolume > 0 ? prevNegativeVolume / prevPositiveVolume : 0;

  // Calculate velocity (change in ratio)
  const velocity = previousRatio > 0
    ? ((sentimentRatio - previousRatio) / previousRatio) * 100
    : 0;

  // Calculate score (-100 to +100, negative = deteriorating)
  // Invert so positive score = improving sentiment
  const score = Math.max(-100, Math.min(100, -velocity));

  // Determine trend
  let trend: 'improving' | 'deteriorating' | 'stable' = 'stable';
  if (velocity > 20) trend = 'deteriorating';
  else if (velocity < -20) trend = 'improving';

  // Generate interpretation
  let interpretation = '';
  if (trend === 'deteriorating') {
    interpretation = '⚠️ Player sentiment declining. Negative searches accelerating. Review player experience.';
  } else if (trend === 'improving') {
    interpretation = '✅ Player sentiment improving. Positive searches growing relative to complaints.';
  } else {
    interpretation = 'Player sentiment stable. Monitor for changes.';
  }

  return {
    score: Math.round(score),
    positiveVolume,
    negativeVolume,
    sentimentRatio: Math.round(sentimentRatio * 1000) / 1000,
    previousRatio: Math.round(previousRatio * 1000) / 1000,
    velocity: Math.round(velocity * 10) / 10,
    trend,
    interpretation
  };
}

// =============================================================================
// AGGREGATE ALL METRICS
// =============================================================================

export function calculateAllMetrics(
  currentBrandData: BrandSearchVolume[],
  previousBrandData: BrandSearchVolume[],
  historicalBrandData: BrandSearchVolume[][],
  currentIntentVolumes: Map<string, number>,
  previousIntentVolumes: Map<string, number>
): CalculatedMetrics {
  return {
    marketShareMomentum: calculateMarketShareMomentum(currentBrandData, previousBrandData),
    emergingCompetitorAlerts: calculateEmergingCompetitorAlerts(currentBrandData, historicalBrandData),
    intentShiftIndex: calculateIntentShiftIndex(currentIntentVolumes, previousIntentVolumes),
    competitivePressureIndex: calculateCompetitivePressureIndex(currentBrandData, previousBrandData),
    playerSentimentVelocity: calculatePlayerSentimentVelocity(currentIntentVolumes, previousIntentVolumes),
    calculatedAt: new Date()
  };
}
