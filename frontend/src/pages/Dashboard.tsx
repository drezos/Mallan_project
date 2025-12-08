import { MetricCard } from '../components/MetricCard'
import { AlertsPanel } from '../components/AlertsPanel'
import { CompetitorTable } from '../components/CompetitorTable'
import { TrendChart } from '../components/TrendChart'
import { 
  mockMetrics, 
  mockAlerts, 
  mockCompetitors, 
  mockBrandData,
  mockTrendData 
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

      {/* Scorecard row - Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Market Share Momentum"
          value={mockMetrics.marketShareMomentum}
          type="score"
          change={mockMetrics.marketShareMomentumChange}
          changeLabel="vs last week"
          description="You're gaining ground"
          delay={100}
        />
        <MetricCard
          title="Competitive Pressure"
          value={mockMetrics.competitivePressure}
          type="score"
          change={mockMetrics.competitivePressureChange}
          changeLabel="market cooling"
          description="Moderate intensity"
          delay={200}
        />
        <MetricCard
          title="Your Brand Heat"
          value={mockMetrics.brandHeat}
          suffix="%"
          type="percentage"
          change={mockMetrics.brandHeatChange}
          changeLabel="of market searches"
          delay={300}
        />
        <MetricCard
          title="Player Sentiment"
          value={mockMetrics.sentimentScore}
          suffix="/100"
          type="number"
          change={mockMetrics.sentimentChange}
          changeLabel="improving"
          delay={400}
        />
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Alerts (takes 1 col) */}
        <div className="lg:col-span-1">
          <AlertsPanel alerts={mockAlerts} maxItems={4} />
        </div>

        {/* Right column - Trend chart (takes 2 cols) */}
        <div className="lg:col-span-2">
          <TrendChart 
            data={mockTrendData}
            title="Your Brand vs Market"
            subtitle="12-week search volume trend"
          />
        </div>
      </div>

      {/* Competitor snapshot - full width */}
      <CompetitorTable 
        competitors={mockCompetitors} 
        brandData={mockBrandData}
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
