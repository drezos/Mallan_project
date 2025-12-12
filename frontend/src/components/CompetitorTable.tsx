import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, BarChart3 } from 'lucide-react'
import { cn, formatNumber } from '../lib/utils'

// Helper functions (inline to avoid import issues)
function getVelocityStatus(change: number): 'accelerating' | 'stable' | 'decelerating' {
  if (change > 5) return 'accelerating';
  if (change < -5) return 'decelerating';
  return 'stable';
}

function calculateSoS(volume: number, totalMarket: number = 45000): number {
  if (totalMarket === 0) return 0;
  return (volume / totalMarket) * 100;
}

interface Competitor {
  id: string | number
  name: string
  searchVolume: number
  growth?: number
  weeklyChange?: number
  status?: 'normal' | 'watching' | 'threat'
  driver?: string
  marketShare?: number
}

interface BrandData {
  name: string
  searchVolume: number
  growth: number
}

interface CompetitorTableProps {
  competitors: Competitor[]
  brandData: BrandData
}

type SortMode = 'velocity' | 'volume'

export function CompetitorTable({ competitors, brandData }: CompetitorTableProps) {
  const [sortMode, setSortMode] = useState<SortMode>('velocity')

  // Normalize competitor data
  const normalizedCompetitors = competitors.map(c => ({
    ...c,
    id: String(c.id),
    growth: c.growth ?? c.weeklyChange ?? 0,
    status: c.status || 'normal' as const,
  }));

  // Calculate Share of Search for all entities
  const allEntities = [
    { ...brandData, id: 'your-brand', status: 'normal' as const, isYourBrand: true, shareOfSearch: calculateSoS(brandData.searchVolume) },
    ...normalizedCompetitors.map(c => ({ 
      ...c, 
      isYourBrand: false, 
      shareOfSearch: calculateSoS(c.searchVolume),
      growth: c.growth,
    })),
  ]

  // Sort based on mode (always keep "You" at top)
  const sortedEntities = [...allEntities].sort((a, b) => {
    if (a.isYourBrand) return -1
    if (b.isYourBrand) return 1
    
    if (sortMode === 'velocity') {
      return Math.abs(b.growth) - Math.abs(a.growth)
    } else {
      return b.searchVolume - a.searchVolume
    }
  })

  // Get velocity color classes
  const getVelocityClasses = (growth: number) => {
    const status = getVelocityStatus(growth)
    const isNegative = growth < 0
    
    switch (status) {
      case 'accelerating':
        return {
          bar: isNegative ? 'bg-green-500' : 'bg-red-500',
          text: isNegative ? 'text-green-600' : 'text-red-600',
        }
      case 'decelerating':
        return {
          bar: isNegative ? 'bg-green-400' : 'bg-orange-500',
          text: isNegative ? 'text-green-600' : 'text-orange-600',
        }
      default:
        return {
          bar: 'bg-slate-300',
          text: 'text-slate-500',
        }
    }
  }

  const maxGrowth = Math.max(...allEntities.map(e => Math.abs(e.growth)), 20)
  const getBarWidth = (growth: number) => {
    return Math.min((Math.abs(growth) / maxGrowth) * 100, 100)
  }

  return (
    <div className="card overflow-hidden opacity-0 animate-slide-up animation-delay-400">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-display font-semibold text-slate-900">Competitor Snapshot</h3>
          <p className="text-xs text-slate-500 mt-0.5">Last 7 days performance</p>
        </div>
        
        {/* Toggle */}
        <div className="flex items-center bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setSortMode('velocity')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              sortMode === 'velocity' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Velocity
          </button>
          <button
            onClick={() => setSortMode('volume')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              sortMode === 'volume' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Volume
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                Brand
              </th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                Search Vol.
              </th>
              <th className="text-right text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3">
                Share
              </th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3 w-44">
                Velocity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {sortedEntities.map((entity) => {
              const velocityClasses = getVelocityClasses(entity.growth)
              const barWidth = getBarWidth(entity.growth)
              const isYourBrand = entity.isYourBrand

              return (
                <tr
                  key={entity.id}
                  className={cn(
                    'transition-colors',
                    isYourBrand ? 'bg-green-50/50' : 'hover:bg-slate-50/50'
                  )}
                >
                  {/* Brand */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold',
                        isYourBrand 
                          ? 'bg-green-600 text-white' 
                          : entity.status === 'threat'
                            ? 'bg-red-100 text-red-700'
                            : entity.status === 'watching'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-slate-100 text-slate-600'
                      )}>
                        {entity.name.charAt(0)}
                      </div>
                      <div>
                        <p className={cn(
                          'font-medium text-sm',
                          isYourBrand ? 'text-green-700' : 'text-slate-900'
                        )}>
                          {entity.name}
                          {isYourBrand && (
                            <span className="ml-1.5 text-xs font-normal text-green-600">(You)</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Search Volume */}
                  <td className="px-5 py-3 text-right">
                    <span className={cn(
                      'font-mono text-sm font-semibold',
                      isYourBrand ? 'text-green-700' : 'text-slate-900'
                    )}>
                      {formatNumber(entity.searchVolume)}
                    </span>
                  </td>

                  {/* Share of Search */}
                  <td className="px-5 py-3 text-right">
                    <span className={cn(
                      'font-mono text-sm font-medium',
                      isYourBrand ? 'text-green-700' : 'text-slate-600'
                    )}>
                      {entity.shareOfSearch.toFixed(1)}%
                    </span>
                  </td>

                  {/* Velocity Heat Bar */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn('h-full rounded-full transition-all duration-500', velocityClasses.bar)}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      
                      <div className={cn(
                        'flex items-center gap-1 min-w-[60px] justify-end',
                        velocityClasses.text
                      )}>
                        {entity.growth > 20 && <AlertTriangle className="w-3.5 h-3.5" />}
                        {entity.growth > 0 && entity.growth <= 20 && <TrendingUp className="w-3.5 h-3.5" />}
                        {entity.growth < 0 && <TrendingDown className="w-3.5 h-3.5" />}
                        {entity.growth === 0 && <Minus className="w-3.5 h-3.5" />}
                        <span className="font-mono text-xs font-medium">
                          {entity.growth > 0 ? '+' : ''}{entity.growth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
