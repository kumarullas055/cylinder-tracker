import { Suspense } from 'react'
import { DashboardStats } from './components/dashboard-stats'
import { TodayAllocations } from './components/today-allocations'
import { QuickActions } from './components/quick-actions'
import { AlertsPanel } from './components/alerts-panel'
import { RevenueChart } from './components/revenue-chart'
import { CurrentDate } from './components/current-date'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 mt-1">Overview of today's operations</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full font-medium">
            ● Live
          </span>
          <CurrentDate />
        </div>
      </div>

      {/* KPI Cards */}
      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats />
      </Suspense>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column - 8 cols */}
        <div className="lg:col-span-8 space-y-6">
          {/* Today's Allocations */}
          <Suspense fallback={<TodayAllocationsSkeleton />}>
            <TodayAllocations />
          </Suspense>

          {/* Quick Actions */}
          <Suspense fallback={<QuickActionsSkeleton />}>
            <QuickActions />
          </Suspense>
        </div>

        {/* Right Column - 4 cols */}
        <div className="lg:col-span-4 space-y-6">
          {/* Alerts Panel */}
          <Suspense fallback={<AlertsPanelSkeleton />}>
            <AlertsPanel />
          </Suspense>

          {/* Revenue Chart */}
          <Suspense fallback={<RevenueChartSkeleton />}>
            <RevenueChart />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

// Skeleton Components
function DashboardStatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass p-6 rounded-2xl">
          <div className="skeleton h-4 w-3/4 mb-4 rounded" />
          <div className="skeleton h-8 w-1/2 rounded" />
        </div>
      ))}
    </div>
  )
}

function TodayAllocationsSkeleton() {
  return (
    <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50">
        <div className="skeleton h-6 w-32 rounded" />
      </div>
      <div className="divide-y divide-slate-800/50">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
            <div className="skeleton h-8 w-24 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickActionsSkeleton() {
  return (
    <div className="glass rounded-2xl border border-slate-700/50 p-6">
      <div className="skeleton h-6 w-40 rounded mb-4" />
      <div className="grid gap-3 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function AlertsPanelSkeleton() {
  return (
    <div className="glass rounded-2xl border border-slate-700/50 p-6">
      <div className="skeleton h-6 w-40 rounded mb-4" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function RevenueChartSkeleton() {
  return (
    <div className="glass rounded-2xl border border-slate-700/50 p-6">
      <div className="skeleton h-6 w-40 rounded mb-4" />
      <div className="skeleton h-64 rounded-xl" />
    </div>
  )
}