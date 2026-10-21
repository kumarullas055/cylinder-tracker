import { Suspense } from 'react'
import { AllocationsList } from './components/allocations-list'
import { PageHeader } from '@/components/page-header'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function AllocationsPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  // Get today's allocations
  const todayAllocations = await prisma.dailyAllocation.findMany({
    where: { date: { gte: today, lt: new Date(today.getTime() + 24*60*60*1000) } },
    include: {
      driver: { select: { id: true, code: true, name: true } },
    },
    orderBy: { driver: { code: 'asc' } },
  })

  // Get active drivers for quick allocation
  const activeDrivers = await prisma.driver.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  })

  // Find drivers without today's allocation
  const allocatedDriverIds = new Set(todayAllocations.map(a => a.driverId))
  const unallocatedDrivers = activeDrivers.filter(d => !allocatedDriverIds.has(d.id))

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Daily Allocations"
        description="Manage morning cylinder issuance and evening closeouts"
        actions={
          <div className="flex gap-2">
            <a href="/allocations/new" className="btn-primary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Morning Issue
            </a>
            <a href="/allocations/close" className="btn-secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Evening Closeout
            </a>
          </div>
        }
      />

      {/* Today's Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryCard
          title="Allocated Today"
          value={todayAllocations.length}
          subtitle={`${activeDrivers.length} active drivers`}
          icon={<Package className="w-5 h-5" />}
          iconBg="bg-brand-500/20"
          iconColor="text-brand-400"
        />
        <SummaryCard
          title="Pending Closeout"
          value={todayAllocations.filter(a => a.status === 'PENDING').length}
          subtitle="Need evening closeout"
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-amber-500/20"
          iconColor="text-amber-400"
        />
        <SummaryCard
          title="Closed"
          value={todayAllocations.filter(a => a.status === 'CLOSED').length}
          subtitle="Fully reconciled"
          icon={<CheckCircle2 className="w-5 h-5" />}
          iconBg="bg-emerald-500/20"
          iconColor="text-emerald-400"
        />
        <SummaryCard
          title="Flagged"
          value={todayAllocations.filter(a => a.status === 'FLAGGED').length}
          subtitle="Discrepancies found"
          icon={<AlertTriangle className="w-5 h-5" />}
          iconBg="bg-red-500/20"
          iconColor="text-red-400"
        />
      </div>

      {/* Quick Allocate Missing Drivers */}
      {unallocatedDrivers.length > 0 && (
        <div className="glass rounded-2xl border border-slate-700/50 p-4 bg-amber-500/5 border-l-4 border-amber-500">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div>
                <p className="font-medium text-white">{unallocatedDrivers.length} driver(s) not allocated today</p>
                <p className="text-sm text-slate-400">
                  {unallocatedDrivers.map(d => d.code).join(', ')}
                </p>
              </div>
            </div>
            <a href="/allocations/new" className="btn-primary whitespace-nowrap">Allocate Now</a>
          </div>
        </div>
      )}

      <Suspense fallback={<AllocationsListSkeleton />}>
        <AllocationsList date={todayStr} />
      </Suspense>
    </div>
  )
}

// Import components
import { Package, Clock, CheckCircle2, AlertTriangle, AlertCircle, Cylinder, DollarSign, ChevronRight } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'

function SummaryCard({ title, value, subtitle, icon, iconBg, iconColor }: any) {
  return (
    <div className="glass p-5 rounded-2xl border border-slate-700/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
        <div className={cn('p-3 rounded-xl', iconBg)}>
          <span className={cn('text-2xl', iconColor)}>{icon}</span>
        </div>
      </div>
    </div>
  )
}

function AllocationsListSkeleton() {
  return (
    <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50">
        <div className="skeleton h-6 w-48 rounded" />
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