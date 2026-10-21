"use client"

import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Truck,
  Users,
  Package,
  CreditCard,
  Settings,
  BarChart3,
  DollarSign,
  Cylinder,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Bell,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Drivers', href: '/drivers', icon: Truck },
  { name: 'Allocations', href: '/allocations', icon: Package },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Stock', href: '/stock', icon: Cylinder },
  { name: 'Pricing', href: '/pricing', icon: DollarSign },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50 transform transition-transform duration-300 ease-in-out flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 p-5 border-b border-slate-800/50">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Cylinder className="w-6 h-6 text-white" strokeWidth={2} />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-slate-900">
                <ChevronRight className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">CylinTrack</h1>
              <p className="text-xs text-brand-300 font-medium">Every Cylinder Accounted For</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" role="navigation" aria-label="Main navigation">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-brand-500/20 to-brand-600/10 text-brand-300 border border-brand-500/20 shadow-lg shadow-brand-500/10'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                <span>{item.name}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 bg-brand-500 rounded-full" />}
              </Link>
            )
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-800/50">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{session?.user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 capitalize">{session?.user?.role?.toLowerCase() || 'staff'}</p>
            </div>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* User Dropdown */}
          {userMenuOpen && (
            <div className="mt-2 animate-slide-down">
              <Link
                href="/settings"
                className="flex items-center gap-3 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors"
                onClick={() => setUserMenuOpen(false)}
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/50">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
              aria-label="Open menu"
              aria-expanded={sidebarOpen}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Page Title */}
            <div className="flex-1 lg:flex-none">
              <h1 className="text-lg font-semibold text-white truncate">
                {navigation.find(item => pathname === item.href || pathname.startsWith(item.href + '/'))?.name || 'Dashboard'}
              </h1>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <button className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">3</span>
              </button>

              {/* User Avatar Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/50 transition-colors"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-white">{session?.user?.name}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-2 animate-scale-in">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-sm font-medium text-white">{session?.user?.name}</p>
                      <p className="text-xs text-slate-500 capitalize">{session?.user?.role?.toLowerCase()}</p>
                    </div>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile Styles */}
      <style jsx global>{`
        @media (max-width: 1023px) {
          .lg\:hidden {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}