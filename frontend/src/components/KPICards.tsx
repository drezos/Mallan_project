import { TrendingUp, TrendingDown, Minus, Users, Target, BarChart3 } from 'lucide-react'
import { cn, formatNumber, formatPercentage } from '../lib/utils'

// ===========================================
// Card 1: Share of Search
// ===========================================
interface ShareOfSearchCardProps {
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  sparklineData: number[]
}

export function ShareOfSearchCard({ value, change, trend, sparklineData }: ShareOfSearchCardProps) {
  const maxVal = Math.max(...sparklineData)
  const minVal = Math.min(...sparklineData)
  const range = maxVal - minVal || 1
  
  return (
    <div className="card p-5 opacity-0 animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Share of Search</p>
          <p className="text-xs text-slate-400 mt-0.5">Your slice of total market</p>
        </div>
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
          trend === 'up' && 'text-forest-600 bg-forest-50',
          trend === 'down' && 'text-red-600 bg-red-50',
          trend === 'stable' && 'text-slate-500 bg-slate-100'
        )}>
          {trend === 'up' && <TrendingUp className="w-3 h-3" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3" />}
          {trend === 'stable' && <Minus className="w-3 h-3" />}
          {formatPercentage(change)} vs avg
        </div>
      </div>
      
      <div className="mt-3">
        <span className="text-4xl font-display font-semibold text-slate-900">
          {value.toFixed(1)}%
        </span>
      </div>
      
      {/* Mini sparkline */}
      <div className="mt-4 h-10 flex items-end gap-0.5">
        {sparklineData.map((val, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 rounded-sm transition-all',
              i === sparklineData.length - 1 ? 'bg-forest-500' : 'bg-forest-200'
            )}
            style={{ 
              height: `${((val - minVal) / range) * 100}%`,
              minHeight: '4px'
            }}
          />
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-1">12-week trend</p>
    </div>
  )
}

// ===========================================
// Card 2: Market Opportunity
// ===========================================
interface MarketOpportunityCardProps {
  genericVolume: number
  competitorVolume: number
  yourBrandVolume: number
}

export function MarketOpportunityCard({ 
  genericVolume, 
  competitorVolume, 
  yourBrandVolume 
}: MarketOpportunityCardProps) {
  const total = genericVolume + competitorVolume + yourBrandVolume
  const genericPct = (genericVolume / total) * 100
  const competitorPct = (competitorVolume / total) * 100
  const yourPct = (yourBrandVolume / total) * 100
  
  return (
    <div className="card p-5 opacity-0 animate-slide-up animation-delay-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Market Opportunity</p>
          <p className="text-xs text-slate-400 mt-0.5">Where searches are going</p>
        </div>
        <Target className="w-5 h-5 text-slate-400" />
      </div>
      
      {/* Stacked bar */}
      <div className="mt-4 h-3 rounded-full overflow-hidden flex bg-slate-100">
        <div 
          className="bg-forest-500 transition-all" 
          style={{ width: `${yourPct}%` }}
          title={`Your Brand: ${formatNumber(yourBrandVolume)}`}
        />
        <div 
          className="bg-ember-400 transition-all" 
          style={{ width: `${competitorPct}%` }}
          title={`Competitor Brands: ${formatNumber(competitorVolume)}`}
        />
        <div 
          className="bg-slate-300 transition-all" 
          style={{ width: `${genericPct}%` }}
          title={`Generic: ${formatNumber(genericVolume)}`}
        />
      </div>
      
      {/* Legend */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-forest-500" />
            <span className="text-slate-600">Your Brand</span>
          </div>
          <span className="font-mono font-medium text-slate-900">{formatNumber(yourBrandVolume)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-ember-400" />
            <span className="text-slate-600">Competitors</span>
            <span className="text-xs text-slate-400">(warm leads)</span>
          </div>
          <span className="font-mono font-medium text-slate-900">{formatNumber(competitorVolume)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
            <span className="text-slate-600">Generic</span>
            <span className="text-xs text-slate-400">(undecided)</span>
          </div>
          <span className="font-mono font-medium text-slate-900">{formatNumber(genericVolume)}</span>
        </div>
      </div>
    </div>
  )
}

// ===========================================
// Card 3: Total Addressable Market
// ===========================================
interface TotalMarketCardProps {
  volume: number
  growth: number
  trend: 'up' | 'down' | 'stable'
  isHealthy: boolean
}

export function TotalMarketCard({ volume, growth, isHealthy }: TotalMarketCardProps) {
  return (
    <div className="card p-5 opacity-0 animate-slide-up animation-delay-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Total Addressable Market</p>
          <p className="text-xs text-slate-400 mt-0.5">All searches in Netherlands</p>
        </div>
        <BarChart3 className="w-5 h-5 text-slate-400" />
      </div>
      
      <div className="mt-3">
        <span className="text-4xl font-display font-semibold text-slate-900">
          {formatNumber(volume)}
        </span>
        <span className="text-lg text-slate-400 ml-1">searches</span>
      </div>
      
      <div className="mt-3 flex items-center gap-3">
        <div className={cn(
          'flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full',
          growth > 0 ? 'text-forest-600 bg-forest-50' : 'text-red-600 bg-red-50'
        )}>
          {growth > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {formatPercentage(growth)} WoW
        </div>
        
        <span className={cn(
          'text-sm',
          isHealthy ? 'text-forest-600' : 'text-red-600'
        )}>
          {isHealthy ? 'Market is growing' : 'Market contracting'}
        </span>
      </div>
    </div>
  )
}

// ===========================================
// Card 4: Your Performance vs Market (Panic Killer)
// ===========================================
interface PerformanceContextCardProps {
  yourGrowth: number
  marketGrowth: number
  outperforming: boolean
}

export function PerformanceContextCard({ 
  yourGrowth, 
  marketGrowth, 
  outperforming 
}: PerformanceContextCardProps) {
  const delta = yourGrowth - marketGrowth
  
  return (
    <div className="card p-5 opacity-0 animate-slide-up animation-delay-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">You vs Market</p>
          <p className="text-xs text-slate-400 mt-0.5">Are you winning?</p>
        </div>
        <Users className="w-5 h-5 text-slate-400" />
      </div>
      
      <div className="mt-4 space-y-3">
        {/* Your growth */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Your growth</span>
          <span className={cn(
            'font-mono font-semibold',
            yourGrowth > 0 ? 'text-forest-600' : 'text-red-600'
          )}>
            {formatPercentage(yourGrowth)}
          </span>
        </div>
        
        {/* Market growth */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600">Market growth</span>
          <span className="font-mono font-medium text-slate-500">
            {formatPercentage(marketGrowth)}
          </span>
        </div>
        
        {/* Divider */}
        <div className="border-t border-slate-100" />
        
        {/* Delta */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Delta</span>
          <div className={cn(
            'flex items-center gap-1.5 font-semibold',
            outperforming ? 'text-forest-600' : 'text-red-600'
          )}>
            {outperforming ? (
              <>
                <TrendingUp className="w-4 h-4" />
                <span>+{delta.toFixed(1)}%</span>
                <span className="text-xs font-normal text-forest-500">ahead</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4" />
                <span>{delta.toFixed(1)}%</span>
                <span className="text-xs font-normal text-red-500">behind</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
