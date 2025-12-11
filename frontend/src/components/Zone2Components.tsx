import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn, formatNumber } from '../lib/utils'

// ===========================================
// Market Opportunity Card (Horizontal Stacked Bar)
// Shows: Your Brand | Competitors (Warm) | Generic (Undecided)
// ===========================================
interface MarketOpportunityCardProps {
  yourBrand: number
  competitors: number
  generic: number
  total: number
}

export function MarketOpportunityCard({ yourBrand, competitors, generic, total }: MarketOpportunityCardProps) {
  const yourPercent = (yourBrand / total) * 100
  const competitorPercent = (competitors / total) * 100
  const genericPercent = (generic / total) * 100

  const data = [
    { name: 'Market', yourBrand, competitors, generic }
  ]

  return (
    <div className="card p-5 h-full opacity-0 animate-slide-up animation-delay-200">
      <div className="mb-4">
        <h3 className="font-display font-semibold text-slate-900">Search Volume Overview</h3>
        <p className="text-xs text-slate-500 mt-0.5">Total addressable market breakdown</p>
      </div>

      {/* Horizontal Stacked Bar */}
      <div className="h-16 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide domain={[0, total]} />
            <YAxis type="category" dataKey="name" hide />
            <Bar dataKey="yourBrand" stackId="a" fill="#2d6e40" radius={[4, 0, 0, 4]} />
            <Bar dataKey="competitors" stackId="a" fill="#fe7c11" />
            <Bar dataKey="generic" stackId="a" fill="#9aa0a6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-forest-600" />
            <span className="text-sm text-slate-600">Your Brand</span>
          </div>
          <div className="text-right">
            <span className="font-mono text-sm font-semibold text-slate-900">{formatNumber(yourBrand)}</span>
            <span className="text-xs text-slate-400 ml-1">({yourPercent.toFixed(1)}%)</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-ember-500" />
            <div>
              <span className="text-sm text-slate-600">Competitors</span>
              <span className="text-xs text-slate-400 ml-1">(Warm Leads)</span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-sm font-semibold text-slate-900">{formatNumber(competitors)}</span>
            <span className="text-xs text-slate-400 ml-1">({competitorPercent.toFixed(1)}%)</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-slate-400" />
            <div>
              <span className="text-sm text-slate-600">Generic</span>
              <span className="text-xs text-slate-400 ml-1">(Undecided)</span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-sm font-semibold text-slate-900">{formatNumber(generic)}</span>
            <span className="text-xs text-slate-400 ml-1">({genericPercent.toFixed(1)}%)</span>
          </div>
        </div>
      </div>

      {/* Insight */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-600">
          <span className="font-semibold text-ember-600">{formatNumber(competitors + generic)}</span> searches 
          going to competitors or undecided. Your opportunity to capture.
        </p>
      </div>
    </div>
  )
}

// ===========================================
// TAM Trend Chart (Dual Axis)
// Background: Total Market (grey area)
// Foreground: Your Brand (green line)
// ===========================================
interface TAMTrendChartProps {
  data: Array<{ week: string; yourBrand: number; tam: number }>
  totalTAM: number
  tamGrowth: number
  brandName?: string
}

const chartColors = {
  brand: '#2d6e40',
  tam: '#bdc1c6',
  grid: '#e8eaed',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-elevated border border-slate-200 p-3">
      <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-slate-600">
              {entry.dataKey === 'yourBrand' ? 'Your Brand' : 'Total Market'}
            </span>
          </div>
          <span className="text-sm font-semibold text-slate-900 font-mono">
            {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function TAMTrendChart({ data, totalTAM, tamGrowth, brandName = 'Jacks.nl' }: TAMTrendChartProps) {
  const isGrowthPositive = tamGrowth >= 0
  
  // Calculate brand performance
  const firstBrand = data[0]?.yourBrand || 0
  const lastBrand = data[data.length - 1]?.yourBrand || 0
  const brandGrowth = ((lastBrand - firstBrand) / firstBrand * 100)
  const isOutperforming = brandGrowth > tamGrowth

  return (
    <div className="card p-5 h-full opacity-0 animate-slide-up animation-delay-300">
      {/* Header with TAM stats */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-slate-900">Market Opportunity</h3>
          <p className="text-xs text-slate-500 mt-0.5">The Tide (TAM) vs The Boat (Your Brand)</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 justify-end">
            <span className="text-2xl font-display font-bold text-slate-900">
              {formatNumber(totalTAM)}
            </span>
            <div className={cn(
              'flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded',
              isGrowthPositive ? 'text-forest-700 bg-forest-100' : 'text-red-700 bg-red-100'
            )}>
              {isGrowthPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {tamGrowth.toFixed(1)}%
            </div>
          </div>
          <p className="text-xs text-slate-400">searches this week</p>
        </div>
      </div>

      {/* Status badge */}
      <div className="mb-3">
        <span className={cn(
          'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
          isOutperforming ? 'bg-forest-100 text-forest-700' : 'bg-ember-100 text-ember-700'
        )}>
          {isOutperforming ? '✓ Outperforming Market' : '⚠ Trailing Market'}
        </span>
      </div>

      {/* Chart */}
      <div className="h-[200px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="tamGradient2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors.tam} stopOpacity={0.4} />
                <stop offset="95%" stopColor={chartColors.tam} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={chartColors.grid}
              vertical={false}
            />
            
            <XAxis 
              dataKey="week" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9aa0a6' }}
              dy={10}
            />
            
            {/* Left Y-Axis - TAM */}
            <YAxis 
              yAxisId="tam"
              orientation="left"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: '#9aa0a6' }}
              tickFormatter={(value) => formatNumber(value)}
              domain={['dataMin - 5000', 'dataMax + 5000']}
              width={45}
            />
            
            {/* Right Y-Axis - Your Brand */}
            <YAxis 
              yAxisId="brand"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: chartColors.brand }}
              tickFormatter={(value) => formatNumber(value)}
              domain={['dataMin - 500', 'dataMax + 500']}
              width={45}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* TAM - Grey Area (The Tide) */}
            <Area
              yAxisId="tam"
              type="monotone"
              dataKey="tam"
              name="Total Market"
              stroke={chartColors.tam}
              strokeWidth={1}
              fill="url(#tamGradient2)"
              dot={false}
            />
            
            {/* Your Brand - Green Line (The Boat) */}
            <Line
              yAxisId="brand"
              type="monotone"
              dataKey="yourBrand"
              name="yourBrand"
              stroke={chartColors.brand}
              strokeWidth={3}
              dot={false}
              activeDot={{ 
                r: 5, 
                fill: chartColors.brand,
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Footer legend */}
      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 bg-forest-600 rounded" />
          <span className="text-slate-600">{brandName}: <span className="font-semibold text-forest-600">+{brandGrowth.toFixed(1)}%</span></span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-slate-200 rounded-sm opacity-60" />
          <span className="text-slate-500">TAM: <span className="font-medium">+{tamGrowth.toFixed(1)}%</span></span>
        </div>
      </div>
    </div>
  )
}
