"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Cylinder, Loader2, ArrowLeft, Plus, Minus, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const movementTypes = [
  { value: 'REFILL_RECEIVED', label: 'Refill Received', type: 'FULL', icon: <Plus className="w-4 h-4" />, color: 'text-blue-400' },
  { value: 'MANUAL_ADJUSTMENT', label: 'Manual Adjustment', type: 'BOTH', icon: <Plus className="w-4 h-4" />, color: 'text-amber-400' },
  { value: 'DAMAGED_LOST', label: 'Damaged/Lost', type: 'BOTH', icon: <Minus className="w-4 h-4" />, color: 'text-red-400' },
]

const stockTypes = [
  { value: 'FULL', label: 'Full Cylinders' },
  { value: 'EMPTY', label: 'Empty Cylinders' },
]

export function StockUpdateForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [currentStock, setCurrentStock] = useState({ full: 0, empty: 0 })

  const [formData, setFormData] = useState({
    type: 'FULL',
    movementType: 'REFILL_RECEIVED',
    quantity: 1,
    notes: '',
    date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    fetch('/api/stock/summary')
      .then(res => res.json())
      .then(data => setCurrentStock(data))
      .catch(() => setCurrentStock({ full: 0, empty: 0 }))
  }, [])

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleSave = async () => {
    if (!formData.quantity || formData.quantity <= 0) {
      setErrors({ quantity: 'Quantity must be greater than 0' })
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const res = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formData.type,
          movementType: formData.movementType,
          quantity: formData.quantity,
          notes: formData.notes,
          date: formData.date,
        }),
      })

      if (res.ok) {
        router.push('/stock')
        router.refresh()
      } else {
        const data = await res.json()
        setErrors({ submit: data.error || 'Failed to update stock' })
      }
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedMovement = movementTypes.find(m => m.value === formData.movementType)

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/stock" className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Update Stock</h1>
          <p className="text-slate-400 mt-1">Record refills, adjustments, or damaged cylinders</p>
        </div>
      </div>

      {/* Current Stock Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="glass p-5 rounded-2xl border border-slate-700/50 text-center">
          <Cylinder className="w-10 h-10 text-brand-400 mx-auto mb-2" strokeWidth={2} />
          <p className="text-sm text-slate-400">Full Cylinders</p>
          <p className="text-3xl font-bold text-white">{currentStock.full}</p>
          {currentStock.full < 200 && (
            <p className="text-xs text-red-400 mt-1 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Below reorder level (200)
            </p>
          )}
        </div>
        <div className="glass p-5 rounded-2xl border border-slate-700/50 text-center">
          <Cylinder className="w-10 h-10 text-blue-400 mx-auto mb-2" strokeWidth={2} />
          <p className="text-sm text-slate-400">Empty Cylinders</p>
          <p className="text-3xl font-bold text-white">{currentStock.empty}</p>
          {currentStock.empty < 100 && (
            <p className="text-xs text-amber-400 mt-1 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Low empties (100)
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="glass rounded-2xl border border-slate-700/50 p-6">
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-300 text-sm">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>{errors.submit}</div>
          </div>
        )}

        <div className="space-y-5">
          {/* Movement Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Movement Type</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {movementTypes.map(m => (
                <button
                  type="button"
                  onClick={() => handleChange('movementType', m.value)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-sm transition-all flex flex-col items-center gap-2',
                    formData.movementType === m.value
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                      : 'border-slate-700/50 hover:border-brand-500/30 text-slate-300 hover:text-white'
                  )}
                >
                  <span className={cn('text-xl', m.color)}>{m.icon}</span>
                  <span className="font-medium">{m.label}</span>
                  <span className="text-xs text-slate-500">{m.type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stock Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Cylinder Type</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {stockTypes.map(s => (
                <button
                  type="button"
                  onClick={() => handleChange('type', s.value)}
                  className={cn(
                    'p-4 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-2',
                    formData.type === s.value
                      ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                      : 'border-slate-700/50 hover:border-brand-500/30 text-slate-300 hover:text-white'
                  )}
                >
                  <Cylinder className="w-5 h-5" strokeWidth={2} /> {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Quantity *</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleChange('quantity', Math.max(1, formData.quantity - 1))}
                  className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-slate-300 hover:text-white transition-colors"
                ><Minus className="w-5 h-5" /></button>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => handleChange('quantity', Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="1000"
                  className={cn('input-base text-center text-xl font-bold flex-1', errors.quantity && 'input-error')}
                />
                <button
                  type="button"
                  onClick={() => handleChange('quantity', formData.quantity + 1)}
                  className="p-2 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-slate-300 hover:text-white transition-colors"
                ><Plus className="w-5 h-5" /></button>
              </div>
              {errors.quantity && <p className="mt-1 text-sm text-red-400">{errors.quantity}</p>}
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

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              placeholder="Supplier name, invoice number, reason for adjustment, etc."
              className="input-base resize-none"
            />
          </div>

          {/* Preview Impact */}
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Preview Impact</h4>
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Current {formData.type === 'FULL' ? 'Full' : 'Empty'}</span>
                <span className="font-medium text-white">{formData.type === 'FULL' ? currentStock.full : currentStock.empty}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Change</span>
                <span className={cn('font-medium', formData.movementType === 'DAMAGED_LOST' ? 'text-red-400' : 'text-emerald-400')}>
                  {formData.movementType === 'DAMAGED_LOST' ? '-' : '+'}{formData.quantity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">New Total</span>
                <span className="font-bold text-brand-400">
                  {(formData.type === 'FULL' ? currentStock.full : currentStock.empty) + 
                   (formData.movementType === 'DAMAGED_LOST' ? -formData.quantity : formData.quantity)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-8 pt-6 border-t border-slate-700/50">
          <Link href="/stock" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>
            ) : (
              <span className="flex items-center gap-2"><Cylinder className="w-4 h-4" strokeWidth={2} /> Update Stock</span>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}