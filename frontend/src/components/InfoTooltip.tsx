import { HelpCircle } from 'lucide-react'
import { cn } from '../lib/utils'

interface InfoTooltipProps {
  text: string
  className?: string
  position?: 'left' | 'right'
}

export function InfoTooltip({ text, className, position = 'right' }: InfoTooltipProps) {
  return (
    <div className={cn("group relative inline-flex", className)}>
      <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help transition-colors" />
      <div className={cn(
        "pointer-events-none absolute top-6 z-50 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
        position === 'right' ? 'right-0' : 'left-0'
      )}>
        <div className="bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
          {text}
          <div className={cn(
            "absolute -top-1 w-2 h-2 bg-slate-800 rotate-45",
            position === 'right' ? 'right-2' : 'left-2'
          )} />
        </div>
      </div>
    </div>
  )
}
