"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Cylinder, Loader2, ArrowLeft, AlertCircle, CheckCircle2, AlertTriangle, DollarSign, Save } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface AllocationData {
  id: string
  date: string
  driver: { id: string; code: string; name: string; phone: string }
  fullCylindersIssued: number
  fullCylindersSold: number
  fullCylindersReturned: number
  emptyCylindersCollected: number
  expectedCash: number
  status: string
  payments: { amount: number }[]
}

export function CloseAllocationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const allocationId = searchParams.get('id')
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [allocation, setAllocation] = useState<AllocationData | null>(null)
  const [formData, setFormData] = useState({
    fullCylindersSold: 0,
    fullCylindersReturned: 0,
    emptyCylindersCollected: 0,
  })
  const [pricePerCylinder, setPricePerCylinder] = useState(91700)
  const [collectedCash, setCollectedCash] = useState(0)
  const [tallyErrors, setTallyErrors] = useState<string[]>([])

  // Fetch allocation data
  useEffect(() => {
    if (!allocationId) {
      router.push('/allocations')
      return
    }
    fetch(`/api/allocations?id=${allocationId}`)
      .then(res => res.json())
      .then(data => {
        if (data.allocations?.[0]) {
          const alloc = data.allocations[0]
          setAllocation(alloc)
          setFormData({
            fullCylindersSold: alloc.fullCylindersSold,
            fullCylindersReturned: alloc.fullCylindersReturned,
            emptyCylindersCollected: alloc.emptyCylindersCollected,
          })
          setCollectedCash(alloc.payments?.reduce((sum: number, p: any) => sum + p.amount, 0) || 0)
          // Get price from expectedCash / sold if sold > 0, else default
          if (alloc.fullCylindersSold > 0 && alloc.expectedCash > 0) {
            setPricePerCylinder(Math.round(alloc.expectedCash / alloc.fullCylindersSold))
          }
        }
        setIsLoading(false)
      })
      .catch(() => {
        setErrors({ fetch: 'Failed to load allocation' })
        setIsLoading(false)
      })
  }, [allocationId, router])

  // Validate tally in real-time
  useEffect(() => {
    if (!allocation) return
    const errors: string[] = []
    const { fullCylindersIssued } = allocation
    const { fullCylindersSold, fullCylindersReturned, emptyCylindersCollected } = formData

    // Cylinder tally: issued = sold + returned
    if (fullCylindersSold + fullCylindersReturned !== fullCylindersIssued) {
      errors.push(`Cylinder mismatch: Sold (${fullCylindersSold}) + Returned (${fullCylindersReturned}) ≠ Issued (${fullCylindersIssued})`)
    }
    if (fullCylindersSold < 0 || fullCylindersReturned < 0 || emptyCylindersCollected < 0) {
      errors.push('Values cannot be negative')
    }
    if (emptyCylindersCollected > fullCylindersSold) {
      errors.push(`Empties collected (${emptyCylindersCollected}) cannot exceed cylinders sold (${fullCylindersSold})`)
    }
    setTallyErrors(errors)
  }, [formData, allocation])

  const handleChange = (field: string, value: number) => {
    setFormData(prev => ({ ...prev, [field]: Math.max(0, value) }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleSave = async () => {
    if (tallyErrors.length > 0) {
      setErrors({ submit: 'Please fix tally errors before saving' })
      return
    }

    setSaving(true)
    setErrors({})

    try {
      const expectedCash = formData.fullCylindersSold * pricePerCylinder
      const res = await fetch(`/api/allocations/${allocationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullCylindersSold: formData.fullCylindersSold,
          fullCylindersReturned: formData.fullCylindersReturned,
          emptyCylindersCollected: formData.emptyCylindersCollected,
          expectedCash,
        }),
      })

      if (res.ok) {
        router.push('/allocations')
        router.refresh()
      } else {
        const data = await res.json()
        setErrors({ submit: data.error || 'Failed to save closeout' })
      }
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <Cylinder className="w-12 h-12 text-brand-400 animate-spin" strokeWidth={2} />
          <p className="text-slate-400">Loading allocation...</p>
        </div>
      </div>
    )
  }

  if (!allocation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Allocation Not Found</h2>
          <Link href="/allocations" className="btn-primary">Back to Allocations</Link>
        </div>
      </div>
    )
  }

  const expectedCash = formData.fullCylindersSold * pricePerCylinder
  const shortfall = expectedCash - collectedCash
  const isTallyValid = tallyErrors.length === 0
  const cylindersTally = formData.fullCylindersSold + formData.fullCylindersReturned

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/allocations" className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Evening Closeout</h1>
          <p className="text-slate-400 mt-1">{allocation.driver.name} ({allocation.driver.code}) • {formatDate(allocation.date)}</p>
        </div>
      </div>

      {/* Status Header */}
      <div className="glass rounded-2xl border border-slate-700/50 p-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <StatBox label="Issued" value={allocation.fullCylindersIssued} icon={<Cylinder className="w-5 h-5 text-brand-400" />} />
          <StatBox label="Sold" value={formData.fullCylindersSold} icon={<Cylinder className="w-5 h-5 text-emerald-400" />} color="text-emerald-400" />
          <StatBox label="Returned" value={formData.fullCylindersReturned} icon={<Cylinder className="w-5 h-5 text-slate-400" />} color="text-slate-400" />
          <StatBox label="Empties" value={formData.emptyCylindersCollected} icon={<Cylinder className="w-5 h-5 text-brand-400" />} color="text-brand-400" />
        </div>
      </div>

      {/* Tally Checklist */}
      <div className="glass rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          Closing Checklist - All Must Pass
        </h3>

        <div className="space-y-3">
          {/* Cylinder Tally */}
          <TallyCheck
            label="Cylinder Tally"
            passed={cylindersTally === allocation.fullCylindersIssued}
            details={`Sold (${formData.fullCylindersSold}) + Returned (${formData.fullCylindersReturned}) = ${cylindersTally} / ${allocation.fullCylindersIssued} Issued`}
          />
          {/* Empties Check */}
          <TallyCheck
            label="Empty Cylinders"
            passed={formData.emptyCylindersCollected <= formData.fullCylindersSold && formData.fullCylindersSold > 0}
            details={`Collected: ${formData.emptyCylindersCollected} / Sold: ${formData.fullCylindersSold} ${formData.emptyCylindersCollected === formData.fullCylindersSold ? '✓ All recovered' : ''}`}
          />
          {/* Cash Tally */}
          <TallyCheck
            label="Cash Reconciliation"
            passed={collectedCash >= expectedCash && expectedCash > 0}
            details={`Expected: ${formatCurrency(expectedCash)} | Collected: ${formatCurrency(collectedCash)} ${shortfall > 0 ? `| Short: ${formatCurrency(shortfall)}` : '✓ Tallied'}`}
          />
          {/* Non-zero sales */}
          <TallyCheck
            label="Activity Recorded"
            passed={formData.fullCylindersSold > 0 || formData.fullCylindersReturned > 0}
            details={formData.fullCylindersSold === 0 && formData.fullCylindersReturned === 0 ? 'No activity recorded' : 'Activity recorded'}
          />
        </div>

        {tallyErrors.length > 0 && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl space-y-2">
            <p className="font-medium text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Tally Errors:
            </p>
            <ul className="list-disc list-inside text-red-300 text-sm space-y-1">
              {tallyErrors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}

        {isTallyValid && formData.fullCylindersSold > 0 && (
          <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <div>
              <p className="font-medium text-emerald-300">All Checks Passed</p>
              <p className="text-sm text-emerald-400">Ready to close day</p>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="glass rounded-2xl border border-slate-700/50 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Record Evening Return</h3>

        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <InputField
            label="Full Cylinders Sold"
            value={formData.fullCylindersSold}
            onChange={(v: number) => handleChange('fullCylindersSold', v)}
            max={allocation.fullCylindersIssued}
            icon={<Cylinder className="w-5 h-5 text-emerald-400" />}
            error={errors.fullCylindersSold}
          />
          <InputField
            label="Full Cylinders Returned"
            value={formData.fullCylindersReturned}
            onChange={(v: number) => handleChange('fullCylindersReturned', v)}
            max={allocation.fullCylindersIssued - formData.fullCylindersSold}
            icon={<Cylinder className="w-5 h-5 text-slate-400" />}
            error={errors.fullCylindersReturned}
          />
          <InputField
            label="Empty Cylinders Collected"
            value={formData.emptyCylindersCollected}
            onChange={(v: number) => handleChange('emptyCylindersCollected', v)}
            max={formData.fullCylindersSold}
            icon={<Cylinder className="w-5 h-5 text-brand-400" />}
            error={errors.emptyCylindersCollected}
          />
        </div>

        {/* Cash Summary */}
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-3">
          <h4 className="text-sm font-medium text-slate-300">Cash Summary</h4>
          <div className="grid gap-2 sm:grid-cols-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Price/Cylinder</span>
              <span className="font-medium text-white">{formatCurrency(pricePerCylinder)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Expected Cash</span>
              <span className="font-medium text-white">{formatCurrency(expectedCash)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Collected Today</span>
              <span className="font-medium text-emerald-400">{formatCurrency(collectedCash)}</span>
            </div>
            <div className="flex justify-between sm:col-span-2">
              <span className="text-slate-400">Shortfall</span>
              <span className={cn('font-medium', shortfall > 0 ? 'text-red-400' : 'text-emerald-400')}>
                {shortfall > 0 ? formatCurrency(shortfall) : 'Tallied'}
              </span>
            </div>
            <div className="flex justify-between sm:col-span-2">
              <span className="text-slate-400">Driver Total Dues</span>
              <span className="font-medium text-white">{formatCurrency(shortfall)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-6 pt-6 border-t border-slate-700/50">
          <Link href="/allocations" className="btn-secondary">Cancel</Link>
          <button
            onClick={handleSave}
            disabled={saving || !isTallyValid || formData.fullCylindersSold === 0}
            className={cn('btn-primary flex items-center justify-center gap-2', !isTallyValid && 'opacity-50 cursor-not-allowed')}
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Close Day'}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatBox({ label, value, icon, color = 'text-white' }: any) {
  return (
    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 text-center">
      <div className="flex items-center justify-center gap-1 mb-1">{icon}</div>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}

function TallyCheck({ label, passed, details }: { label: string; passed: boolean; details: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
      <div className={cn('p-2 rounded-lg', passed ? 'bg-emerald-500/20' : 'bg-red-500/20')}>
        {passed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-red-400" />}
      </div>
      <div className="flex-1">
        <p className="font-medium text-white">{label}</p>
        <p className="text-xs text-slate-400">{details}</p>
      </div>
      <span className={cn('badge text-xs', passed ? 'badge-success' : 'badge-danger')}>
        {passed ? 'PASS' : 'FAIL'}
      </span>
    </div>
  )
}

function InputField({ label, value, onChange, max, icon, error }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
        {icon} {label}
      </label>
      <div className="relative">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          min="0"
          max={max}
          className={cn('input-base pl-10', error && 'input-error')}
        />
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
      </div>
      {error && <p className="mt-1 text-sm text-red-400">{error}</p>}
      <p className="mt-1 text-xs text-slate-500">Max: {max}</p>
    </div>
  )
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(amount / 100)
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}