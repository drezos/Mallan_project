import { Lightbulb, TrendingUp, AlertTriangle, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { InfoTooltip } from '../InfoTooltip';
import {
  BrewedContextData,
  TakeawayResult,
  calculateStoryInsights,
  calculateTakeaways,
} from './types';

interface KeyTakeawaysProps {
  data: BrewedContextData;
}

export function KeyTakeaways({ data }: KeyTakeawaysProps) {
  const insights = calculateStoryInsights(data);
  const takeaways = calculateTakeaways(data, insights);

  return (
    <div className="card p-5 opacity-0 animate-slide-up animation-delay-500">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100">
            <Lightbulb className="w-4 h-4 text-amber-600" />
          </div>
          <h3 className="font-display font-semibold text-slate-900">
            Key Takeaways
          </h3>
        </div>
        <InfoTooltip text="AI-generated insights based on your performance, market trends, and competitive position. Updated with each data refresh." />
      </div>

      <div className="space-y-3">
        {takeaways.map((takeaway, index) => (
          <TakeawayItem
            key={index}
            number={index + 1}
            takeaway={takeaway}
          />
        ))}

        {takeaways.length === 0 && (
          <p className="text-sm text-slate-500 italic">
            Not enough data to generate takeaways.
          </p>
        )}
      </div>
    </div>
  );
}

function TakeawayItem({
  number,
  takeaway,
}: {
  number: number;
  takeaway: TakeawayResult;
}) {
  const iconMap = {
    positive: TrendingUp,
    warning: AlertTriangle,
    neutral: Minus,
  };

  const colorMap = {
    positive: {
      bg: 'bg-forest-50',
      border: 'border-forest-200',
      icon: 'text-forest-600',
      number: 'bg-forest-100 text-forest-700',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      icon: 'text-amber-600',
      number: 'bg-amber-100 text-amber-700',
    },
    neutral: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      icon: 'text-slate-500',
      number: 'bg-slate-100 text-slate-600',
    },
  };

  const Icon = iconMap[takeaway.type];
  const colors = colorMap[takeaway.type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg border',
        colors.bg,
        colors.border
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0',
          colors.number
        )}
      >
        {number}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800">{takeaway.text}</p>
      </div>

      <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', colors.icon)} />
    </div>
  );
}
