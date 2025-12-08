import { TrendingUp, TrendingDown, Minus, AlertTriangle, Eye } from 'lucide-react'
import { cn, formatNumber, formatPercentage, getStatusClasses } from '../lib/utils'

interface Competitor {
  id: string
  name: string
  searchVolume: number
  growth: number
  trend: 'up' | 'down' | 'stable' | 'spike'
  status: 'normal' | 'watching' | 'threat'
  marketShare: number
}

interface CompetitorTableProps {
  competitors: Competitor[]
  brandData: {
    name: string
    searchVolume: number
    growth: number
    trend: 'up' | 'down' | 'stable'
    marketShare: number
  }
}

export function CompetitorTable({ competitors, brandData }: CompetitorTableProps) {
  // Combine brand with competitors and sort by market share
  const allEntities = [
    { ...brandData, id: 'your-brand', status: 'normal' as const, isYourBrand: true },
    ...competitors.map(c => ({ ...c, isYourBrand: false })),
  ].sort((a, b) => b.marketShare - a.marketShare)

  const getTrendIcon = (trend: string, growth: number) => {
    if (trend === 'spike') {
      return <AlertTriangle className="w-4 h-4 text-red-500" />
    }
    if (growth > 0) {
      return <TrendingUp className="w-4 h-4 text-forest-500" />
    }
    if (growth < 0) {
      return <TrendingDown className="w-4 h-4 text-red-500" />
    }
    return <Minus className="w-4 h-4 text-slate-400" />
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'threat':
        return 'High Threat'
      case 'watching':
        return 'Watching'
      default:
        return 'Normal'
    }
  }

  return (
    <div className="card overflow-hidden opacity-0 animate-slide-up animation-delay-300">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-display font-semibold text-slate-900">
          Competitor Snapshot
        </h3>
        <p className="text-sm text-slate-500 mt-0.5">Last 7 days performance</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                Brand
              </th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                Search Vol.
              </th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                Growth
              </th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                Market Share
              </th>
              <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {allEntities.map((entity) => {
              const statusClasses = getStatusClasses(entity.status as 'normal' | 'watching' | 'threat')
              const isYourBrand = 'isYourBrand' in entity && entity.isYourBrand

              return (
                <tr
                  key={entity.id}
                  className={cn(
                    'hover:bg-slate-50/50 transition-colors group',
                    isYourBrand && 'bg-forest-50/30'
                  )}
                >
                  {/* Brand name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold',
                        isYourBrand 
                          ? 'bg-forest-600 text-white' 
                          : 'bg-slate-100 text-slate-600'
                      )}>
                        {entity.name.charAt(0)}
                      </div>
                      <div>
                        <p className={cn(
                          'font-medium',
                          isYourBrand ? 'text-forest-700' : 'text-slate-900'
                        )}>
                          {entity.name}
                          {isYourBrand && (
                            <span className="ml-2 text-xs font-normal text-forest-600">
                              (You)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Search Volume */}
                  <td className="px-5 py-4 text-right">
                    <span className="font-mono text-sm text-slate-900">
                      {formatNumber(entity.searchVolume)}
                    </span>
                  </td>

                  {/* Growth */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {getTrendIcon(entity.trend, entity.growth)}
                      <span className={cn(
                        'font-mono text-sm font-medium',
                        entity.growth > 50 ? 'text-red-600' :
                        entity.growth > 0 ? 'text-forest-600' :
                        entity.growth < 0 ? 'text-red-500' :
                        'text-slate-500'
                      )}>
                        {formatPercentage(entity.growth)}
                      </span>
                    </div>
                  </td>

                  {/* Market Share */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            'h-full rounded-full transition-all duration-500',
                            isYourBrand ? 'bg-forest-500' : 'bg-slate-300'
                          )}
                          style={{ width: `${entity.marketShare * 3}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm text-slate-600 w-12 text-right">
                        {entity.marketShare.toFixed(1)}%
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      {!isYourBrand ? (
                        <span className={cn(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                          statusClasses.bg,
                          statusClasses.text
                        )}>
                          <span className={cn('w-1.5 h-1.5 rounded-full', statusClasses.dot)} />
                          {getStatusLabel(entity.status)}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50">
        <button className="flex items-center gap-2 text-sm font-medium text-forest-600 hover:text-forest-700 transition-colors">
          <Eye className="w-4 h-4" />
          View detailed competitor analysis →
        </button>
      </div>
    </div>
  )
}
