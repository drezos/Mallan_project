import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Bell,
  Settings,
  TrendingUp,
  ChevronRight
} from 'lucide-react'
import { UserButton } from '@clerk/clerk-react'
import { cn } from '../lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Competitors', href: '/competitors', icon: Users },
  { name: 'Alerts', href: '/alerts', icon: Bell },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Layout() {
  const location = useLocation()
  
  // Get current page title
  const currentPage = navigation.find(
    item => item.href === location.pathname
  )?.name || 'Dashboard'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-30">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-forest-600 to-forest-800 flex items-center justify-center shadow-sm">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-semibold text-slate-900 text-lg leading-none">
                MarketPulse
              </h1>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Netherlands Market
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={cn(
                  'nav-item group',
                  isActive && 'active'
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5 transition-colors',
                  isActive ? 'text-forest-600' : 'text-slate-400 group-hover:text-slate-600'
                )} />
                <span>{item.name}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto text-forest-400" />
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Bottom section - Brand info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Tracking
            </p>
            <p className="text-sm font-semibold text-slate-900 mt-1">
              Jacks.nl
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              vs 5 competitors
            </p>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main className="pl-64">
        {/* Top header bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
          <div>
            <h2 className="font-display font-semibold text-xl text-slate-900">
              {currentPage}
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Last updated indicator */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-forest-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-forest-500"></span>
              </span>
              <span>Updated 2h ago</span>
            </div>
            
            {/* Notification bell */}
            <button className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-ember-500 rounded-full"></span>
            </button>

            {/* User Button */}
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Page content */}
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
