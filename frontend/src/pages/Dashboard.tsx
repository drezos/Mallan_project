import { ShareOfSearchCard, BrandVolumeCard } from '../components/Zone1Cards'
import { TrafficMixCard, MarketVelocityChart } from '../components/Zone2Components'
import { CompetitorTable } from '../components/CompetitorTable'
import { AnomaliesPanel } from '../components/AnomaliesPanel'
import {
  mockBrandData,
  mockCompetitors,
  mockShareOfSearch,
  mockMarketValue,
  mockTrafficMix,
  mockChartData,
  mockAnomalies,
} from '../lib/mockData'

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <div className="opacity-0 animate-fade-in">
        <p className="text-slate-500">
          Good {getTimeOfDay()}, here's your market intelligence briefing.
        </p>
      </div>

      {/* ===========================================
          ZONE 1: Espresso Shot (Top Row - 50/50)
          =========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card A: Share of Search (Hero Metric) */}
        <ShareOfSearchCard
          current={mockShareOfSearch.current}
          change={mockShareOfSearch.change}
          weeklyHistory={mockShareOfSearch.weeklyHistory}
        />
        
        {/* Card B: Brand Search Volume (Revenue Proxy) */}
        <BrandVolumeCard
          volume={mockBrandData.searchVolume}
          marketValue={mockMarketValue.value}
          growth={mockBrandData.growth}
        />
      </div>

      {/* ===========================================
          ZONE 2: Brewed Context (Middle Row - 1/3 + 2/3)
          =========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Panel: Traffic Quality Mix (1/3) */}
        <div className="lg:col-span-1">
          <TrafficMixCard
            brandShare={mockTrafficMix.brandShare}
            genericShare={mockTrafficMix.genericShare}
            brandVolume={mockTrafficMix.brandVolume}
            genericVolume={mockTrafficMix.genericVolume}
            genericTrend={mockTrafficMix.genericTrend}
            insight={mockTrafficMix.insight}
          />
        </div>

        {/* Right Panel: Market Velocity Chart (2/3) */}
        <div className="lg:col-span-2">
          <MarketVelocityChart
            data={mockChartData}
            brandName="Jacks.nl"
          />
        </div>
      </div>

      {/* ===========================================
          ZONE 3: Competitive Roast (Bottom Row - 2/3 + 1/3)
          =========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Panel: Competitor Snapshot (2/3) */}
        <div className="lg:col-span-2">
          <CompetitorTable
            competitors={mockCompetitors}
            brandData={mockBrandData}
          />
        </div>

        {/* Right Panel: Market Anomalies (1/3) */}
        <div className="lg:col-span-1">
          <AnomaliesPanel anomalies={mockAnomalies} />
        </div>
      </div>
    </div>
  )
}

// Helper function
function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
