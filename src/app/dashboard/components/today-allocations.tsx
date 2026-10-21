"use client"

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { Cylinder, Truck, CheckCircle2, AlertCircle, Clock, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Allocation {
  id: string
  driver: {
    id: string
    code: string
    name: string
    phone: string
  }
  fullCylindersIssued: number
  fullCylindersSold: number
  fullCylindersReturned: number
  emptyCylindersCollected: number
  expectedCash: number
  status: 'PENDING' | 'CLOSED' | 'FLAGGED'
  collectedCash: number
  shortfall: number
}

async function fetchTodaysAllocations(): Promise<Allocation[]> {
  try {
    const today = new Date().toISOString().split('T')[0]
    const res = await fetch(`/api/allocations?date=${today}`)
    const data = await res.json()
    return data.allocations || []
  } catch {
    return []
  }
}

function StatusBadge({ status }: { status: Allocation['status'] }) {
  const configs = {
    PENDING: { className: 'badge-info', icon: <Clock className="w-3 h-3" />, label: 'Pending' },
    CLOSED: { className: 'badge-success', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Closed' },
    FLAGGED: { className: 'badge-danger', icon: <AlertCircle className="w-3 h-3" />, label: 'Flagged' },
  }
  const config = configs[status]
  return (
    <span className={cn('badge', config.className)}>
      {config.icon}
      <span className="ml-1">{config.label}</span>
    </span>
  )
}

function CylinderBreakdown({ sold, returned, empties }: { sold: number; returned: number; empties: number }) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1 text-emerald-400">
        <Cylinder className="w-3 h-3" strokeWidth={2.5} />
        <span className="font-medium">{sold}</span>
        <span className="text-slate-500">sold</span>
      </div>
      <div className="flex items-center gap-1 text-slate-400">
        <Cylinder className="w-3 h-3" strokeWidth={2.5} />
        <span className="font-medium">{returned}</span>
        <span className="text-slate-500">ret</span>
      </div>
      <div className="flex items-center gap-1 text-brand-400">
        <Cylinder className="w-3 h-3" strokeWidth={2.5} />
        <span className="font-medium">{empties}</span>
        <span className="text-slate-500">empty</span>
      </div>
    </div>
  )
}

export function TodayAllocations() {
  const [allocations, setAllocations] = useState<Allocation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodaysAllocations().then(data => {
      setAllocations(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
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

  return (
    <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Truck className="w-5 h-5 text-brand-400" />
          <h3 className="text-lg font-semibold text-white">Today's Allocations</h3>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status="CLOSED" />
          <StatusBadge status="PENDING" />
          <StatusBadge status="FLAGGED" />
        </div>
      </div>

      <div className="divide-y divide-slate-800/50">
        {allocations.map((allocation) => (
          <div key={allocation.id} className="p-4 hover:bg-slate-800/30 transition-colors">
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
                  </div>
                  <p className="text-sm text-slate-400 truncate">{allocation.driver.phone}</p>
                </div>
              </div>

              {/* Cylinder Breakdown */}
              <div className="hidden sm:flex">
                <CylinderBreakdown
                  sold={allocation.fullCylindersSold}
                  returned={allocation.fullCylindersReturned}
                  empties={allocation.emptyCylindersCollected}
                />
              </div>

              {/* Cash Status */}
              <div className="flex flex-col sm:items-end gap-1 min-w-[140px]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{formatCurrency(allocation.expectedCash)}</span>
                  <span className="text-xs text-slate-500">expected</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-sm font-medium',
                    allocation.shortfall > 0 ? 'text-red-400' : 'text-emerald-400'
                  )}>
                    {formatCurrency(allocation.collectedCash)}
                  </span>
                  <span className="text-xs text-slate-500">collected</span>
                </div>
                {allocation.shortfall > 0 && (
                  <div className="flex items-center gap-1 text-red-400 text-xs font-medium">
                    <AlertCircle className="w-3 h-3" />
                    <span>Short: {formatCurrency(allocation.shortfall)}</span>
                  </div>
                )}
              </div>

              {/* Status & Action */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <StatusBadge status={allocation.status} />
                <button className="btn-ghost px-3 py-1.5 text-xs">
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Mobile Cylinder Breakdown */}
            <div className="sm:hidden mt-3 pt-3 border-t border-slate-800/50">
              <CylinderBreakdown
                sold={allocation.fullCylindersSold}
                returned={allocation.fullCylindersReturned}
                empties={allocation.emptyCylindersCollected}
              />
            </div>
          </div>
        ))}
      </div>

      {allocations.length === 0 && (
        <div className="empty-state py-16">
          <Truck className="empty-state-icon" />
          <p className="empty-state-title">No allocations today</p>
          <p className="empty-state-description">Create morning allocations for drivers to get started</p>
        </div>
      )}
    </div>
  )
}