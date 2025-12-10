import { useState } from 'react'
import { 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from 'recharts'
import { formatNumber } from '../lib/utils'

interface CompetitiveTrendChartProps {
  data: Array<Record<string, number | string>>
  brandName: string
  competitors: string[]
  topRivals: string[]
}

// Color palette for competitors
const competitorColors: Record<string, string> = {
  'Jacks.nl': '#2d6e40',
  'Holland Casino': '#64748b',
  'Toto': '#94a3b8',
  'Unibet': '#a1a1aa',
  'BetCity': '#ef4444', // Red for high threat
  'Bet365': '#9ca3af',
  'Circus': '#a8a29e',
  'Kansino': '#fb923c', // Orange for watching
  '711': '#d4d4d8',
  'BetMGM': '#c4b5fd',
  'LeoVegas': '#d6d3d1',
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null

  // Sort by value descending
  const sorted = [...payload].sort((a, b) => (b.value || 0) - (a.value || 0))

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-elevated border border-slate-200 p-3 max-h-64 overflow-y-auto">
      <p className="text-xs font-medium text-slate-500 mb-2 border-b border-slate-100 pb-2">{label}</p>
      {sorted.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full shrink-0" 
              style={{ backgroundColor: entry.stroke }}
            />
            <span className={`text-xs ${entry.dataKey === 'Jacks.nl' ? 'font-semibold text-forest-700' : 'text-slate-600'}`}>
              {entry.dataKey}
            </span>
          </div>
          <span className={`text-xs font-mono ${entry.dataKey === 'Jacks.nl' ? 'font-bold text-forest-700' : 'text-slate-900'}`}>
            {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function CompetitiveTrendChart({ data, brandName, competitors, topRivals }: CompetitiveTrendChartProps) {
  const [hoveredLine, setHoveredLine] = useState<string | null>(null)

  // Determine line styles based on hover state
  const getLineStyle = (name: string) => {
    const isYourBrand = name === brandName
    const isTopRival = topRivals.includes(name)
    const isHovered = hoveredLine === name
    const anyHovered = hoveredLine !== null

    if (isYourBrand) {
      return {
        strokeWidth: 3,
        opacity: 1,
        strokeDasharray: undefined,
      }
    }

    if (anyHovered) {
      return {
        strokeWidth: isHovered ? 2.5 : 1,
        opacity: isHovered ? 1 : 0.2,
        strokeDasharray: undefined,
      }
    }

    return {
      strokeWidth: isTopRival ? 2 : 1,
      opacity: isTopRival ? 0.8 : 0.3,
      strokeDasharray: isTopRival ? undefined : '4 4',
    }
  }

  return (
    <div className="card p-4 h-full opacity-0 animate-slide-up animation-delay-500">
      <div className="mb-3">
        <h3 className="font-display font-semibold text-slate-900 text-sm">Volume Trend: Us vs. Top 10</h3>
        <p className="text-xs text-slate-500">Hover to highlight competitor</p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mb-3">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0.5 bg-forest-600 rounded" />
          <span className="text-xs font-medium text-forest-700">{brandName}</span>
        </div>
        {topRivals.map(rival => (
          <div key={rival} className="flex items-center gap-1.5">
            <div 
              className="w-4 h-0.5 rounded opacity-70" 
              style={{ backgroundColor: competitorColors[rival] || '#94a3b8' }}
            />
            <span className="text-xs text-slate-500">{rival}</span>
          </div>
        ))}
        <span className="text-xs text-slate-400">+ {competitors.length - topRivals.length} more</span>
      </div>

      {/* Chart */}
      <div className="h-[240px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data} 
            margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
            onMouseLeave={() => setHoveredLine(null)}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e8eaed"
              vertical={false}
            />
            
            <XAxis 
              dataKey="week" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9aa0a6' }}
              dy={10}
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 9, fill: '#9aa0a6' }}
              tickFormatter={(value) => formatNumber(value)}
              width={40}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Competitor lines (render first so brand is on top) */}
            {competitors.map((comp) => {
              const style = getLineStyle(comp)
              return (
                <Line
                  key={comp}
                  type="monotone"
                  dataKey={comp}
                  stroke={competitorColors[comp] || '#94a3b8'}
                  strokeWidth={style.strokeWidth}
                  strokeOpacity={style.opacity}
                  strokeDasharray={style.strokeDasharray}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 1 }}
                  onMouseEnter={() => setHoveredLine(comp)}
                />
              )
            })}
            
            {/* Your brand line (always on top) */}
            <Line
              type="monotone"
              dataKey={brandName}
              stroke={competitorColors[brandName]}
              strokeWidth={3}
              dot={false}
              activeDot={{ 
                r: 5, 
                fill: competitorColors[brandName],
                stroke: '#fff',
                strokeWidth: 2,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
