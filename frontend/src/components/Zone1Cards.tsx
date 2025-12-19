import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus, HelpCircle } from 'lucide-react'
import { cn, formatNumber, formatPercentage } from '../lib/utils'

// ===========================================
// InfoTooltip Component
// ===========================================
interface InfoTooltipProps {
  text: string
  className?: string
}

function InfoTooltip({ text, className }: InfoTooltipProps) {
  return (
    <div className={cn("group relative inline-flex", className)}>
      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
      <div className="pointer-events-none absolute right-0 top-6 z-50 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
          {text}
          <div className="absolute -top-1 right-2 w-2 h-2 bg-slate-800 rotate-45" />
        </div>
      </div>
    </div>
  )
}

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
            <p className="text-sm font-medium text-slate-500">Market Share</p>
            <p className="text-xs text-slate-400 mt-0.5">Share of Search</p>
          </div>
          <InfoTooltip text="Your share of all tracked brand searches in the Dutch iGaming market. Calculated as your brand volume divided by total market volume." />
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
// Card B: Brand Search Volume with Market Rank
// ===========================================
interface BrandVolumeCardProps {
  volume: number
  growth: number
  marketRank: {
    current: number
    previous: number
    change: number
    totalCompetitors: number
  }
}

export function BrandVolumeCard({ volume, growth, marketRank }: BrandVolumeCardProps) {
  const isPositive = growth >= 0
  const rankImproved = marketRank.change > 0
  const rankDeclined = marketRank.change < 0

  return (
    <div className="card p-6 opacity-0 animate-slide-up animation-delay-100">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <div>
            <p className="text-sm font-medium text-slate-500">Brand Search Volume</p>
            <p className="text-xs text-slate-400 mt-0.5">Direct brand interest</p>
          </div>
          <InfoTooltip text="Total monthly searches for your brand keywords (e.g., 'Jacks Casino', 'Jacks.nl'). Higher volume indicates stronger brand awareness." />
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

      {/* Market Rank */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-slate-500">Market Rank</span>
            <InfoTooltip text="Your position among tracked competitors, ranked by search volume. Moving up means you're gaining visibility versus competitors." />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-display font-bold text-slate-900">
              #{marketRank.current}
            </span>
            <span className="text-sm text-slate-400">
              of {marketRank.totalCompetitors}
            </span>
            {/* Rank change badge */}
            {marketRank.change !== 0 && (
              <div className={cn(
                'flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded',
                rankImproved ? 'text-forest-700 bg-forest-100' : 'text-red-700 bg-red-100'
              )}>
                {rankImproved ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {Math.abs(marketRank.change)}
              </div>
            )}
            {marketRank.change === 0 && (
              <div className="flex items-center gap-0.5 text-xs font-medium text-slate-400 px-1.5 py-0.5 rounded bg-slate-100">
                <Minus className="w-3 h-3" />
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          {rankImproved && `Up ${marketRank.change} place${marketRank.change > 1 ? 's' : ''} from last week`}
          {rankDeclined && `Down ${Math.abs(marketRank.change)} place${Math.abs(marketRank.change) > 1 ? 's' : ''} from last week`}
          {marketRank.change === 0 && 'Same position as last week'}
        </p>
      </div>
    </div>
  )
}
