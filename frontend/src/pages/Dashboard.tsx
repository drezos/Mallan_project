import { useCallback, useMemo } from 'react';
import { RefreshCw, Loader2, WifiOff } from 'lucide-react';
import { ShareOfSearchCard, BrandVolumeCard } from '../components/Zone1Cards'
import { MarketOpportunityCard, TAMTrendChart } from '../components/Zone2Components'
import { ThisWeekStory, KeyTakeaways, BrewedContextData } from '../components/BrewedContext'
import { CompetitorTable } from '../components/CompetitorTable'
import { CompetitiveTrendChart } from '../components/CompetitiveTrendChart'
import { CompetitorHighlights } from '../components/CompetitorHighlights'
import { AnomaliesPanel } from '../components/AnomaliesPanel'
import { VolumeToggle } from '../components/VolumeToggle'
import { useDashboard } from '../hooks/useDashboard'
import { useVolumeView } from '../contexts/VolumeViewContext'
import {
  mockBrandData,
  mockShareOfSearch,
  mockMarketRank,
  mockMarketOpportunity,
  mockTAMTrendData,
  mockTAM,
  mockTAMGrowth,
  mockCompetitors,
  mockCompetitiveTrendData,
  topRivals,
  mockAnomalies,
} from '../lib/mockData'

// Helper function to extract brand name from alert message
function extractBrandName(message: string, brands: string[]): string | undefined {
  // Check if any brand name appears in the message
  for (const brand of brands) {
    if (message.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return undefined;
}

// Helper function to format velocity as percentage string
function formatVelocity(velocity: number): string {
  const sign = velocity >= 0 ? '+' : '';
  return `${sign}${velocity.toFixed(1)}%`;
}

// Helper function to update anomaly message with actual competitor velocity
function updateAnomalyMessageWithVelocity(
  message: string,
  brandName: string | undefined,
  competitors: Array<{ name: string; growth: number }>
): string {
  if (!brandName) return message;

  // Find the competitor's actual velocity
  const competitor = competitors.find(c =>
    c.name.toLowerCase() === brandName.toLowerCase()
  );

  if (!competitor) return message;

  const actualVelocity = competitor.growth;
  const formattedVelocity = formatVelocity(actualVelocity);

  // Replace hardcoded percentages in the message with actual velocity
  // Patterns to match: "X.X%", "+X.X%", "-X.X%", "up X.X%"
  const updatedMessage = message
    .replace(/\b(\d+\.?\d*)%\s*(monthly growth|MoM)/gi, `${formattedVelocity} $2`)
    .replace(/up\s+(\d+\.?\d*)%/gi, `up ${formattedVelocity}`)
    .replace(/showing\s+(\d+\.?\d*)%/gi, `showing ${formattedVelocity}`)
    .replace(/growing\s+(\d+\.?\d*)%/gi, `growing ${formattedVelocity}`);

  return updatedMessage;
}

// Helper function to generate trend data using priority keyword volumes
// This ensures apples-to-apples comparison across all brands
function generateScaledTrendData(
  brands: Array<{ brandName: string; volume: number; priorityVolume?: number }>,
  mockTrend: Array<Record<string, number | string>>
): Array<Record<string, number | string>> {
  // Use priorityVolume for fair comparison (single highest-volume keyword per brand)
  // This avoids the problem where brands with more keywords appear larger
  const brandPriorityVolumeMap: Record<string, number> = {};
  brands.forEach(b => {
    // Use priorityVolume if available, fall back to volume for backward compatibility
    brandPriorityVolumeMap[b.brandName] = b.priorityVolume || b.volume;
  });

  // Use mock trend data for week labels only (12 weeks)

  // Generate 12-week trend data for each brand based on their priority volume
  // Apply small random variation to simulate realistic weekly fluctuations
  return mockTrend.map((weekData, weekIndex) => {
    const scaled: Record<string, number | string> = { week: weekData.week };

    // For each brand in the API response, calculate their trend value
    brands.forEach(brand => {
      const priorityVolume = brandPriorityVolumeMap[brand.brandName] || 0;
      // Apply week-to-week variation (±5%) based on mock data pattern
      const weekVariation = weekIndex < mockTrend.length - 1
        ? 0.95 + (weekIndex / mockTrend.length) * 0.10 // Slight upward trend
        : 1.0; // Last week = actual priority volume
      scaled[brand.brandName] = Math.round(priorityVolume * weekVariation);
    });

    return scaled;
  });
}

export function Dashboard() {
  const dashboardQuery = useDashboard();
  const { volumeView } = useVolumeView();

  const isLoading = dashboardQuery.isLoading;
  const isError = dashboardQuery.isError;

  const refetch = () => {
    dashboardQuery.refetch();
  };

  // Get data from dashboard response
  const dashboardData = dashboardQuery.data?.data;

  // Find own brand's rank from the brands list
  const ownBrandEntry = dashboardData?.brands?.find(b => b.isOwnBrand);
  const ownBrandRank = ownBrandEntry?.rank || mockMarketRank.current;

  // Get all brand names for matching alerts to competitors
  const allBrandNames = dashboardData?.brands
    ? dashboardData.brands.map(b => b.brandName)
    : mockCompetitors.map(c => c.name);

  // Compute competitors first so it can be used by anomalies transformation
  const computedCompetitors = dashboardData?.brands
    ? dashboardData.brands
        .filter((b) => !b.isOwnBrand)
        .map((b) => ({
          id: String(b.rank),
          name: b.brandName,
          searchVolume: b.volume || 0,
          priorityKeyword: b.priorityKeyword || '',
          priorityVolume: b.priorityVolume || 0,
          growth: b.velocity || 0,
          status: 'normal' as 'normal' | 'watching' | 'threat',
          marketShare: b.marketShare || 0,
          priorityMarketShare: b.priorityMarketShare || 0,
        }))
    : mockCompetitors.filter((c) => c.name !== 'Jacks Casino').map(c => ({
        id: c.id,
        name: c.name,
        searchVolume: c.searchVolume,
        priorityKeyword: '',
        priorityVolume: 0,
        growth: c.monthlyChange, // Map monthlyChange to growth for consistency
        status: 'normal' as 'normal' | 'watching' | 'threat',
        marketShare: c.marketShare,
        priorityMarketShare: 0,
      }));

  // Transform API data to component format
  const transformedData = {
    brandData: dashboardData?.overview?.yourBrand
      ? {
          name: dashboardData.overview.yourBrand.name || 'Jacks Casino',
          searchVolume: dashboardData.overview.yourBrand.volume || mockBrandData.searchVolume,
          priorityKeyword: dashboardData.overview.yourBrand.priorityKeyword || '',
          priorityVolume: dashboardData.overview.yourBrand.priorityVolume || 0,
          growth: ownBrandEntry?.velocity ?? mockBrandData.growth,
          marketShare: dashboardData.overview.yourBrand.marketShare || mockBrandData.marketShare,
          priorityMarketShare: dashboardData.overview.yourBrand.priorityMarketShare || 0,
        }
      : { ...mockBrandData, priorityKeyword: '', priorityVolume: 0, priorityMarketShare: 0 },

    shareOfSearch: dashboardData?.overview?.yourBrand
      ? {
          current: volumeView === 'priority'
            ? (dashboardData.overview.yourBrand.priorityMarketShare || mockShareOfSearch.current)
            : (dashboardData.overview.yourBrand.marketShare || mockShareOfSearch.current),
          change: mockShareOfSearch.change, // Change not in dashboard response
          monthlyHistory: mockShareOfSearch.monthlyHistory,
        }
      : mockShareOfSearch,

    marketRank: dashboardData?.brands
      ? {
          current: ownBrandRank,
          previous: ownBrandRank + 1,
          change: 1,
          total: dashboardData.brands.length,
          totalCompetitors: dashboardData.brands.length,
        }
      : mockMarketRank,

    marketOpportunity: dashboardData?.overview
      ? {
          yourBrand: dashboardData.overview.yourBrand?.volume || mockMarketOpportunity.yourBrand,
          competitors: dashboardData.overview.totalMarketVolume - (dashboardData.overview.yourBrand?.volume || 0),
          generic: mockMarketOpportunity.generic,
          total: dashboardData.overview.totalMarketVolume || mockMarketOpportunity.total,
        }
      : mockMarketOpportunity,
    tamTrendData: mockTAMTrendData,
    tam: dashboardData?.overview
      ? { total: dashboardData.overview.totalMarketVolume, growth: mockTAM.growth }
      : mockTAM,
    tamGrowth: mockTAMGrowth,

    // Use precomputed competitors for consistency with anomalies
    competitors: computedCompetitors,

    // Generate trend data that matches actual brand volumes
    competitiveTrendData: dashboardData?.brands
      ? generateScaledTrendData(dashboardData.brands, mockCompetitiveTrendData)
      : mockCompetitiveTrendData,
    topRivals: dashboardData?.brands
      ? dashboardData.brands.slice(0, 5).map(b => b.brandName)
      : topRivals,

    anomalies: (() => {
      if (dashboardData?.alerts?.length) {
        return dashboardData.alerts.map((a, index) => {
          const brandName = extractBrandName(a.message, allBrandNames);
          return {
            id: String(index + 1),
            type: a.type,
            impact: (a.severity === 'high' ? 'high' : 'info') as 'high' | 'info',
            title: a.message.split(':')[0] || 'Alert',
            // Update message with actual velocity from competitor data
            message: updateAnomalyMessageWithVelocity(a.message, brandName, computedCompetitors),
            metric: a.type === 'competitor' ? 'Search Volume' : 'Intent Shift',
            timestamp: new Date().toISOString(),
            brandName,
          };
        });
      }
      // For mock anomalies, update messages with actual velocity data
      return mockAnomalies.map(a => {
        const brandName = extractBrandName(a.title + ' ' + a.message, allBrandNames);
        return {
          ...a,
          // Update message with actual velocity from competitor data
          message: updateAnomalyMessageWithVelocity(a.message, brandName, computedCompetitors),
          brandName,
        };
      });
    })(),
  };

  // Prepare data for Brewed Context components
  const brewedContextData: BrewedContextData = useMemo(() => {
    const ownBrandData = dashboardData?.brands?.find(b => b.isOwnBrand);
    const allBrands = dashboardData?.brands || [];

    // Calculate market velocity (TAM growth)
    // Using mock data for now as TAM velocity isn't in the API
    const marketVelocity = mockTAMGrowth;

    return {
      ownBrand: {
        name: ownBrandData?.brandName || transformedData.brandData.name,
        volume: ownBrandData?.volume || transformedData.brandData.searchVolume,
        velocity: ownBrandData?.velocity ?? transformedData.brandData.growth,
        rank: ownBrandData?.rank || transformedData.marketRank.current,
        marketShare: ownBrandData?.marketShare || transformedData.brandData.marketShare,
      },
      market: {
        velocity: marketVelocity,
        totalVolume: dashboardData?.overview?.totalMarketVolume || transformedData.tam.total,
      },
      competitors: allBrands.map(b => ({
        name: b.brandName,
        volume: b.volume,
        velocity: b.velocity ?? 0,
        rank: b.rank,
        isOwnBrand: b.isOwnBrand,
      })),
    };
  }, [dashboardData, transformedData]);

  // Calculate fastest growing and biggest decline competitors
  const competitorHighlights = useMemo(() => {
    const competitors = transformedData.competitors;

    if (competitors.length === 0) {
      return {
        fastestGrowing: { name: 'N/A', velocity: 0 },
        biggestDecline: { name: 'N/A', velocity: 0 },
      };
    }

    // Helper to get velocity from competitor (handles both API and mock data formats)
    const getVelocity = (c: typeof competitors[0]): number => {
      return ('growth' in c ? c.growth : 0) || 0;
    };

    const fastestGrowing = competitors.reduce((max, c) =>
      getVelocity(c) > getVelocity(max) ? c : max
    );

    const biggestDecline = competitors.reduce((min, c) =>
      getVelocity(c) < getVelocity(min) ? c : min
    );

    return {
      fastestGrowing: { name: fastestGrowing.name, velocity: getVelocity(fastestGrowing) },
      biggestDecline: { name: biggestDecline.name, velocity: getVelocity(biggestDecline) },
    };
  }, [transformedData.competitors]);

  // Filter anomalies for competitor-specific alerts only (for Market Alerts panel)
  const competitorSpecificAnomalies = useMemo(() => {
    // Keep alerts that are competitor-specific (have a brand name associated)
    // or are about competitor growth/surges
    const competitorAlertTypes = ['competitor_surge', 'competitor_growth', 'emerging_threat', 'competitive_pressure'];

    return transformedData.anomalies.filter(anomaly =>
      // Include if it has a brand name (competitor-specific)
      anomaly.brandName ||
      // Or if the type is competitor-related
      competitorAlertTypes.includes(anomaly.type) ||
      // Or if the title/message mentions a specific competitor
      transformedData.competitors.some(c =>
        anomaly.title.toLowerCase().includes(c.name.toLowerCase()) ||
        anomaly.message.toLowerCase().includes(c.name.toLowerCase())
      )
    );
  }, [transformedData.anomalies, transformedData.competitors]);

  // Handle alert click - scroll to and highlight competitor row
  const handleAlertClick = useCallback((brandName: string) => {
    const row = document.getElementById(`competitor-row-${brandName}`);
    if (row) {
      // Scroll into view
      row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add highlight class
      row.classList.add('highlight-row');
      // Remove highlight after animation completes
      setTimeout(() => row.classList.remove('highlight-row'), 2000);
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-forest-500 mx-auto mb-3" />
          <p className="text-slate-500">Loading market intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome message + Status indicator */}
      <div className="opacity-0 animate-fade-in flex items-center justify-between">
        <p className="text-slate-500">
          Good {getTimeOfDay()}, here's your market intelligence briefing.
        </p>
        
        <div className="flex items-center gap-3">
          {/* Last updated timestamp */}
          {dashboardData?.lastUpdated && (
            <div className="text-sm text-gray-500">
              Updated {formatRelativeTime(dashboardData.lastUpdated)}
            </div>
          )}

          {/* Connection status */}
          {isError ? (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
              <WifiOff className="w-4 h-4" />
              <span>Using cached data</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 text-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span>Live</span>
            </div>
          )}

          {/* Refresh button */}
          <button
            onClick={() => refetch()}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* ===========================================
          ZONE 1: Espresso Shot (Top Row - 50/50)
          =========================================== */}
      <section>
        <div className="flex items-center justify-between mb-4 opacity-0 animate-fade-in">
          <h2 className="text-lg font-display font-semibold text-slate-800">
            Espresso Shot
          </h2>
          <VolumeToggle />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card A: Share of Search (Hero Metric) */}
          <ShareOfSearchCard
            current={transformedData.shareOfSearch.current}
            change={transformedData.shareOfSearch.change}
            monthlyHistory={transformedData.shareOfSearch.monthlyHistory}
          />
          
          {/* Card B: Brand Search Volume with Market Rank */}
          <BrandVolumeCard
            volume={transformedData.brandData.searchVolume}
            priorityKeyword={transformedData.brandData.priorityKeyword}
            priorityVolume={transformedData.brandData.priorityVolume}
            growth={transformedData.brandData.growth}
            marketRank={transformedData.marketRank}
          />
        </div>
      </section>

      {/* ===========================================
          ZONE 2: Strategic Context (Brewed Context)
          =========================================== */}
      <section className="space-y-4">
        <h2 className="text-lg font-display font-semibold text-slate-800 opacity-0 animate-fade-in animation-delay-200">
          Brewed Context
        </h2>

        {/* Part 1: This Week's Story */}
        <ThisWeekStory data={brewedContextData} />

        {/* Part 2: Charts side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Chart: Search Volume Overview */}
          <MarketOpportunityCard
            yourBrand={transformedData.marketOpportunity.yourBrand}
            competitors={transformedData.marketOpportunity.competitors}
            generic={transformedData.marketOpportunity.generic}
            total={transformedData.marketOpportunity.total}
          />

          {/* Right Chart: Market Opportunity (TAM Trend) */}
          <TAMTrendChart
            data={transformedData.tamTrendData}
            totalTAM={transformedData.tam.total}
            tamGrowth={transformedData.tamGrowth}
            brandName={brewedContextData.ownBrand.name}
            monthlyBrandVelocity={brewedContextData.ownBrand.velocity}
            monthlyMarketVelocity={brewedContextData.market.velocity}
          />
        </div>

        {/* Part 3: Key Takeaways */}
        <KeyTakeaways data={brewedContextData} />
      </section>

      {/* ===========================================
          ZONE 3: Threat Intelligence (Bottom Row - 2/3 + 1/3)
          =========================================== */}
      <section>
        <div className="mb-4 opacity-0 animate-fade-in animation-delay-400">
          <h2 className="text-lg font-display font-semibold text-slate-800">
            Competitive Roast
          </h2>
          <p className="text-sm text-slate-500">Weekly competitive intelligence</p>
        </div>

        {/* Competitor Highlights - above the table */}
        <CompetitorHighlights
          fastestGrowing={competitorHighlights.fastestGrowing}
          biggestDecline={competitorHighlights.biggestDecline}
        />

        {/* Row 1: Table (2/3) + Anomalies (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2">
            <CompetitorTable
              competitors={transformedData.competitors}
              brandData={transformedData.brandData}
            />
          </div>
          <div className="lg:col-span-1">
            <AnomaliesPanel anomalies={competitorSpecificAnomalies} onAlertClick={handleAlertClick} />
          </div>
        </div>
        
        {/* Row 2: Trend Chart (Full Width) */}
        <div className="w-full">
          <CompetitiveTrendChart
            data={transformedData.competitiveTrendData}
            brandName={transformedData.brandData.name}
            competitors={transformedData.competitors.map((c: { name: string }) => c.name)}
            topRivals={transformedData.topRivals}
          />
        </div>
      </section>
    </div>
  )
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

  // For older dates, show the actual date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: 'numeric',
    minute: '2-digit',
  });
}
