"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, Loader2, ArrowLeft, AlertCircle, CheckCircle2, DollarSign, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Driver {
  id: string
  code: string
  name: string
  phone: string
  outstanding?: number
}

const paymentMethods = [
  { value: 'CASH', label: 'Cash', icon: <DollarSign className="w-4 h-4" /> },
  { value: 'UPI', label: 'UPI', icon: <CreditCard className="w-4 h-4" /> },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: <CreditCard className="w-4 h-4" /> },
  { value: 'CHEQUE', label: 'Cheque', icon: <CreditCard className="w-4 h-4" /> },
  { value: 'OTHER', label: 'Other', icon: <CreditCard className="w-4 h-4" /> },
]

export function NewPaymentForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preSelectedDriver = searchParams.get('driver')
  const preSelectedAllocation = searchParams.get('allocation')
  const [isLoading, setIsLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [formData, setFormData] = useState({
    driverId: '',
    allocationId: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    method: 'CASH',
    notes: '',
  })

  useEffect(() => {
    fetch('/api/drivers?status=active')
      .then(res => res.json())
      .then(data => {
        const driversList = data.drivers || data
        setDrivers(driversList)
        if (preSelectedDriver) setFormData(prev => ({ ...prev, driverId: preSelectedDriver }))
        if (preSelectedAllocation) setFormData(prev => ({ ...prev, allocationId: preSelectedAllocation }))
        setIsLoading(false)
      })
      .catch(() => { setErrors({ fetch: 'Failed to load drivers' }); setIsLoading(false) })
  }, [preSelectedDriver, preSelectedAllocation])

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const selectedDriver = drivers.find(d => d.id === formData.driverId)

  const handleSave = async () => {
    if (!formData.driverId) { setErrors({ driverId: 'Please select a driver' }); return }
    if (!formData.amount || parseFloat(formData.amount) <= 0) { setErrors({ amount: 'Enter a valid amount' }); return }

    setSaving(true)
    setErrors({})

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: formData.driverId,
          allocationId: formData.allocationId || null,
          date: formData.date,
          amount: Math.round(parseFloat(formData.amount) * 100), // Convert to paise
          method: formData.method,
          notes: formData.notes,
        }),
      })

      if (res.ok) {
        router.push('/payments')
        router.refresh()
      } else {
        const data = await res.json()
        setErrors({ submit: data.error || 'Failed to record payment' })
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
          <CreditCard className="w-12 h-12 text-brand-400 animate-spin" />
          <p className="text-slate-400">Loading drivers...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/payments" className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Record Payment</h1>
          <p className="text-slate-400 mt-1">Log cash or digital payment from a driver</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="glass rounded-2xl border border-slate-700/50 p-6">
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-300 text-sm">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>{errors.submit}</div>
          </div>
        )}

        <div className="space-y-5">
          {/* Driver Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Driver *</label>
            <select
              value={formData.driverId}
              onChange={(e) => handleChange('driverId', e.target.value)}
              className={cn('input-base', errors.driverId && 'input-error')}
            >
              <option value="">Select driver...</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>
                  {d.code} - {d.name} {d.outstanding ? ` (Dues: ₹${(d.outstanding/100).toLocaleString()})` : ''}
                </option>
              ))}
            </select>
            {errors.driverId && <p className="mt-1 text-sm text-red-400">{errors.driverId}</p>}
          </div>

          {/* Quick Add Driver */}
          <Link href="/drivers/new" className="btn-ghost text-sm justify-start">
            <UserPlus className="w-4 h-4 mr-1" /> Add New Driver
          </Link>

          {/* Selected Driver Info */}
          {selectedDriver && (
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{selectedDriver.name}</p>
                    <p className="text-sm text-slate-400">{selectedDriver.code} • {selectedDriver.phone}</p>
                  </div>
                </div>
                {selectedDriver.outstanding && selectedDriver.outstanding > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Outstanding Dues</p>
                    <p className="font-medium text-red-400">{formatCurrency(selectedDriver.outstanding)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.amount}
                onChange={(e) => handleChange('amount', e.target.value)}
                placeholder="917.00"
                className={cn('input-base', errors.amount && 'input-error')}
              />
              {errors.amount && <p className="mt-1 text-sm text-red-400">{errors.amount}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Date</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="input-base"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Payment Method</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {paymentMethods.map(m => (
                <button
                  type="button"
                  onClick={() => handleChange('method', m.value)}
                  className={cn(
                    'p-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-2',
                    formData.method === m.value
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                      : 'border-slate-700/50 hover:border-brand-500/30 text-slate-300 hover:text-white'
                  )}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Allocation Link (Optional) */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Link to Allocation (Optional)</label>
            <input
              type="text"
              value={formData.allocationId}
              onChange={(e) => handleChange('allocationId', e.target.value)}
              placeholder="Allocation ID"
              className="input-base"
            />
            <p className="mt-1 text-xs text-slate-500">Link this payment to a specific day's allocation for auto-reconciliation</p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              placeholder="Payment details, reference number, etc."
              className="input-base resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-8 pt-6 border-t border-slate-700/50">
          <Link href="/payments" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>
            ) : (
              <span className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Record Payment</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount / 100)
}