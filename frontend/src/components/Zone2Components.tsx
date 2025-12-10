import { 
  ComposedChart,
  Area, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { cn, formatNumber } from '../lib/utils'

// ===========================================
// Traffic Quality Mix (Doughnut Chart)
// ===========================================
interface TrafficMixCardProps {
  brandShare: number
  genericShare: number
  brandVolume: number
  genericVolume: number
  genericTrend: number
  insight: string
}

const COLORS = {
  brand: '#2d6e40',    // Forest green
  generic: '#9aa0a6',  // Slate grey
}

export function TrafficMixCard({
  brandShare,
  genericShare,
  brandVolume,
  genericVolume,
  genericTrend,
  insight,
}: TrafficMixCardProps) {
  const data = [
    { name: 'Brand', value: brandShare, volume: brandVolume, color: COLORS.brand },
    { name: 'Generic', value: genericShare, volume: genericVolume, color: COLORS.generic },
  ]

  return (
    <div className="card p-5 h-full opacity-0 animate-slide-up animation-delay-200">
      <div className="mb-4">
        <h3 className="font-display font-semibold text-slate-900">Traffic Quality Mix</h3>
        <p className="text-xs text-slate-500 mt-0.5">Brand vs Generic acquisition</p>
      </div>

      {/* Doughnut Chart */}
      <div className="flex items-center justify-center">
        <div className="relative w-40 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-display font-bold text-forest-700">{brandShare}%</span>
            <span className="text-xs text-slate-500">Brand</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-forest-600" />
            <span className="text-slate-600">Brand</span>
          </div>
          <span className="font-mono font-medium text-slate-900">{formatNumber(brandVolume)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-400" />
            <span className="text-slate-600">Generic</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-medium text-slate-900">{formatNumber(genericVolume)}</span>
            <span className={cn(
              'text-xs font-medium',
              genericTrend < 0 ? 'text-red-600' : 'text-forest-600'
            )}>
              {genericTrend > 0 ? '+' : ''}{genericTrend}%
            </span>
          </div>
        </div>
      </div>

      {/* Insight */}
      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
        <div className="flex items-start gap-2">
          {genericTrend < 0 ? (
            <TrendingDown className="w-4 h-4 text-ember-600 mt-0.5 shrink-0" />
          ) : (
            <TrendingUp className="w-4 h-4 text-forest-600 mt-0.5 shrink-0" />
          )}
          <p className="text-xs text-slate-600">{insight}</p>
        </div>
      </div>
    </div>
  )
}

// ===========================================
// Market Velocity Chart (Dual Axis)
// TAM (grey area) + Your Brand (green line)
// ===========================================
interface ChartDataPoint {
  week: string
  yourBrand: number
  tam: number
}

interface MarketVelocityChartProps {
  data: ChartDataPoint[]
  brandName?: string
}

const chartColors = {
  brand: '#2d6e40',
  tam: '#bdc1c6',
  tamFill: 'rgba(189, 193, 198, 0.3)',
  grid: '#e8eaed',
}

// Custom tooltip
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
              {entry.name === 'yourBrand' ? 'Your Brand' : 'Total Market'}
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

export function MarketVelocityChart({ data, brandName = 'Jacks.nl' }: MarketVelocityChartProps) {
  // Calculate growth stats
  const firstBrand = data[0]?.yourBrand || 0
  const lastBrand = data[data.length - 1]?.yourBrand || 0
  const brandGrowth = ((lastBrand - firstBrand) / firstBrand * 100).toFixed(1)
  
  const firstTam = data[0]?.tam || 0
  const lastTam = data[data.length - 1]?.tam || 0
  const tamGrowth = ((lastTam - firstTam) / firstTam * 100).toFixed(1)
  
  const isOutperforming = Number(brandGrowth) > Number(tamGrowth)

  return (
    <div className="card p-5 h-full opacity-0 animate-slide-up animation-delay-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-slate-900">Market Velocity vs Performance</h3>
          <p className="text-xs text-slate-500 mt-0.5">The Tide (TAM) vs The Boat (Your Brand)</p>
        </div>
        <div className={cn(
          'px-2.5 py-1 rounded-full text-xs font-semibold',
          isOutperforming ? 'bg-forest-100 text-forest-700' : 'bg-red-100 text-red-700'
        )}>
          {isOutperforming ? 'Outperforming Market' : 'Trailing Market'}
        </div>
      </div>

      <div className="h-[240px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="tamGradient" x1="0" y1="0" x2="0" y2="1">
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
              tick={{ fontSize: 11, fill: '#9aa0a6' }}
              dy={10}
            />
            
            {/* Left Y-Axis - TAM (grey, larger scale) */}
            <YAxis 
              yAxisId="tam"
              orientation="left"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9aa0a6' }}
              tickFormatter={(value) => formatNumber(value)}
              domain={['dataMin - 5000', 'dataMax + 5000']}
              width={50}
            />
            
            {/* Right Y-Axis - Your Brand (smaller scale) */}
            <YAxis 
              yAxisId="brand"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: chartColors.brand }}
              tickFormatter={(value) => formatNumber(value)}
              domain={['dataMin - 500', 'dataMax + 500']}
              width={50}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* TAM - Grey Area (The Tide / Background) */}
            <Area
              yAxisId="tam"
              type="monotone"
              dataKey="tam"
              name="Total Market"
              stroke={chartColors.tam}
              strokeWidth={1}
              fill="url(#tamGradient)"
              dot={false}
            />
            
            {/* Your Brand - Green Line (The Boat / Foreground) */}
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

      {/* Footer stats */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-forest-600 rounded" />
            <span className="text-slate-600">{brandName}: <span className="font-semibold text-forest-600">+{brandGrowth}%</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-slate-300/50 rounded-sm" />
            <span className="text-slate-500">TAM: <span className="font-medium">+{tamGrowth}%</span></span>
          </div>
        </div>
      </div>
    </div>
  )
}
