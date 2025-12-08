import { AlertTriangle, TrendingUp, Search, Zap } from 'lucide-react'
import { cn, formatRelativeTime, getSeverityClasses } from '../lib/utils'

interface Alert {
  id: string
  type: string
  severity: 'high' | 'medium' | 'low'
  title: string
  message: string
  competitor?: string
  metric?: string
  timestamp: string
}

interface AlertsPanelProps {
  alerts: Alert[]
  maxItems?: number
}

const alertIcons: Record<string, typeof AlertTriangle> = {
  emerging_threat: AlertTriangle,
  intent_shift: Search,
  competitive_pressure: TrendingUp,
  opportunity: Zap,
}

export function AlertsPanel({ alerts, maxItems = 4 }: AlertsPanelProps) {
  const displayAlerts = alerts.slice(0, maxItems)

  return (
    <div className="card p-5 opacity-0 animate-slide-up animation-delay-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-slate-900">
          Active Alerts
        </h3>
        <span className="text-sm text-slate-500">
          {alerts.length} total
        </span>
      </div>

      <div className="space-y-3">
        {displayAlerts.map((alert, index) => {
          const Icon = alertIcons[alert.type] || AlertTriangle
          const severityClasses = getSeverityClasses(alert.severity)

          return (
            <div
              key={alert.id}
              className={cn(
                'p-4 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer',
                severityClasses,
                'opacity-0 animate-slide-in-right'
              )}
              style={{ animationDelay: `${300 + index * 100}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  'p-2 rounded-lg',
                  alert.severity === 'high' && 'bg-red-100',
                  alert.severity === 'medium' && 'bg-ember-100',
                  alert.severity === 'low' && 'bg-forest-100'
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold truncate">
                      {alert.title}
                    </h4>
                    {alert.metric && (
                      <span className={cn(
                        'text-xs font-mono font-medium px-2 py-0.5 rounded',
                        alert.severity === 'high' && 'bg-red-200/60',
                        alert.severity === 'medium' && 'bg-ember-200/60',
                        alert.severity === 'low' && 'bg-forest-200/60'
                      )}>
                        {alert.metric}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-sm mt-1 opacity-80 line-clamp-2">
                    {alert.message}
                  </p>
                  
                  <p className="text-xs mt-2 opacity-60">
                    {formatRelativeTime(alert.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {alerts.length > maxItems && (
        <button className="mt-4 w-full py-2 text-sm font-medium text-forest-600 hover:text-forest-700 hover:bg-forest-50 rounded-lg transition-colors">
          View all {alerts.length} alerts →
        </button>
      )}
    </div>
  )
}
