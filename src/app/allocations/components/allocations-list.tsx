import { prisma } from '@/lib/prisma'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { Package, AlertTriangle, CheckCircle2, Clock, Cylinder, DollarSign, ChevronRight, Truck, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export async function AllocationsList({ date }: { date: string }) {
  const targetDate = new Date(date + 'T00:00:00.000Z')
  const endDate = new Date(targetDate.getTime() + 24*60*60*1000)

  const allocations = await prisma.dailyAllocation.findMany({
    where: { date: { gte: targetDate, lt: endDate } },
    include: {
      driver: { select: { id: true, code: true, name: true, phone: true } },
      payments: { select: { amount: true } },
    },
    orderBy: { driver: { code: 'asc' } },
  })

  // Get active price for expected cash calculation
  const currentPrice = await prisma.pricePeriod.findFirst({
    where: { effectiveFrom: { lte: targetDate }, isActive: true },
    orderBy: { effectiveFrom: 'desc' },
  })
  const pricePerCylinder = currentPrice?.cylinderPrice || 91700

  return (
    <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-brand-400" />
          <h3 className="text-lg font-semibold text-white">Allocations for {formatDate(targetDate)}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-success"><CheckCircle2 className="w-3 h-3" /><span className="ml-1">Closed</span></span>
          <span className="badge badge-info"><Clock className="w-3 h-3" /><span className="ml-1">Pending</span></span>
          <span className="badge badge-danger"><AlertTriangle className="w-3 h-3" /><span className="ml-1">Flagged</span></span>
        </div>
      </div>

      <div className="divide-y divide-slate-800/50">
        {allocations.map((allocation) => (
          <AllocationRow key={allocation.id} allocation={allocation} pricePerCylinder={pricePerCylinder} />
        ))}
      </div>

      {allocations.length === 0 && (
        <div className="empty-state py-16">
          <Package className="empty-state-icon" />
          <p className="empty-state-title">No allocations for this date</p>
          <p className="empty-state-description">Create morning allocations to get started</p>
        </div>
      )}
    </div>
  )
}

function AllocationRow({ allocation, pricePerCylinder }: any) {
  const collectedCash = allocation.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
  const shortfall = allocation.expectedCash - collectedCash
  const tallyStatus = checkTally(allocation)

  return (
    <div className="p-4 hover:bg-slate-800/30 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Driver Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-white truncate">{allocation.driver.name}</p>
              <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-800/50 rounded">{allocation.driver.code}</span>
              {allocation.status === 'FLAGGED' && (
                <span className="badge badge-danger flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Flagged
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 truncate">{allocation.driver.phone}</p>
          </div>
        </div>

        {/* Cylinder Breakdown */}
        <div className="hidden sm:flex flex-wrap items-center gap-4">
          <CylinderStat icon={<Cylinder className="w-4 h-4 text-emerald-400" />} label="Sold" value={allocation.fullCylindersSold} />
          <CylinderStat icon={<Cylinder className="w-4 h-4 text-slate-400" />} label="Returned" value={allocation.fullCylindersReturned} />
          <CylinderStat icon={<Cylinder className="w-4 h-4 text-brand-400" />} label="Empties" value={allocation.emptyCylindersCollected} />
        </div>

        {/* Cash Status */}
        <div className="flex flex-col sm:items-end gap-1 min-w-[160px]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{formatCurrency(allocation.expectedCash)}</span>
            <span className="text-xs text-slate-500">expected</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-medium', shortfall > 0 ? 'text-red-400' : 'text-emerald-400')}>
              {formatCurrency(collectedCash)}
            </span>
            <span className="text-xs text-slate-500">collected</span>
          </div>
          {shortfall > 0 && (
            <div className="flex items-center gap-1 text-red-400 text-xs font-medium">
              <AlertCircle className="w-3 h-3" />
              <span>Short: {formatCurrency(shortfall)}</span>
            </div>
          )}
          {shortfall <= 0 && collectedCash > 0 && (
            <div className="flex items-center gap-1 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-3 h-3" />
              <span>Tallied</span>
            </div>
          )}
        </div>

        {/* Tally Status */}
        <div className="flex items-center gap-2">
          <TallyStatusBadge status={tallyStatus} />
          <Link href={`/allocations/close?id=${allocation.id}`} className="btn-ghost px-3 py-1.5 text-xs">
            {allocation.status === 'PENDING' ? 'Close' : 'View'}
            <ChevronRight className="w-3 h-3 ml-1" />
          </Link>
        </div>
      </div>

      {/* Mobile Cylinder Breakdown & Tally */}
      <div className="sm:hidden mt-3 pt-3 border-t border-slate-800/50 space-y-3">
        <div className="flex flex-wrap items-center gap-4">
          <CylinderStat icon={<Cylinder className="w-4 h-4 text-emerald-400" />} label="Sold" value={allocation.fullCylindersSold} />
          <CylinderStat icon={<Cylinder className="w-4 h-4 text-slate-400" />} label="Returned" value={allocation.fullCylindersReturned} />
          <CylinderStat icon={<Cylinder className="w-4 h-4 text-brand-400" />} label="Empties" value={allocation.emptyCylindersCollected} />
        </div>
        <div className="flex items-center justify-between">
          <TallyStatusBadge status={tallyStatus} />
          <Link href={`/allocations/close?id=${allocation.id}`} className="btn-primary text-sm">Close Day</Link>
        </div>
      </div>
    </div>
  )
}

function CylinderStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-xl">
      {icon}
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-medium text-white">{value}</p>
      </div>
    </div>
  )
}

function TallyStatusBadge({ status }: { status: 'complete' | 'partial' | 'pending' }) {
  const configs = {
    complete: { className: 'badge-success', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Tallied' },
    partial: { className: 'badge-warning', icon: <AlertTriangle className="w-3 h-3" />, label: 'Partial' },
    pending: { className: 'badge-info', icon: <Clock className="w-3 h-3" />, label: 'Pending' },
  }
  const config = configs[status]
  return (
    <span className={cn('badge', config.className)}>
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </span>
  )
}

function checkTally(allocation: any): 'complete' | 'partial' | 'pending' {
  if (allocation.status === 'CLOSED' || allocation.status === 'FLAGGED') {
    const collectedCash = allocation.payments.reduce((sum: number, p: any) => sum + p.amount, 0)
    if (collectedCash >= allocation.expectedCash && allocation.emptyCylindersCollected > 0) {
      return 'complete'
    }
    if (collectedCash > 0) {
      return 'partial'
    }
  }
  return 'pending'
}