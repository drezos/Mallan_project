import { BarChart3, Target } from 'lucide-react'
import { cn } from '../lib/utils'
import { useVolumeView } from '../contexts/VolumeViewContext'

export function VolumeToggle() {
  const { volumeView, setVolumeView } = useVolumeView()

  return (
    <div className="flex items-center bg-slate-100 rounded-lg p-1">
      <button
        onClick={() => setVolumeView('total')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
          volumeView === 'total'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        )}
      >
        <BarChart3 className="w-3.5 h-3.5" />
        Total Volume
      </button>
      <button
        onClick={() => setVolumeView('priority')}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
          volumeView === 'priority'
            ? 'bg-white text-slate-900 shadow-sm'
            : 'text-slate-500 hover:text-slate-700'
        )}
      >
        <Target className="w-3.5 h-3.5" />
        Priority Keyword
      </button>
    </div>
  )
}
