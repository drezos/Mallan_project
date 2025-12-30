import { Trophy, TrendingDown } from 'lucide-react'
import { InfoTooltip } from './InfoTooltip'

interface CompetitorHighlightsProps {
  fastestGrowing: { name: string; velocity: number }
  biggestDecline: { name: string; velocity: number }
}

export function CompetitorHighlights({ fastestGrowing, biggestDecline }: CompetitorHighlightsProps) {
  const formatVelocity = (velocity: number): string => {
    const sign = velocity >= 0 ? '+' : ''
    return `${sign}${velocity.toFixed(1)}% WoW`
  }

  return (
    <div className="card p-4 mb-4 opacity-0 animate-slide-up animation-delay-400">
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-semibold text-slate-900">Competitor Highlights</h3>
          <InfoTooltip
            text="Shows which competitors had the biggest velocity changes THIS WEEK. Fastest Growing = highest positive week-over-week change. Biggest Decline = most negative week-over-week change."
            position="right"
          />
        </div>
        <p className="text-xs text-slate-500 mt-0.5">This week's movers</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Fastest Growing */}
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Fastest Growing This Week</span>
          </div>
          <div className="font-display font-semibold text-slate-900">{fastestGrowing.name}</div>
          <div className="text-sm font-mono text-emerald-600">
            ({formatVelocity(fastestGrowing.velocity)})
          </div>
        </div>

        {/* Biggest Decline */}
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span>Biggest Decline This Week</span>
          </div>
          <div className="font-display font-semibold text-slate-900">{biggestDecline.name}</div>
          <div className="text-sm font-mono text-red-600">
            ({formatVelocity(biggestDecline.velocity)})
          </div>
        </div>
      </div>
    </div>
  )
}
