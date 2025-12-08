import { Bell } from 'lucide-react'

export function Alerts() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-ember-50 flex items-center justify-center mb-4">
        <Bell className="w-8 h-8 text-ember-600" />
      </div>
      <h2 className="text-xl font-display font-semibold text-slate-900">
        Alert History & Configuration
      </h2>
      <p className="text-slate-500 mt-2 max-w-md">
        View all past alerts and configure your notification preferences.
        Coming in Week 2.
      </p>
    </div>
  )
}
