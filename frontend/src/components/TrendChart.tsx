import { 
  ComposedChart,
  Area, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts'
import { chartColors, formatNumber } from '../lib/utils'

interface TrendDataPoint {
  week: string
  yourBrand: number
  genericMarket: number
  date: string
}

interface TrendChartProps {
  data: TrendDataPoint[]
  title: string
  subtitle?: string
  brandName?: string
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="custom-tooltip">
      <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-slate-600">{entry.name}</span>
          </div>
          <span className="text-sm font-semibold text-slate-900 font-mono">
            {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function TrendChart({ data, title, subtitle, brandName = 'Jacks.nl' }: TrendChartProps) {
  // Calculate stats for footer
  const firstBrand = data[0]?.yourBrand || 0
  const lastBrand = data[data.length - 1]?.yourBrand || 0
  const brandGrowth = ((lastBrand - firstBrand) / firstBrand * 100).toFixed(1)
  
  const firstMarket = data[0]?.genericMarket || 0
  const lastMarket = data[data.length - 1]?.genericMarket || 0
  const marketGrowth = ((lastMarket - firstMarket) / firstMarket * 100).toFixed(1)

  return (
    <div className="card p-5 opacity-0 animate-slide-up animation-delay-400">
      <div className="mb-6">
        <h3 className="font-display font-semibold text-slate-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="h-[280px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorYourBrand" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={chartColors.primary} 
                  stopOpacity={0.3}
                />
                <stop 
                  offset="95%" 
                  stopColor={chartColors.primary} 
                  stopOpacity={0.05}
                />
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
              tick={{ fontSize: 12, fill: '#9aa0a6' }}
              dy={10}
            />
            
            {/* Left Y-Axis - Your Brand (smaller scale) */}
            <YAxis 
              yAxisId="brand"
              orientation="left"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: chartColors.primary }}
              tickFormatter={(value) => formatNumber(value)}
              dx={-5}
              domain={['dataMin - 500', 'dataMax + 500']}
              label={{ 
                value: brandName, 
                angle: -90, 
                position: 'insideLeft',
                style: { fontSize: 10, fill: chartColors.primary }
              }}
            />
            
            {/* Right Y-Axis - Generic Market (larger scale) */}
            <YAxis 
              yAxisId="market"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: chartColors.secondary }}
              tickFormatter={(value) => formatNumber(value)}
              dx={5}
              domain={['dataMin - 2000', 'dataMax + 2000']}
              label={{ 
                value: 'Generic Market', 
                angle: 90, 
                position: 'insideRight',
                style: { fontSize: 10, fill: chartColors.secondary }
              }}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                paddingBottom: '20px',
                fontSize: '12px',
              }}
            />
            
            {/* Your brand - Area chart on left axis */}
            <Area
              yAxisId="brand"
              type="monotone"
              dataKey="yourBrand"
              name={brandName}
              stroke={chartColors.primary}
              strokeWidth={2.5}
              fill="url(#colorYourBrand)"
              dot={false}
              activeDot={{ 
                r: 5, 
                fill: chartColors.primary,
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />
            
            {/* Generic market - Line chart on right axis */}
            <Line
              yAxisId="market"
              type="monotone"
              dataKey="genericMarket"
              name="Generic Market"
              stroke={chartColors.secondary}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ 
                r: 4, 
                fill: chartColors.secondary,
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend/insight footer */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-forest-600" />
              <span className="text-slate-600">
                {brandName}: <span className="font-semibold text-forest-600">+{brandGrowth}%</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-ember-500" />
              <span className="text-slate-600">
                Market: <span className="font-medium text-ember-600">+{marketGrowth}%</span>
              </span>
            </div>
          </div>
          <span className={`font-medium ${Number(brandGrowth) > Number(marketGrowth) ? 'text-forest-600' : 'text-red-600'}`}>
            {Number(brandGrowth) > Number(marketGrowth) ? 'Outpacing market ↑' : 'Trailing market ↓'}
          </span>
        </div>
      </div>
    </div>
  )
}
