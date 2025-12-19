import { RefreshCw, Loader2, WifiOff } from 'lucide-react';
import { ShareOfSearchCard, BrandVolumeCard } from '../components/Zone1Cards'
import { MarketOpportunityCard, TAMTrendChart } from '../components/Zone2Components'
import { CompetitorTable } from '../components/CompetitorTable'
import { CompetitiveTrendChart } from '../components/CompetitiveTrendChart'
import { AnomaliesPanel } from '../components/AnomaliesPanel'
import { useDashboard } from '../hooks/useDashboard'
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

// Helper function to scale mock trend data to match actual brand volumes
function generateScaledTrendData(
  brands: Array<{ brandName: string; volume: number }>,
  mockTrend: Array<Record<string, number | string>>
): Array<Record<string, number | string>> {
  // Create a map of brand name to actual volume
  const brandVolumeMap: Record<string, number> = {};
  brands.forEach(b => {
    brandVolumeMap[b.brandName] = b.volume;
  });

  // For each brand in mock data, calculate the scale factor to match actual volume
  const lastWeekData = mockTrend[mockTrend.length - 1];
  const scaleFactors: Record<string, number> = {};

  Object.keys(lastWeekData).forEach(key => {
    if (key === 'week') return;
    const mockValue = lastWeekData[key] as number;
    const actualValue = brandVolumeMap[key];
    if (actualValue && mockValue) {
      scaleFactors[key] = actualValue / mockValue;
    }
  });

  // Scale all trend data points
  return mockTrend.map(weekData => {
    const scaled: Record<string, number | string> = { week: weekData.week };
    Object.keys(weekData).forEach(key => {
      if (key === 'week') return;
      const value = weekData[key] as number;
      const scaleFactor = scaleFactors[key] || 1;
      scaled[key] = Math.round(value * scaleFactor);
    });
    return scaled;
  });
}

export function Dashboard() {
  const dashboardQuery = useDashboard();

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

  // Transform API data to component format
  const transformedData = {
    brandData: dashboardData?.overview?.yourBrand
      ? {
          name: dashboardData.overview.yourBrand.name || 'Jacks.nl',
          searchVolume: dashboardData.overview.yourBrand.volume || mockBrandData.searchVolume,
          growth: ownBrandEntry?.velocity ?? mockBrandData.growth,
          marketShare: dashboardData.overview.yourBrand.marketShare || mockBrandData.marketShare,
        }
      : mockBrandData,

    shareOfSearch: dashboardData?.overview?.yourBrand
      ? {
          current: dashboardData.overview.yourBrand.marketShare || mockShareOfSearch.current,
          change: mockShareOfSearch.change, // Change not in dashboard response
          weeklyHistory: mockShareOfSearch.weeklyHistory,
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

    competitors: dashboardData?.brands
      ? dashboardData.brands
          .filter((b) => !b.isOwnBrand) // Exclude own brand (added separately via brandData)
          .map((b) => ({
            id: String(b.rank),
            name: b.brandName,
            searchVolume: b.volume || 0,
            growth: b.velocity || 0,
            status: 'normal' as 'normal' | 'watching' | 'threat',
            marketShare: b.marketShare || 0,
          }))
      : mockCompetitors.filter((c) => c.name !== 'Jacks.nl'),

    // Generate trend data that matches actual brand volumes
    competitiveTrendData: dashboardData?.brands
      ? generateScaledTrendData(dashboardData.brands, mockCompetitiveTrendData)
      : mockCompetitiveTrendData,
    topRivals: dashboardData?.brands
      ? dashboardData.brands.slice(0, 5).map(b => b.brandName)
      : topRivals,

    anomalies: dashboardData?.alerts?.length
      ? dashboardData.alerts.map((a, index) => ({
          id: String(index + 1),
          type: a.type,
          impact: (a.severity === 'high' ? 'high' : 'info') as 'high' | 'info',
          title: a.message.split(':')[0] || 'Alert',
          message: a.message,
          metric: a.type === 'competitor' ? 'Search Volume' : 'Intent Shift',
          timestamp: new Date().toISOString(),
        }))
      : mockAnomalies,
  };

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
        <h2 className="text-lg font-display font-semibold text-slate-800 mb-4 opacity-0 animate-fade-in">
          Espresso Shot
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card A: Share of Search (Hero Metric) */}
          <ShareOfSearchCard
            current={transformedData.shareOfSearch.current}
            change={transformedData.shareOfSearch.change}
            weeklyHistory={transformedData.shareOfSearch.weeklyHistory}
          />
          
          {/* Card B: Brand Search Volume with Market Rank */}
          <BrandVolumeCard
            volume={transformedData.brandData.searchVolume}
            growth={transformedData.brandData.growth}
            marketRank={transformedData.marketRank}
          />
        </div>
      </section>

      {/* ===========================================
          ZONE 2: Strategic Context (Middle Row - 1/3 + 2/3)
          =========================================== */}
      <section>
        <h2 className="text-lg font-display font-semibold text-slate-800 mb-4 opacity-0 animate-fade-in animation-delay-200">
          Brewed Context
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Panel: Market Opportunity (1/3) */}
          <div className="lg:col-span-1">
            <MarketOpportunityCard
              yourBrand={transformedData.marketOpportunity.yourBrand}
              competitors={transformedData.marketOpportunity.competitors}
              generic={transformedData.marketOpportunity.generic}
              total={transformedData.marketOpportunity.total}
            />
          </div>

          {/* Right Panel: TAM Trend Chart (2/3) */}
          <div className="lg:col-span-2">
            <TAMTrendChart
              data={transformedData.tamTrendData}
              totalTAM={transformedData.tam.total}
              tamGrowth={transformedData.tamGrowth}
              brandName="Jacks.nl"
            />
          </div>
        </div>
      </section>

      {/* ===========================================
          ZONE 3: Threat Intelligence (Bottom Row - 2/3 + 1/3)
          =========================================== */}
      <section>
        <h2 className="text-lg font-display font-semibold text-slate-800 mb-4 opacity-0 animate-fade-in animation-delay-400">
          Competitive Roast
        </h2>
        
        {/* Row 1: Table (2/3) + Anomalies (1/3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2">
            <CompetitorTable
              competitors={transformedData.competitors}
              brandData={transformedData.brandData}
            />
          </div>
          <div className="lg:col-span-1">
            <AnomaliesPanel anomalies={transformedData.anomalies} />
          </div>
        </div>
        
        {/* Row 2: Trend Chart (Full Width) */}
        <div className="w-full">
          <CompetitiveTrendChart
            data={transformedData.competitiveTrendData}
            brandName="Jacks.nl"
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
