import { ShareOfSearchCard, BrandVolumeCard } from '../components/Zone1Cards'
import { MarketOpportunityCard, TAMTrendChart } from '../components/Zone2Components'
import { CompetitorTable } from '../components/CompetitorTable'
import { CompetitiveTrendChart } from '../components/CompetitiveTrendChart'
import { AnomaliesPanel } from '../components/AnomaliesPanel'
import {
  mockBrandData,
  mockCompetitors,
  mockShareOfSearch,
  mockMarketRank,
  mockMarketOpportunity,
  mockTAMTrendData,
  mockTAM,
  mockTAMGrowth,
  mockCompetitiveTrendData,
  topRivals,
  mockAnomalies,
} from '../lib/mockData'

export function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome message */}
      <div className="opacity-0 animate-fade-in">
        <p className="text-slate-500">
          Good {getTimeOfDay()}, here's your market intelligence briefing.
        </p>
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
            current={mockShareOfSearch.current}
            change={mockShareOfSearch.change}
            weeklyHistory={mockShareOfSearch.weeklyHistory}
          />
          
          {/* Card B: Brand Search Volume with Market Rank */}
          <BrandVolumeCard
            volume={mockBrandData.searchVolume}
            growth={mockBrandData.growth}
            marketRank={mockMarketRank}
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
              yourBrand={mockMarketOpportunity.yourBrand}
              competitors={mockMarketOpportunity.competitors}
              generic={mockMarketOpportunity.generic}
              total={mockMarketOpportunity.total}
            />
          </div>

          {/* Right Panel: TAM Trend Chart (2/3) */}
          <div className="lg:col-span-2">
            <TAMTrendChart
              data={mockTAMTrendData}
              totalTAM={mockTAM.total}
              tamGrowth={mockTAMGrowth}
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
        competitors={mockCompetitors}
        brandData={mockBrandData}
      />
    </div>
    <div className="lg:col-span-1">
      <AnomaliesPanel anomalies={mockAnomalies} />
    </div>
  </div>
  
  {/* Row 2: Trend Chart (Full Width) */}
  <div className="w-full">
    <CompetitiveTrendChart
      data={mockCompetitiveTrendData}
      brandName="Jacks.nl"
      competitors={mockCompetitors.map(c => c.name)}
      topRivals={topRivals}
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
