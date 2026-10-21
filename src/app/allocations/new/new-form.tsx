"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Truck, Loader2, ArrowLeft, Minus, Plus, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Driver {
  id: string
  code: string
  name: string
}

export function NewAllocationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedDriver = searchParams.get('driver')
  const [isLoading, setIsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [selectedDriverIds, setSelectedDriverIds] = useState<string[]>([])
  const [allocationData, setAllocationData] = useState<Record<string, { issued: number }>>({})
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [defaultIssued, setDefaultIssued] = useState(30)

  // Fetch active drivers
  useEffect(() => {
    fetch('/api/drivers?status=active')
      .then(res => res.json())
      .then(data => {
        const driversList = data.drivers || data
        setDrivers(driversList)
        if (preSelectedDriver) {
          setSelectedDriverIds([preSelectedDriver])
        } else {
          // Auto-select all active drivers by default
          setSelectedDriverIds(driversList.map((d: Driver) => d.id))
        }
      })
      .catch(() => setErrors({ fetch: 'Failed to load drivers' }))
  }, [preSelectedDriver])

  // Initialize allocation data when drivers change
  useEffect(() => {
    setAllocationData(prev => {
      const newData = { ...prev }
      selectedDriverIds.forEach(id => {
        if (!newData[id]) newData[id] = { issued: defaultIssued }
      })
      // Remove unselected drivers
      Object.keys(newData).forEach(id => {
        if (!selectedDriverIds.includes(id)) delete newData[id]
      })
      return newData
    })
  }, [selectedDriverIds, defaultIssued])

  const handleDriverToggle = (driverId: string) => {
    setSelectedDriverIds(prev => 
      prev.includes(driverId) 
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    )
  }

  const handleIssuedChange = (driverId: string, value: number) => {
    setAllocationData(prev => ({
      ...prev,
      [driverId]: { ...prev[driverId], issued: Math.max(0, value) }
    }))
  }

  const handleSave = async () => {
    if (selectedDriverIds.length === 0) {
      setErrors({ submit: 'Please select at least one driver' })
      return
    }

    // Validate all have issued > 0
    const invalid = selectedDriverIds.some(id => (allocationData[id]?.issued || 0) <= 0)
    if (invalid) {
      setErrors({ submit: 'All selected drivers must have at least 1 cylinder issued' })
      return
    }

    setSaving(true)
    setErrors({})

    try {
      const res = await fetch('/api/allocations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          allocations: selectedDriverIds.map(driverId => ({
            driverId,
            fullCylindersIssued: allocationData[driverId].issued,
          })),
        }),
      })

      if (res.ok) {
        router.push('/allocations')
        router.refresh()
      } else {
        const data = await res.json()
        setErrors({ submit: data.error || 'Failed to create allocations' })
      }
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/allocations" className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Morning Cylinder Issue</h1>
          <p className="text-slate-400 mt-1">Record cylinders issued to drivers for {formatDate(date)}</p>
        </div>
      </div>

      <div className="glass rounded-2xl border border-slate-700/50 p-6">
        {/* Date & Default Selection */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="input-base"
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Default Cylinders per Driver</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDefaultIssued(Math.max(1, defaultIssued - 1))}
                className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <Minus className="w-5 h-5" />
              </button>
              <input
                type="number"
                value={defaultIssued}
                onChange={(e) => setDefaultIssued(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="100"
                className="input-base w-24 text-center"
              />
              <button
                type="button"
                onClick={() => setDefaultIssued(defaultIssued + 1)}
                className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">Applies to newly selected drivers</p>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setSelectedDriverIds(drivers.map(d => d.id))}
              className="btn-secondary text-sm"
            >
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Select All
            </button>
          </div>
        </div>

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>{errors.submit}</div>
          </div>
        )}

        {/* Driver Selection Grid */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-400" />
            Select Drivers & Set Issued Cylinders ({selectedDriverIds.length}/{drivers.length})
          </h3>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {drivers.map((driver) => {
              const isSelected = selectedDriverIds.includes(driver.id)
              const issued = allocationData[driver.id]?.issued || defaultIssued

              return (
                <div
                  key={driver.id}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all cursor-pointer',
                    isSelected
                      ? 'border-brand-500/50 bg-brand-500/5'
                      : 'border-slate-700/50 hover:border-brand-500/30 bg-slate-800/30'
                  )}
                  onClick={() => handleDriverToggle(driver.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-brand-400">{driver.code}</span>
                        <p className="font-medium text-white truncate">{driver.name}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    )}
                  </div>

                  {isSelected && (
                    <div className="mt-3 flex items-center gap-2">
                      <label className="text-xs text-slate-400">Cylinders:</label>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleIssuedChange(driver.id, issued - 1) }}
                        className="p-1.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-slate-300 hover:text-white transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        value={issued}
                        onChange={(e) => { e.stopPropagation(); handleIssuedChange(driver.id, Math.max(1, parseInt(e.target.value) || 1)) }}
                        min="1"
                        max="100"
                        className="input-base w-20 text-center text-base font-medium"
                      />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleIssuedChange(driver.id, issued + 1) }}
                        className="p-1.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-slate-300 hover:text-white transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {drivers.length === 0 && (
            <div className="empty-state py-8">
              <Truck className="empty-state-icon" />
              <p className="empty-state-title">No active drivers</p>
              <p className="empty-state-description">Add drivers first to create allocations</p>
            </div>
          )}
        </div>

        {/* Summary */}
        {selectedDriverIds.length > 0 && (
          <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Cylinders to Issue</p>
                <p className="text-3xl font-bold text-white">
                  {selectedDriverIds.reduce((sum, id) => sum + (allocationData[id]?.issued || defaultIssued), 0)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="btn-primary whitespace-nowrap"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Create Allocations'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}