import { AlertTriangle, TrendingUp, Search, Zap, Info } from 'lucide-react'
import { cn, formatRelativeTime, formatNumber } from '../lib/utils'

interface Anomaly {
  id: string
  type: string
  impact: 'high' | 'info'
  title: string
  message: string
  driver?: string
  competitor?: string
  metric?: string
  volume?: number
  timestamp: string
  actionable: boolean
}

interface AnomaliesPanelProps {
  anomalies: Anomaly[]
}

const anomalyIcons: Record<string, typeof AlertTriangle> = {
  competitor_surge: AlertTriangle,
  intent_shift: Search,
  competitor_growth: TrendingUp,
  opportunity: Zap,
}

export function AnomaliesPanel({ anomalies }: AnomaliesPanelProps) {
  // Split by impact level
  const highImpact = anomalies.filter(a => a.impact === 'high')
  const forInfo = anomalies.filter(a => a.impact === 'info')

  return (
    <div className="card p-5 opacity-0 animate-slide-up animation-delay-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-slate-900">
            Market Anomalies
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistically significant changes
          </p>
        </div>
        <span className="text-sm text-slate-500">
          {anomalies.length} detected
        </span>
      </div>

      {/* High Impact Section */}
      {highImpact.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold text-red-700 uppercase tracking-wider">
              High Impact
            </span>
          </div>
          <div className="space-y-2">
            {highImpact.map((anomaly, index) => (
              <AnomalyCard 
                key={anomaly.id} 
                anomaly={anomaly} 
                index={index}
                variant="high"
              />
            ))}
          </div>
        </div>
      )}

      {/* For Info Section */}
      {forInfo.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              For Info
            </span>
          </div>
          <div className="space-y-2">
            {forInfo.map((anomaly, index) => (
              <AnomalyCard 
                key={anomaly.id} 
                anomaly={anomaly} 
                index={index}
                variant="info"
              />
            ))}
          </div>
        </div>
      )}

      {anomalies.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <p className="text-sm">No significant anomalies detected</p>
          <p className="text-xs mt-1">Market is stable</p>
        </div>
      )}
    </div>
  )
}

// Individual anomaly card
interface AnomalyCardProps {
  anomaly: Anomaly
  index: number
  variant: 'high' | 'info'
}

function AnomalyCard({ anomaly, index, variant }: AnomalyCardProps) {
  const Icon = anomalyIcons[anomaly.type] || AlertTriangle
  
  const variantClasses = {
    high: {
      container: 'bg-red-50 border-red-200 hover:border-red-300',
      icon: 'bg-red-100 text-red-600',
      metric: 'bg-red-200/60 text-red-700',
      driver: 'text-red-600',
    },
    info: {
      container: 'bg-slate-50 border-slate-200 hover:border-slate-300',
      icon: 'bg-slate-100 text-slate-500',
      metric: 'bg-slate-200/60 text-slate-600',
      driver: 'text-slate-500',
    },
  }
  
  const classes = variantClasses[variant]

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-all duration-200 cursor-pointer',
        classes.container,
        'opacity-0 animate-slide-in-right'
      )}
      style={{ animationDelay: `${300 + index * 100}ms` }}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-1.5 rounded-lg', classes.icon)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-slate-900 truncate">
              {anomaly.title}
            </h4>
            {anomaly.metric && (
              <span className={cn(
                'text-xs font-mono font-medium px-2 py-0.5 rounded shrink-0',
                classes.metric
              )}>
                {anomaly.metric}
              </span>
            )}
          </div>
          
          <p className="text-sm text-slate-600 mt-0.5 line-clamp-1">
            {anomaly.message}
          </p>
          
          {/* Driver attribution */}
          {anomaly.driver && (
            <p className={cn('text-xs mt-1.5 font-medium', classes.driver)}>
              Driver: {anomaly.driver}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-400">
              {formatRelativeTime(anomaly.timestamp)}
            </p>
            {anomaly.volume && (
              <p className="text-xs text-slate-400">
                Vol: {formatNumber(anomaly.volume)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
