import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn, formatNumber, formatPercentage } from '../lib/utils'

// ===========================================
// Card A: Share of Search (Hero Metric)
// ===========================================
interface ShareOfSearchCardProps {
  current: number
  change: number
  weeklyHistory: number[]
}

export function ShareOfSearchCard({ current, change, weeklyHistory }: ShareOfSearchCardProps) {
  const isPositive = change >= 0
  const maxVal = Math.max(...weeklyHistory)
  const minVal = Math.min(...weeklyHistory)
  const range = maxVal - minVal || 1

  return (
    <div className="card p-6 relative overflow-hidden opacity-0 animate-slide-up">
      {/* Background sparkline */}
      <div className="absolute inset-0 flex items-end opacity-20">
        <svg className="w-full h-24" preserveAspectRatio="none" viewBox={`0 0 ${weeklyHistory.length - 1} 100`}>
          <defs>
            <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2d6e40" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#2d6e40" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path
            d={weeklyHistory
              .map((val, i) => {
                const x = i
                const y = 100 - ((val - minVal) / range) * 100
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
              })
              .join(' ') + ` L ${weeklyHistory.length - 1} 100 L 0 100 Z`}
            fill="url(#sparklineGradient)"
          />
          <path
            d={weeklyHistory
              .map((val, i) => {
                const x = i
                const y = 100 - ((val - minVal) / range) * 100
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
              })
              .join(' ')}
            fill="none"
            stroke="#2d6e40"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Share of Search</p>
            <p className="text-xs text-slate-400 mt-0.5">Your slice of total market</p>
          </div>
        </div>

        <div className="mt-4">
          <span className="text-5xl font-display font-bold text-slate-900">
            {current.toFixed(1)}%
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full',
            isPositive ? 'text-forest-700 bg-forest-100' : 'text-red-700 bg-red-100'
          )}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {formatPercentage(change, true)}
          </div>
          <span className="text-sm text-slate-500">vs Q3 avg</span>
        </div>
      </div>
    </div>
  )
}

// ===========================================
// Card B: Brand Search Volume (Revenue Proxy)
// ===========================================
interface BrandVolumeCardProps {
  volume: number
  marketValue: number
  growth: number
}

export function BrandVolumeCard({ volume, marketValue, growth }: BrandVolumeCardProps) {
  const isPositive = growth >= 0

  return (
    <div className="card p-6 opacity-0 animate-slide-up animation-delay-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Brand Search Volume</p>
          <p className="text-xs text-slate-400 mt-0.5">Direct brand interest</p>
        </div>
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
          isPositive ? 'text-forest-700 bg-forest-100' : 'text-red-700 bg-red-100'
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {formatPercentage(growth, true)}
        </div>
      </div>

      <div className="mt-4">
        <span className="text-5xl font-display font-bold text-slate-900">
          {formatNumber(volume)}
        </span>
        <span className="text-lg text-slate-400 ml-1">searches</span>
      </div>

      {/* Market Value - Revenue Proxy */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-slate-500">Est. Market Value</span>
          <div>
            <span className="text-2xl font-display font-semibold text-forest-700">
              €{formatNumber(marketValue)}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-1">Based on €3.50 industry CPC</p>
      </div>
    </div>
  )
}
