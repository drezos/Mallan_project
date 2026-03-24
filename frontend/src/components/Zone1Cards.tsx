import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn, formatNumber, formatPercentage } from '../lib/utils'
import { useVolumeView } from '../contexts/VolumeViewContext'
import { InfoTooltip } from './InfoTooltip'

// ===========================================
// Card A: Share of Search (Hero Metric)
// ===========================================
interface ShareOfSearchCardProps {
  current: number
  change: number
  monthlyHistory: number[]
}

export function ShareOfSearchCard({ current, change, monthlyHistory }: ShareOfSearchCardProps) {
  const isPositive = change >= 0
  const maxVal = Math.max(...monthlyHistory)
  const minVal = Math.min(...monthlyHistory)
  const range = maxVal - minVal || 1

  return (
    <div className="card p-6 relative overflow-hidden opacity-0 animate-slide-up">
      {/* Background sparkline */}
      <div className="absolute inset-0 flex items-end opacity-20">
        <svg className="w-full h-24" preserveAspectRatio="none" viewBox={`0 0 ${monthlyHistory.length - 1} 100`}>
          <defs>
            <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2d6e40" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#2d6e40" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path
            d={monthlyHistory
              .map((val, i) => {
                const x = i
                const y = 100 - ((val - minVal) / range) * 100
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
              })
              .join(' ') + ` L ${monthlyHistory.length - 1} 100 L 0 100 Z`}
            fill="url(#sparklineGradient)"
          />
          <path
            d={monthlyHistory
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
            <p className="text-xs text-slate-400 mt-0.5">Share of Search (Monthly)</p>
          </div>
          <InfoTooltip text="Your share of all tracked brand searches in the Dutch iGaming market, based on monthly search volumes. Calculated as your brand's monthly volume divided by total market monthly volume." />
        </div>

        <div className="mt-4">
          <span className="text-5xl font-display font-bold text-slate-900">
            {current.toFixed(1)}%
          </span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full',
            isPositive ? 'text-brew-green bg-brew-green/10' : 'text-brew-red bg-brew-red/10'
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
  priorityKeyword?: string
  priorityVolume?: number
  growth: number
  marketRank: {
    current: number
    previous: number
    change: number
    totalCompetitors: number
  }
}

export function BrandVolumeCard({ volume, priorityKeyword, priorityVolume, growth, marketRank }: BrandVolumeCardProps) {
  const { volumeView } = useVolumeView()
  const isPositive = growth >= 0
  const rankImproved = marketRank.change > 0
  const rankDeclined = marketRank.change < 0

  const displayVolume = volumeView === 'priority' ? (priorityVolume || 0) : volume
  const isPriorityView = volumeView === 'priority'

  return (
    <div className="card p-6 opacity-0 animate-slide-up animation-delay-100">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <div>
            <p className="text-sm font-medium text-slate-500">
              {isPriorityView ? 'Priority Keyword Volume' : 'Brand Search Volume'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {isPriorityView ? 'Single highest-volume keyword (Monthly)' : 'Direct brand interest (Monthly)'}
            </p>
          </div>
          <InfoTooltip text={isPriorityView
            ? "Monthly search volume for your top-performing keyword. Useful for comparing with SEMrush data which shows single keyword volumes."
            : "Total monthly searches for your brand keywords (e.g., 'Jacks Casino', 'Jacks.nl'). Higher volume indicates stronger brand awareness."
          } />
        </div>
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
          isPositive ? 'text-brew-green bg-brew-green/10' : 'text-brew-red bg-brew-red/10'
        )}>
          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {formatPercentage(growth, true)} MoM
        </div>
      </div>

      <div className="mt-4">
        <span className="text-5xl font-display font-bold text-slate-900">
          {formatNumber(displayVolume)}
        </span>
        <span className="text-lg text-slate-400 ml-1">searches</span>
      </div>

      {/* Show priority keyword name when in priority view */}
      {isPriorityView && priorityKeyword && (
        <p className="text-xs text-slate-500 mt-1">
          Keyword: <span className="font-medium text-slate-700">"{priorityKeyword}"</span>
        </p>
      )}

      {/* Market Rank */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-slate-500">Market Rank</span>
            <InfoTooltip text="Your position among tracked competitors, ranked by monthly search volume. Moving up means you're gaining visibility versus competitors." />
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
                rankImproved ? 'text-brew-green bg-brew-green/10' : 'text-brew-red bg-brew-red/10'
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
          {rankImproved && `Up ${marketRank.change} place${marketRank.change > 1 ? 's' : ''} from last month`}
          {rankDeclined && `Down ${Math.abs(marketRank.change)} place${Math.abs(marketRank.change) > 1 ? 's' : ''} from last month`}
          {marketRank.change === 0 && 'Same position as last month'}
        </p>
      </div>
    </div>
  )
}
