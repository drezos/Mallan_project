import { Users } from 'lucide-react'

export function Competitors() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-forest-50 flex items-center justify-center mb-4">
        <Users className="w-8 h-8 text-forest-600" />
      </div>
      <h2 className="text-xl font-display font-semibold text-slate-900">
        Competitor Analysis
      </h2>
      <p className="text-slate-500 mt-2 max-w-md">
        Deep dive into individual competitor performance, trends, and threat assessment.
        Coming in Week 3.
      </p>
    </div>
  )
}
