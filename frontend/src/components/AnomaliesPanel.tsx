import { AlertTriangle, TrendingUp, Search, Zap, Info } from 'lucide-react'
import { cn, formatRelativeTime } from '../lib/utils'

interface Anomaly {
  id: string
  type: string
  impact: 'high' | 'info'
  title: string
  message: string
  driver?: string
  metric?: string
  timestamp: string
}

interface AnomaliesPanelProps {
  anomalies: Anomaly[]
}

const anomalyIcons: Record<string, typeof AlertTriangle> = {
  competitor_surge: AlertTriangle,
  intent_shift: Search,
  competitor_growth: TrendingUp,
  market_trend: Zap,
}

export function AnomaliesPanel({ anomalies }: AnomaliesPanelProps) {
  const highImpact = anomalies.filter(a => a.impact === 'high')
  const forInfo = anomalies.filter(a => a.impact === 'info')

  return (
    <div className="card p-4 h-full flex flex-col opacity-0 animate-slide-up animation-delay-500">
      <div className="mb-3">
        <h3 className="font-display font-semibold text-slate-900 text-sm">Market Anomalies</h3>
        <p className="text-xs text-slate-500">Statistical outliers</p>
      </div>

      {/* Scrollable feed */}
      <div className="flex-1 overflow-y-auto scrollbar-thin space-y-2 -mr-2 pr-2">
        {/* High Impact */}
        {highImpact.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-red-700 uppercase tracking-wider">
                High Impact
              </span>
            </div>
            {highImpact.map((anomaly) => (
              <AnomalyItem key={anomaly.id} anomaly={anomaly} variant="high" />
            ))}
          </div>
        )}

        {/* For Info */}
        {forInfo.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Info className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                For Info
              </span>
            </div>
            {forInfo.map((anomaly) => (
              <AnomalyItem key={anomaly.id} anomaly={anomaly} variant="info" />
            ))}
          </div>
        )}

        {anomalies.length === 0 && (
          <div className="text-center py-6 text-slate-400">
            <p className="text-xs">No anomalies detected</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Individual anomaly item
interface AnomalyItemProps {
  anomaly: Anomaly
  variant: 'high' | 'info'
}

function AnomalyItem({ anomaly, variant }: AnomalyItemProps) {
  const Icon = anomalyIcons[anomaly.type] || AlertTriangle

  return (
    <div
      className={cn(
        'p-2.5 rounded-lg border mb-2 transition-all hover:shadow-sm cursor-pointer',
        variant === 'high' 
          ? 'bg-red-50 border-red-200 hover:border-red-300' 
          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
      )}
    >
      <div className="flex items-start gap-2">
        <div className={cn(
          'p-1 rounded',
          variant === 'high' ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-500'
        )}>
          <Icon className="w-3 h-3" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn(
              'text-xs font-semibold truncate',
              variant === 'high' ? 'text-red-900' : 'text-slate-700'
            )}>
              {anomaly.title}
            </h4>
            {anomaly.metric && (
              <span className={cn(
                'text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0',
                variant === 'high' ? 'bg-red-200 text-red-700' : 'bg-slate-200 text-slate-600'
              )}>
                {anomaly.metric}
              </span>
            )}
          </div>
          
          <p className={cn(
            'text-[11px] mt-0.5',
            variant === 'high' ? 'text-red-700' : 'text-slate-500'
          )}>
            {anomaly.message}
          </p>
          
          {anomaly.driver && (
            <p className={cn(
              'text-[10px] mt-1 font-medium',
              variant === 'high' ? 'text-red-600' : 'text-slate-400'
            )}>
              Driver: {anomaly.driver}
            </p>
          )}
          
          <p className="text-[10px] text-slate-400 mt-1">
            {formatRelativeTime(anomaly.timestamp)}
          </p>
        </div>
      </div>
    </div>
  )
}
