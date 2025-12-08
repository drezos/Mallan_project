import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn, formatPercentage, getScoreColor } from '../lib/utils'

interface MetricCardProps {
  title: string
  value: number | string
  change?: number
  changeLabel?: string
  suffix?: string
  type?: 'score' | 'percentage' | 'number'
  description?: string
  delay?: number
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  suffix,
  type = 'number',
  description,
  delay = 0,
}: MetricCardProps) {
  // Determine trend direction
  const trend = change !== undefined ? (change > 0 ? 'up' : change < 0 ? 'down' : 'neutral') : null
  
  // Format the display value
  const displayValue = type === 'score' 
    ? value 
    : type === 'percentage' 
      ? `${value}%` 
      : value

  return (
    <div 
      className={cn(
        'card p-5 opacity-0 animate-slide-up',
        delay && `animation-delay-${delay}`
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        {type === 'score' && (
          <div className={cn(
            'score-badge text-sm',
            getScoreColor(typeof value === 'number' ? value : 0)
          )}>
            {value}/10
          </div>
        )}
      </div>

      {/* Main value */}
      <div className="mt-3 flex items-baseline gap-1">
        <span className="metric-value text-3xl text-slate-900">
          {type !== 'score' && displayValue}
          {type === 'score' && (
            <span className="text-4xl">{value}</span>
          )}
        </span>
        {suffix && (
          <span className="text-lg text-slate-400 font-medium">{suffix}</span>
        )}
      </div>

      {/* Change indicator */}
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-2">
          <div className={cn(
            'flex items-center gap-1 text-sm font-medium rounded-full px-2 py-0.5',
            trend === 'up' && 'text-forest-600 bg-forest-50',
            trend === 'down' && 'text-red-600 bg-red-50',
            trend === 'neutral' && 'text-slate-500 bg-slate-100'
          )}>
            {trend === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
            {trend === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
            {trend === 'neutral' && <Minus className="w-3.5 h-3.5" />}
            <span>{formatPercentage(Math.abs(change))}</span>
          </div>
          {changeLabel && (
            <span className="text-sm text-slate-500">{changeLabel}</span>
          )}
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      )}
    </div>
  )
}
