import { Target } from 'lucide-react';
import { cn } from '../../lib/utils';
import { InfoTooltip } from '../InfoTooltip';
import {
  BrewedContextData,
  StoryInsights,
  calculateStoryInsights,
  formatVelocity,
  formatCompactNumber,
} from './types';

interface ThisWeekStoryProps {
  data: BrewedContextData;
}

export function ThisWeekStory({ data }: ThisWeekStoryProps) {
  const insights = calculateStoryInsights(data);

  return (
    <div className="card p-5 opacity-0 animate-slide-up animation-delay-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-slate-900">
          This Week's Story
        </h3>
        <InfoTooltip text="Compares your weekly growth against total market growth. Velocity = week-over-week % change in search volume." />
      </div>

      <div className="space-y-4">
        {/* Market vs Your Growth */}
        <MarketComparison insights={insights} />

        {/* Position & Gaps */}
        <PositionGaps insights={insights} />
      </div>
    </div>
  );
}

function MarketComparison({ insights }: { insights: StoryInsights }) {
  const { marketVelocity, brandVelocity, outperformanceRatio, isOutperforming } = insights;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-slate-100">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-600">Market</span>
        <span className={cn(
          'font-mono font-semibold',
          marketVelocity >= 0 ? 'text-forest-600' : 'text-red-600'
        )}>
          {formatVelocity(marketVelocity)}
        </span>
        <span className="text-slate-400">(WoW)</span>
        <span className="text-slate-400">→</span>
        <span className="text-slate-600">You</span>
        <span className={cn(
          'font-mono font-semibold',
          brandVelocity >= 0 ? 'text-forest-600' : 'text-red-600'
        )}>
          {formatVelocity(brandVelocity)}
        </span>
        <span className="text-slate-400">(WoW)</span>
      </div>

      <div className={cn(
        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium whitespace-nowrap',
        isOutperforming
          ? 'bg-forest-100 text-forest-700'
          : 'bg-red-100 text-red-700'
      )}>
        {isOutperforming ? (
          <>
            <span>Outpacing market by {outperformanceRatio.toFixed(1)}x</span>
            <span className="text-base">&#10003;</span>
          </>
        ) : (
          <>
            <span>Trailing market</span>
            <span className="text-base">&#10007;</span>
          </>
        )}
      </div>
    </div>
  );
}

function PositionGaps({ insights }: { insights: StoryInsights }) {
  const { brandRank, totalBrands, brandAboveYou, gapToAbove, leader, gapToFirst } = insights;

  return (
    <div className="pt-4 border-t border-slate-100">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Your Position */}
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100">
            <Target className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <span className="text-xs text-slate-500">Your Position</span>
            <div className="font-semibold text-slate-900">
              #{brandRank} of {totalBrands}
            </div>
          </div>
        </div>

        {/* Gap to next rank */}
        {brandAboveYou && gapToAbove !== null && gapToAbove > 0 && (
          <div className="flex-1">
            <span className="text-xs text-slate-500">Gap to #{brandRank - 1} ({brandAboveYou.name})</span>
            <div className="font-mono font-semibold text-slate-900">
              {formatCompactNumber(gapToAbove)} searches
            </div>
          </div>
        )}

        {/* Gap to #1 */}
        {leader && gapToFirst !== null && gapToFirst > 0 && brandRank !== 1 && (
          <div className="flex-1">
            <span className="text-xs text-slate-500">Gap to #1 ({leader.name})</span>
            <div className="font-mono font-semibold text-slate-900">
              {formatCompactNumber(gapToFirst)} searches
            </div>
          </div>
        )}

        {/* If you're #1 */}
        {brandRank === 1 && (
          <div className="flex-1">
            <span className="text-xs text-slate-500">Status</span>
            <div className="font-semibold text-forest-600">
              You're the market leader!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
