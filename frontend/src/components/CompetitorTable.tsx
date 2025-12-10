import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, BarChart3 } from 'lucide-react'
import { cn } from '../lib/utils'
import { getVelocityStatus, calculateSoS } from '../lib/mockData'

interface Competitor {
  id: string
  name: string
  searchVolume: number
  growth: number
  status: 'normal' | 'watching' | 'threat'
  driver?: string
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

type SortMode = 'velocity' | 'share'

export function CompetitorTable({ competitors, brandData }: CompetitorTableProps) {
  const [sortMode, setSortMode] = useState<SortMode>('velocity')

  // Calculate Share of Search for all entities
  const allEntities = [
    { ...brandData, id: 'your-brand', status: 'normal' as const, isYourBrand: true, shareOfSearch: calculateSoS(brandData.searchVolume) },
    ...competitors.map(c => ({ ...c, isYourBrand: false, shareOfSearch: calculateSoS(c.searchVolume) })),
  ]

  // Sort based on mode
  const sortedEntities = [...allEntities].sort((a, b) => {
    if (a.isYourBrand) return -1 // Always keep "You" at top
    if (b.isYourBrand) return 1
    
    if (sortMode === 'velocity') {
      return Math.abs(b.growth) - Math.abs(a.growth) // Highest velocity first
    } else {
      return b.shareOfSearch - a.shareOfSearch // Highest share first
    }
  })

  // Get velocity color classes
  const getVelocityClasses = (growth: number) => {
    const status = getVelocityStatus(growth)
    const isNegative = growth < 0
    
    switch (status) {
      case 'surge':
        return {
          bar: isNegative ? 'bg-forest-500' : 'bg-red-500', // Green if they're shrinking (good for us), Red if surging
          text: isNegative ? 'text-forest-600' : 'text-red-600',
          label: isNegative ? 'Declining' : 'Surge'
        }
      case 'moderate':
        return {
          bar: isNegative ? 'bg-forest-400' : 'bg-ember-500',
          text: isNegative ? 'text-forest-600' : 'text-ember-600',
          label: isNegative ? 'Slowing' : 'Growing'
        }
      default:
        return {
          bar: 'bg-slate-300',
          text: 'text-slate-500',
          label: 'Stable'
        }
    }
  }

  // Calculate bar width (max 100%)
  const maxGrowth = Math.max(...allEntities.map(e => Math.abs(e.growth)), 20)
  const getBarWidth = (growth: number) => {
    return Math.min((Math.abs(growth) / maxGrowth) * 100, 100)
  }

  return (
    <div className="card overflow-hidden opacity-0 animate-slide-up animation-delay-400">
      {/* Header with toggle */}
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
            onClick={() => setSortMode('share')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              sortMode === 'share' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Share
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
                Share of Search
              </th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider px-5 py-3 w-48">
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
                    isYourBrand ? 'bg-forest-50/50' : 'hover:bg-slate-50/50'
                  )}
                >
                  {/* Brand */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold',
                        isYourBrand 
                          ? 'bg-forest-600 text-white' 
                          : entity.status === 'threat'
                            ? 'bg-red-100 text-red-700'
                            : entity.status === 'watching'
                              ? 'bg-ember-100 text-ember-700'
                              : 'bg-slate-100 text-slate-600'
                      )}>
                        {entity.name.charAt(0)}
                      </div>
                      <div>
                        <p className={cn(
                          'font-medium text-sm',
                          isYourBrand ? 'text-forest-700' : 'text-slate-900'
                        )}>
                          {entity.name}
                          {isYourBrand && (
                            <span className="ml-1.5 text-xs font-normal text-forest-600">(You)</span>
                          )}
                        </p>
                        {entity.driver && (
                          <p className="text-xs text-slate-500">{entity.driver}</p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Share of Search */}
                  <td className="px-5 py-3 text-right">
                    <span className={cn(
                      'font-mono text-sm font-medium',
                      isYourBrand ? 'text-forest-700' : 'text-slate-700'
                    )}>
                      {entity.shareOfSearch.toFixed(1)}%
                    </span>
                  </td>

                  {/* Velocity Heat Bar */}
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {/* Heat bar */}
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={cn('h-full rounded-full transition-all duration-500', velocityClasses.bar)}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      
                      {/* Growth % */}
                      <div className={cn(
                        'flex items-center gap-1 min-w-[70px] justify-end',
                        velocityClasses.text
                      )}>
                        {entity.growth > 20 && <AlertTriangle className="w-3.5 h-3.5" />}
                        {entity.growth > 0 && entity.growth <= 20 && <TrendingUp className="w-3.5 h-3.5" />}
                        {entity.growth < 0 && <TrendingDown className="w-3.5 h-3.5" />}
                        {entity.growth === 0 && <Minus className="w-3.5 h-3.5" />}
                        <span className="font-mono text-sm font-medium">
                          {entity.growth > 0 ? '+' : ''}{entity.growth}%
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
