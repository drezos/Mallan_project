import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Bell,
  ChevronRight,
  Link2
} from 'lucide-react'
import { UserButton } from '@clerk/clerk-react'
import { cn } from '../lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Connections', href: '/connections', icon: Link2 },
]

export function Layout() {
  const location = useLocation()
  
  // Get current page title
  const currentPage = navigation.find(
    item => item.href === location.pathname
  )?.name || location.pathname.slice(1).replace(/^\w/, c => c.toUpperCase()) || 'Dashboard'

  return (
    <div className="min-h-screen bg-brew-beige">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-30">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img
              src="/weeklybrew-logo.png"
              alt="WeeklyBrew"
              className="w-12 h-12 object-contain"
            />
            <h1 className="font-display font-semibold text-slate-900 text-lg leading-none">
              weeklybrew.io
            </h1>
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
                  isActive ? 'text-brew-brown' : 'text-slate-400 group-hover:text-brew-brown/60'
                )} />
                <span>{item.name}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto text-brew-brown/50" />
                )}
              </NavLink>
            )
          })}
        </nav>

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
