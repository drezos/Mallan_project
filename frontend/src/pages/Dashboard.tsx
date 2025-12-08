import { 
  ShareOfSearchCard, 
  MarketOpportunityCard, 
  TotalMarketCard,
  PerformanceContextCard 
} from '../components/KPICards'
import { AnomaliesPanel } from '../components/AnomaliesPanel'
import { CompetitorTable } from '../components/CompetitorTable'
import { TrendChart } from '../components/TrendChart'
import { 
  mockKPIMetrics,
  mockAnomalies, 
  mockCompetitors, 
  mockBrandData,
  mockTrendData,
  marketAverageGrowth
} from '../lib/mockData'

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome message - contextual */}
      <div className="opacity-0 animate-fade-in">
        <p className="text-slate-500">
          Good {getTimeOfDay()}, here's your market intelligence briefing.
        </p>
      </div>

      {/* KPI Cards Row - Hard metrics, no abstract scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ShareOfSearchCard
          value={mockKPIMetrics.shareOfSearch.value}
          change={mockKPIMetrics.shareOfSearch.change}
          trend={mockKPIMetrics.shareOfSearch.trend}
          sparklineData={mockKPIMetrics.shareOfSearch.weeklyHistory}
        />
        <MarketOpportunityCard
          genericVolume={mockKPIMetrics.marketOpportunity.genericVolume}
          competitorVolume={mockKPIMetrics.marketOpportunity.competitorVolume}
          yourBrandVolume={mockKPIMetrics.marketOpportunity.yourBrandVolume}
        />
        <TotalMarketCard
          volume={mockKPIMetrics.totalMarket.volume}
          growth={mockKPIMetrics.totalMarket.growth}
          trend={mockKPIMetrics.totalMarket.trend}
          isHealthy={mockKPIMetrics.totalMarket.isHealthy}
        />
        <PerformanceContextCard
          yourGrowth={mockKPIMetrics.marketContext.yourGrowth}
          marketGrowth={mockKPIMetrics.marketContext.marketGrowth}
          outperforming={mockKPIMetrics.marketContext.outperforming}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Anomalies (takes 1 col) */}
        <div className="lg:col-span-1">
          <AnomaliesPanel anomalies={mockAnomalies} />
        </div>

        {/* Right column - Trend chart (takes 2 cols) */}
        <div className="lg:col-span-2">
          <TrendChart 
            data={mockTrendData}
            title="Your Brand vs Generic Market"
            subtitle="12-week search volume trend (dual axis)"
            brandName="Jacks.nl"
          />
        </div>
      </div>

      {/* Competitor snapshot - full width */}
      <CompetitorTable 
        competitors={mockCompetitors} 
        brandData={mockBrandData}
        marketAverageGrowth={marketAverageGrowth}
      />
    </div>
  )
}

// Helper function to get contextual greeting
function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
