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
  biggestWinner: { name: string; velocity: number } | null;
  biggestLoser: { name: string; velocity: number } | null;
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

  // Find biggest winner (highest velocity, excluding own brand)
  const otherBrands = competitors.filter(c => !c.isOwnBrand);
  const allBrandsWithOwn = [...otherBrands, { ...ownBrand, isOwnBrand: true }];

  const biggestWinner = allBrandsWithOwn.reduce((max, brand) => {
    if (!max || brand.velocity > max.velocity) {
      return { name: brand.name, velocity: brand.velocity };
    }
    return max;
  }, null as { name: string; velocity: number } | null);

  // Find biggest loser (lowest velocity)
  const biggestLoser = allBrandsWithOwn.reduce((min, brand) => {
    if (!min || brand.velocity < min.velocity) {
      return { name: brand.name, velocity: brand.velocity };
    }
    return min;
  }, null as { name: string; velocity: number } | null);

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
    biggestWinner,
    biggestLoser,
    brandRank: ownBrand.rank,
    totalBrands: competitors.length,
    brandAboveYou,
    gapToAbove,
    leader,
    gapToFirst,
  };
}

// Calculate takeaway messages based on insights
export function calculateTakeaways(
  data: BrewedContextData,
  insights: StoryInsights
): TakeawayResult[] {
  const takeaways: TakeawayResult[] = [];
  const { ownBrand } = data;

  // Takeaway 1: Your performance vs market
  if (insights.brandVelocity > insights.marketVelocity + 2) {
    takeaways.push({
      text: "You're winning — maintain current momentum",
      type: 'positive',
    });
  } else if (insights.brandVelocity < insights.marketVelocity - 2) {
    takeaways.push({
      text: "You're losing ground — review competitor activity",
      type: 'warning',
    });
  } else {
    takeaways.push({
      text: "You're holding steady — look for growth opportunities",
      type: 'neutral',
    });
  }

  // Takeaway 2: Based on biggest winner
  if (insights.biggestWinner) {
    if (insights.biggestWinner.name === ownBrand.name) {
      takeaways.push({
        text: "You're the fastest growing brand this week",
        type: 'positive',
      });
    } else {
      takeaways.push({
        text: `Watch ${insights.biggestWinner.name} — they're accelerating fast`,
        type: 'warning',
      });
    }
  }

  // Takeaway 3: Gap closure projection
  if (insights.brandAboveYou && insights.gapToAbove !== null) {
    const weeklyGrowthYou = ownBrand.volume * (insights.brandVelocity / 100);
    const weeklyGrowthThem = insights.brandAboveYou.volume * (insights.brandAboveYou.velocity / 100);
    const growthDifference = weeklyGrowthYou - weeklyGrowthThem;

    if (growthDifference > 0 && insights.gapToAbove > 0) {
      // We're catching up
      const weeksToOvertake = Math.ceil(insights.gapToAbove / growthDifference);
      if (weeksToOvertake <= 52 && weeksToOvertake > 0) {
        takeaways.push({
          text: `At current pace, you'll overtake ${insights.brandAboveYou.name} in ~${weeksToOvertake} week${weeksToOvertake === 1 ? '' : 's'}`,
          type: 'positive',
        });
      } else {
        takeaways.push({
          text: `Gap to ${insights.brandAboveYou.name} is closing slowly — consider increasing spend`,
          type: 'neutral',
        });
      }
    } else if (growthDifference < 0) {
      // They're pulling away
      takeaways.push({
        text: `${insights.brandAboveYou.name} is pulling ahead — consider increasing spend`,
        type: 'warning',
      });
    } else {
      // Gap stable
      takeaways.push({
        text: `Focus on maintaining momentum against ${insights.brandAboveYou.name}`,
        type: 'neutral',
      });
    }
  } else if (ownBrand.rank === 1) {
    takeaways.push({
      text: "You're the market leader — focus on defending your position",
      type: 'positive',
    });
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
