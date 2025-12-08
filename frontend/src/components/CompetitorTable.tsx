import { TrendingUp, TrendingDown, Minus, AlertTriangle, Eye } from 'lucide-react'
import { cn, formatNumber, formatPercentage } from '../lib/utils'

interface Competitor {
  id: string
  name: string
  searchVolume: number
  growth: number
  trend: 'up' | 'down' | 'stable' | 'spike'
  status: 'normal' | 'watching' | 'threat'
  driver?: string
}

interface BrandData {
  name: string
  searchVolume: number
  growth: number
  trend: 'up' | 'down' | 'stable'
}

interface CompetitorTableProps {
  competitors: Competitor[]
  brandData: BrandData
  marketAverageGrowth: number
}

export function CompetitorTable({ competitors, brandData, marketAverageGrowth }: CompetitorTableProps) {
  // Sort competitors by volume (highest first)
  const sortedCompetitors = [...competitors].sort((a, b) => b.searchVolume - a.searchVolume)

  // Determine if competitor growth is a threat to us
  // Green = they're losing or growing slower than us
  // Red = they're growing faster than us (threat)
  // Grey = similar to our growth
  const getGrowthColor = (competitorGrowth: number) => {
    const ourGrowth = brandData.growth
    
    if (competitorGrowth > ourGrowth + 10) {
      return 'threat' // Growing much faster than us - red
    }
    if (competitorGrowth > ourGrowth) {
      return 'warning' // Growing faster than us - orange
    }
    if (competitorGrowth < 0) {
      return 'good' // They're shrinking - green for us
    }
    if (competitorGrowth < ourGrowth) {
      return 'good' // Growing slower than us - green for us
    }
    return 'neutral'
  }

  const getGrowthClasses = (status: string) => {
    switch (status) {
      case 'threat':
        return 'text-red-600'
      case 'warning':
        return 'text-ember-600'
      case 'good':
        return 'text-forest-600'
      default:
        return 'text-slate-500'
    }
  }

  const getStatusBadge = (status: string, growth: number) => {
    if (status === 'threat' || growth > 50) {
      return { label: 'High Threat', classes: 'bg-red-50 text-red-700', dot: 'bg-red-500' }
    }
    if (status === 'watching' || growth > 15) {
      return { label: 'Watching', classes: 'bg-ember-50 text-ember-700', dot: 'bg-ember-500' }
    }
    return { label: 'Normal', classes: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' }
  }

  const getTrendIcon = (trend: string, growth: number) => {
    if (trend === 'spike') {
      return <AlertTriangle className="w-4 h-4 text-red-500" />
    }
    if (growth > 0) {
      return <TrendingUp className="w-4 h-4" />
    }
    if (growth < 0) {
      return <TrendingDown className="w-4 h-4" />
    }
    return <Minus className="w-4 h-4 text-slate-400" />
  }

  return (
    <div className="card overflow-hidden opacity-0 animate-slide-up animation-delay-300">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-display font-semibold text-slate-900">
          Competitor Snapshot
        </h3>
        <p className="text-sm text-slate-500 mt-0.5">
          Last 7 days · Market avg: {formatPercentage(marketAverageGrowth)}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                Brand
              </th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                Volume
              </th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                Growth
              </th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                vs Market
              </th>
              <th className="text-center text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {/* YOUR BRAND - Always pinned at top */}
            <tr className="bg-forest-50/40 border-b-2 border-forest-200">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-forest-600 flex items-center justify-center text-sm font-semibold text-white shadow-sm">
                    {brandData.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-forest-800">
                      {brandData.name}
                    </p>
                    <p className="text-xs text-forest-600">Your brand</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 text-right">
                <span className="font-mono text-sm font-semibold text-forest-800">
                  {formatNumber(brandData.searchVolume)}
                </span>
              </td>
              <td className="px-5 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  {brandData.growth > 0 ? (
                    <TrendingUp className="w-4 h-4 text-forest-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className={cn(
                    'font-mono text-sm font-semibold',
                    brandData.growth > 0 ? 'text-forest-600' : 'text-red-600'
                  )}>
                    {formatPercentage(brandData.growth)}
                  </span>
                </div>
              </td>
              <td className="px-5 py-4 text-right">
                <span className={cn(
                  'font-mono text-sm font-medium',
                  brandData.growth > marketAverageGrowth ? 'text-forest-600' : 'text-red-600'
                )}>
                  {brandData.growth > marketAverageGrowth ? '+' : ''}
                  {(brandData.growth - marketAverageGrowth).toFixed(1)}%
                </span>
              </td>
              <td className="px-5 py-4">
                <div className="flex justify-center">
                  <span className="text-xs text-forest-600 font-medium">—</span>
                </div>
              </td>
            </tr>

            {/* COMPETITORS */}
            {sortedCompetitors.map((competitor) => {
              const growthStatus = getGrowthColor(competitor.growth)
              const statusBadge = getStatusBadge(competitor.status, competitor.growth)
              const vsMarket = competitor.growth - marketAverageGrowth

              return (
                <tr
                  key={competitor.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  {/* Brand name */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600">
                        {competitor.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          {competitor.name}
                        </p>
                        {competitor.driver && (
                          <p className="text-xs text-slate-500">
                            {competitor.driver}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Volume */}
                  <td className="px-5 py-4 text-right">
                    <span className="font-mono text-sm text-slate-900">
                      {formatNumber(competitor.searchVolume)}
                    </span>
                  </td>

                  {/* Growth - colored based on threat to US */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className={getGrowthClasses(growthStatus)}>
                        {getTrendIcon(competitor.trend, competitor.growth)}
                      </span>
                      <span className={cn(
                        'font-mono text-sm font-medium',
                        getGrowthClasses(growthStatus)
                      )}>
                        {formatPercentage(competitor.growth)}
                      </span>
                    </div>
                  </td>

                  {/* vs Market */}
                  <td className="px-5 py-4 text-right">
                    <span className={cn(
                      'font-mono text-xs',
                      'text-slate-400'
                    )}>
                      ({vsMarket > 0 ? '+' : ''}{vsMarket.toFixed(0)}% vs mkt)
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
                        statusBadge.classes
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', statusBadge.dot)} />
                        {statusBadge.label}
                      </span>
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
