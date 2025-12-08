import { Settings as SettingsIcon } from 'lucide-react'

export function Settings() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <SettingsIcon className="w-8 h-8 text-slate-600" />
      </div>
      <h2 className="text-xl font-display font-semibold text-slate-900">
        Settings
      </h2>
      <p className="text-slate-500 mt-2 max-w-md">
        Configure your brand, competitor list, and notification preferences.
        Coming in Week 2.
      </p>
    </div>
  )
}
