// Types and helpers for Brewed Context components

export interface BrandData {
  name: string;
  volume: number;
  velocity: number;
  rank: number;
  marketShare: number;
}

export interface CompetitorData {
  name: string;
  volume: number;
  velocity: number;
  rank: number;
  isOwnBrand: boolean;
}

export interface BrewedContextData {
  ownBrand: BrandData;
  market: {
    velocity: number;
    totalVolume: number;
  };
  competitors: CompetitorData[];
}

export interface StoryInsights {
  marketVelocity: number;
  brandVelocity: number;
  outperformanceRatio: number;
  isOutperforming: boolean;
  brandRank: number;
  totalBrands: number;
  brandAboveYou: CompetitorData | null;
  gapToAbove: number | null;
  leader: CompetitorData | null;
  gapToFirst: number | null;
}

export interface TakeawayResult {
  text: string;
  type: 'positive' | 'warning' | 'neutral';
}

// Calculate all insights needed for This Week's Story
export function calculateStoryInsights(data: BrewedContextData): StoryInsights {
  const { ownBrand, market, competitors } = data;

  // Sort competitors by rank (ascending)
  const sortedByRank = [...competitors].sort((a, b) => a.rank - b.rank);

  // Find brand above you (rank - 1)
  const brandAboveYou = sortedByRank.find(c => c.rank === ownBrand.rank - 1 && !c.isOwnBrand) || null;

  // Find leader (rank 1)
  const leader = sortedByRank.find(c => c.rank === 1 && !c.isOwnBrand) || null;

  // Calculate gaps
  const gapToAbove = brandAboveYou ? brandAboveYou.volume - ownBrand.volume : null;
  const gapToFirst = leader ? leader.volume - ownBrand.volume : null;

  // Calculate outperformance ratio
  const outperformanceRatio = market.velocity !== 0
    ? ownBrand.velocity / market.velocity
    : (ownBrand.velocity > 0 ? Infinity : 0);

  return {
    marketVelocity: market.velocity,
    brandVelocity: ownBrand.velocity,
    outperformanceRatio,
    isOutperforming: ownBrand.velocity > market.velocity,
    brandRank: ownBrand.rank,
    totalBrands: competitors.length,
    brandAboveYou,
    gapToAbove,
    leader,
    gapToFirst,
  };
}

// Calculate takeaway messages based on insights (brand/market focused only)
export function calculateTakeaways(
  data: BrewedContextData,
  insights: StoryInsights
): TakeawayResult[] {
  const takeaways: TakeawayResult[] = [];
  const { ownBrand } = data;

  // Takeaway 1: Your performance vs market
  if (insights.brandVelocity > insights.marketVelocity) {
    takeaways.push({
      text: "You're outpacing the market this month — maintain momentum",
      type: 'positive',
    });
  } else if (insights.brandVelocity < insights.marketVelocity) {
    takeaways.push({
      text: "You're trailing the market this month — review your campaigns",
      type: 'warning',
    });
  } else {
    takeaways.push({
      text: "You're matching the market this month — look for growth opportunities",
      type: 'neutral',
    });
  }

  // Takeaway 2: Market health
  if (insights.marketVelocity > 0) {
    takeaways.push({
      text: `Market grew ${formatVelocity(insights.marketVelocity)} this month — demand is healthy`,
      type: 'positive',
    });
  } else if (insights.marketVelocity < 0) {
    takeaways.push({
      text: `Market declined ${formatVelocity(insights.marketVelocity)} this month — industry-wide slowdown`,
      type: 'warning',
    });
  } else {
    takeaways.push({
      text: "Market is flat this month — focus on capturing share",
      type: 'neutral',
    });
  }

  // Takeaway 3: Your position/gap (no competitor names)
  if (ownBrand.rank === 1) {
    takeaways.push({
      text: "You're the market leader — focus on defending your position",
      type: 'positive',
    });
  } else if (insights.gapToAbove !== null && insights.gapToAbove > 0) {
    // Calculate months to overtake if catching up
    if (insights.brandAboveYou) {
      const monthlyGrowthYou = ownBrand.volume * (insights.brandVelocity / 100);
      const monthlyGrowthThem = insights.brandAboveYou.volume * (insights.brandAboveYou.velocity / 100);
      const growthDifference = monthlyGrowthYou - monthlyGrowthThem;

      if (growthDifference > 0) {
        const monthsToOvertake = Math.ceil(insights.gapToAbove / growthDifference);
        if (monthsToOvertake <= 12 && monthsToOvertake > 0) {
          takeaways.push({
            text: `At current pace, you'll reach #${ownBrand.rank - 1} in ~${monthsToOvertake} month${monthsToOvertake === 1 ? '' : 's'}`,
            type: 'positive',
          });
        } else {
          takeaways.push({
            text: `You need ${formatCompactNumber(insights.gapToAbove)} more monthly searches to reach #${ownBrand.rank - 1}`,
            type: 'neutral',
          });
        }
      } else {
        takeaways.push({
          text: `You need ${formatCompactNumber(insights.gapToAbove)} more monthly searches to reach #${ownBrand.rank - 1}`,
          type: 'neutral',
        });
      }
    } else {
      takeaways.push({
        text: `You need ${formatCompactNumber(insights.gapToAbove)} more monthly searches to reach #${ownBrand.rank - 1}`,
        type: 'neutral',
      });
    }
  }

  return takeaways.slice(0, 3); // Ensure we only return 3 takeaways
}

// Format a velocity number with sign
export function formatVelocity(velocity: number): string {
  const sign = velocity >= 0 ? '+' : '';
  return `${sign}${velocity.toFixed(1)}%`;
}

// Format a number with K/M suffix
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(0)}K`;
  }
  return num.toLocaleString();
}
