"use client"

import { useState, useEffect } from 'react'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { Truck, AlertTriangle, CheckCircle2, TrendingUp, ExternalLink, Trash2, Edit, Home, Trash, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Driver {
  id: string
  code: string
  name: string
  phone: string
  photoUrl: string | null
  joiningDate: string
  vehicleNumber: string | null
  vehicleType: string | null
  licenseNumber: string | null
  licenseExpiry: string | null
  isActive: boolean
  duesThreshold: number
  createdAt: string
  updatedAt: string
  totalExpected: number
  totalCollected: number
  outstanding: number
  totalCylinders: number
  totalDays: number
  reliabilityScore: number
  isOverThreshold: boolean
  allocations: any[]
  payments: any[]
  _count: { allocations: number }
}

async function getDriversData(): Promise<Driver[]> {
  const res = await fetch('/api/drivers?status=active')
  const data = await res.json()
  return data.drivers || []
}

function StatusBadge({ score, isOverThreshold }: { score: number; isOverThreshold: boolean }) {
  if (isOverThreshold) {
    return (
      <span className="badge badge-danger flex items-center gap-1">
        <AlertTriangle className="w-3 h-3" />
        Dues Alert
      </span>
    )
  }
  if (score >= 90) {
    return (
      <span className="badge badge-success flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" />
        {score}% Reliable
      </span>
    )
  }
  if (score >= 70) {
    return (
      <span className="badge badge-warning flex items-center gap-1">
        <TrendingUp className="w-3 h-3" />
        {score}% Good
      </span>
    )
  }
  return (
    <span className="badge badge-neutral flex items-center gap-1">
      <AlertTriangle className="w-3 h-3" />
      {score}% Needs Work
    </span>
  )
}

// Clear All Confirmation Dialog Component
function ClearAllDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  driverCount,
  loading 
}: { 
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  driverCount: number
  loading: boolean
}) {
  const [step, setStep] = useState(1)
  const [confirmText, setConfirmText] = useState('')

  if (!isOpen) return null

  const handleConfirm = () => {
    if (step === 1) {
      setStep(2)
      setConfirmText('')
    } else if (step === 2) {
      if (confirmText === 'DELETE ALL DRIVERS') {
        onConfirm()
      } else {
        alert('Please type "DELETE ALL DRIVERS" exactly')
      }
    }
  }

  if (step === 1) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="glass rounded-2xl border border-slate-700/50 max-w-md w-full p-6 animate-slide-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-red-500/20">
              <AlertCircle className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Clear All Drivers</h3>
              <p className="text-sm text-slate-400">This action cannot be undone easily</p>
            </div>
          </div>
          
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
            <p className="text-sm text-red-300">
              <strong>Warning:</strong> This will deactivate ALL {driverCount} active drivers.
              Their historical data (allocations, payments, delivery proofs) will be preserved,
              but they will no longer appear in active driver lists.
            </p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button 
              onClick={() => setStep(2)}
              className="btn-danger flex-1"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="glass rounded-2xl border border-slate-700/50 max-w-md w-full p-6 animate-slide-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-red-500/20">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Final Confirmation</h3>
            <p className="text-sm text-slate-400">Type the exact phrase to confirm</p>
          </div>
        </div>
        
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
          <p className="text-sm text-red-300 font-mono">
            Type: <span className="bg-slate-800/50 px-2 py-1 rounded">DELETE ALL DRIVERS</span>
          </p>
        </div>

        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="Type DELETE ALL DRIVERS to confirm"
          className="input-base mb-4 font-mono text-center"
          autoFocus
        />

        <div className="flex gap-3">
          <button 
            onClick={() => { setStep(1); setConfirmText('') }}
            className="btn-secondary flex-1"
          >
            Back
          </button>
          <button 
            onClick={handleConfirm}
            disabled={loading || confirmText !== 'DELETE ALL DRIVERS'}
            className="btn-danger flex-1"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </span>
            ) : (
              'Delete All Drivers'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export function DriversList() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [clearAllOpen, setClearAllOpen] = useState(false)
  const [clearAllLoading, setClearAllLoading] = useState(false)

  // Fetch drivers on mount
  const fetchDrivers = async () => {
    setLoading(true)
    try {
      const data = await getDriversData()
      setDrivers(data)
    } catch (error) {
      console.error('Failed to load drivers:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch - use useEffect to run only once on mount
  useEffect(() => {
    fetchDrivers()
  }, [])

  const handleDelete = async (driverId: string, driverCode: string) => {
    if (!confirm(`Delete driver ${driverCode}? This will deactivate them (soft delete) and preserve all historical data.`)) {
      return
    }

    setDeletingId(driverId)
    try {
      const res = await fetch(`/api/drivers/${driverId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        setDrivers(prev => prev.filter(d => d.id !== driverId))
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete driver')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('Something went wrong')
    } finally {
      setDeletingId(null)
    }
  }

  const handleClearAll = async () => {
    setClearAllLoading(true)
    try {
      const res = await fetch('/api/drivers/bulk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirm: true,
          confirmText: 'DELETE ALL DRIVERS'
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setDrivers([])
        setClearAllOpen(false)
        alert(`Successfully deleted ${data.deleted} drivers`)
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to delete all drivers')
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      alert('Something went wrong')
    } finally {
      setClearAllLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <div className="skeleton h-6 w-48 rounded" />
        </div>
        <div className="divide-y divide-slate-800/50">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="skeleton h-12 w-12 rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 w-48 rounded" />
                <div className="skeleton h-4 w-64 rounded" />
              </div>
              <div className="skeleton h-8 w-24 rounded" />
              <div className="skeleton h-8 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link href="/" className="btn-ghost p-2" title="Home">
              <Home className="w-5 h-5" />
            </Link>
            <Truck className="w-5 h-5 text-brand-400" />
            <h3 className="text-lg font-semibold text-white">All Drivers ({drivers.length})</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">● Active</span>
            <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded">⚠ Dues Alert</span>
            {drivers.length > 0 && (
              <button
                onClick={() => setClearAllOpen(true)}
                className="btn-ghost px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-1"
                title="Delete All Drivers"
              >
                <Trash className="w-3 h-3" />
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table-base w-full">
            <thead>
              <tr>
                <th className="w-16">Code</th>
                <th>Driver Details</th>
                <th className="text-right">Cylinders</th>
                <th className="text-right">Collected</th>
                <th className="text-right">Outstanding</th>
                <th className="text-right">Reliability</th>
                <th className="w-32"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-4">
                    <span className="font-mono text-sm font-medium text-brand-400">{driver.code}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
                        <Truck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{driver.name}</p>
                        <p className="text-sm text-slate-400">{driver.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className="font-medium text-white">{formatNumber(driver.totalCylinders)}</p>
                    <p className="text-xs text-slate-500">{driver.totalDays} days</p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className="font-medium text-emerald-400">{formatCurrency(driver.totalCollected)}</p>
                    <p className="text-xs text-slate-500">of {formatCurrency(driver.totalExpected)}</p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className={cn(
                      'font-medium',
                      driver.outstanding > 0 ? 'text-red-400' : 'text-emerald-400'
                    )}>
                      {driver.outstanding > 0 ? formatCurrency(driver.outstanding) : 'Clear'}
                    </p>
                    {driver.outstanding > 0 && (
                      <p className="text-xs text-slate-500">Threshold: {formatCurrency(driver.duesThreshold)}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <StatusBadge score={driver.reliabilityScore} isOverThreshold={driver.isOverThreshold} />
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/drivers/${driver.id}`}
                        className="btn-ghost px-3 py-1.5 text-xs"
                        title="View Details"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <button
                        onClick={() => handleDelete(driver.id, driver.code)}
                        disabled={deletingId === driver.id}
                        className="btn-ghost px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10"
                        title="Delete Driver"
                      >
                        {deletingId === driver.id ? (
                          <span className="animate-spin">⏳</span>
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {drivers.length === 0 && (
          <div className="empty-state py-16">
            <Truck className="empty-state-icon" />
            <p className="empty-state-title">No drivers yet</p>
            <p className="empty-state-description">Add your first delivery driver to get started</p>
            <Link href="/drivers/new" className="btn-primary mt-4">Add Driver</Link>
          </div>
        )}
      </div>

      {/* Clear All Dialog */}
      <ClearAllDialog
        isOpen={clearAllOpen}
        onClose={() => setClearAllOpen(false)}
        onConfirm={handleClearAll}
        driverCount={drivers.length}
        loading={clearAllLoading}
      />
    </>
  )
}