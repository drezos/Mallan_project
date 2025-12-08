import { 
  AreaChart, 
  Area, 
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
  market: number
  date: string
}

interface TrendChartProps {
  data: TrendDataPoint[]
  title: string
  subtitle?: string
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="custom-tooltip">
      <p className="text-xs font-medium text-slate-500 mb-2">{label}</p>
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-4">
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

export function TrendChart({ data, title, subtitle }: TrendChartProps) {
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
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorYourBrand" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={chartColors.primary} 
                  stopOpacity={0.25}
                />
                <stop 
                  offset="95%" 
                  stopColor={chartColors.primary} 
                  stopOpacity={0.02}
                />
              </linearGradient>
              <linearGradient id="colorMarket" x1="0" y1="0" x2="0" y2="1">
                <stop 
                  offset="5%" 
                  stopColor={chartColors.secondary} 
                  stopOpacity={0.2}
                />
                <stop 
                  offset="95%" 
                  stopColor={chartColors.secondary} 
                  stopOpacity={0.02}
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
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9aa0a6' }}
              tickFormatter={(value) => formatNumber(value)}
              dx={-10}
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
            
            <Area
              type="monotone"
              dataKey="yourBrand"
              name="Jacks.nl"
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
            
            <Area
              type="monotone"
              dataKey="market"
              name="Market Total"
              stroke={chartColors.secondary}
              strokeWidth={2}
              strokeDasharray="5 5"
              fill="url(#colorMarket)"
              dot={false}
              activeDot={{ 
                r: 4, 
                fill: chartColors.secondary,
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend/insight footer */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-forest-600" />
            <span className="text-slate-600">Your brand is growing <span className="font-semibold text-forest-600">+34.8%</span> over 12 weeks</span>
          </div>
        </div>
        <span className="text-slate-500">Outpacing market (+18.6%)</span>
      </div>
    </div>
  )
}
