import { RefreshCw, Loader2, WifiOff } from 'lucide-react';
import { ShareOfSearchCard, BrandVolumeCard } from '../components/Zone1Cards'
import { MarketOpportunityCard, TAMTrendChart } from '../components/Zone2Components'
import { CompetitorTable } from '../components/CompetitorTable'
import { CompetitiveTrendChart } from '../components/CompetitiveTrendChart'
import { AnomaliesPanel } from '../components/AnomaliesPanel'
import { useDashboardData } from '../hooks/useMarketData'

export function Dashboard() {
  const { data, isLoading, isError, refetch } = useDashboardData();

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
            current={data.shareOfSearch.current}
            change={data.shareOfSearch.change}
            weeklyHistory={data.shareOfSearch.weeklyHistory}
          />
          
          {/* Card B: Brand Search Volume with Market Rank */}
          <BrandVolumeCard
            volume={data.brandData.searchVolume}
            growth={data.brandData.growth}
            marketRank={data.marketRank}
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
              yourBrand={data.marketOpportunity.yourBrand}
              competitors={data.marketOpportunity.competitors}
              generic={data.marketOpportunity.generic}
              total={data.marketOpportunity.total}
            />
          </div>

          {/* Right Panel: TAM Trend Chart (2/3) */}
          <div className="lg:col-span-2">
            <TAMTrendChart
              data={data.tamTrendData}
              totalTAM={data.tam.total}
              tamGrowth={data.tamGrowth}
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
              competitors={data.competitors}
              brandData={data.brandData}
            />
          </div>
          <div className="lg:col-span-1">
            <AnomaliesPanel anomalies={data.anomalies} />
          </div>
        </div>
        
        {/* Row 2: Trend Chart (Full Width) */}
        <div className="w-full">
          <CompetitiveTrendChart
            data={data.competitiveTrendData}
            brandName="Jacks.nl"
            competitors={data.competitors.map((c: any) => c.name)}
            topRivals={data.topRivals}
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
