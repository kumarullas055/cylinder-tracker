"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, Loader2, ArrowLeft, AlertCircle, CheckCircle2, Calculator } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

export function NewPricingForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    effectiveFrom: new Date().toISOString().split('T')[0],
    cylinderPrice: '917',
    costPrice: '867',
    margin: '50',
    notes: '',
  })

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))

    // Auto-calculate margin or cost price
    if (field === 'cylinderPrice' || field === 'costPrice') {
      const price = parseFloat(formData.cylinderPrice) || 0
      const cost = parseFloat(formData.costPrice) || 0
      if (price > 0 && cost > 0) {
        setFormData(prev => ({ ...prev, margin: String(Math.round((price - cost) * 100)) }))
      }
    }
    if (field === 'margin') {
      const price = parseFloat(formData.cylinderPrice) || 0
      const margin = parseFloat(formData.margin) || 0
      if (price > 0 && margin > 0) {
        setFormData(prev => ({ ...prev, costPrice: String(Math.round((price - margin/100) * 100)) }))
      }
    }
  }

  const handleSave = async () => {
    const price = parseFloat(formData.cylinderPrice)
    const cost = parseFloat(formData.costPrice)
    const margin = parseFloat(formData.margin)

    if (!formData.effectiveFrom) { setErrors({ effectiveFrom: 'Effective date is required' }); return }
    if (!price || price <= 0) { setErrors({ cylinderPrice: 'Enter a valid selling price' }); return }
    if (!cost || cost <= 0) { setErrors({ costPrice: 'Enter a valid cost price' }); return }
    if (!margin || margin < 0) { setErrors({ margin: 'Enter a valid margin' }); return }
    if (cost >= price) { setErrors({ costPrice: 'Cost price must be less than selling price' }); return }

    setIsLoading(true)
    setErrors({})

    try {
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effectiveFrom: formData.effectiveFrom,
          cylinderPrice: Math.round(price * 100),
          costPrice: Math.round(cost * 100),
          margin: Math.round(margin * 100),
          notes: formData.notes,
        }),
      })

      if (res.ok) {
        router.push('/pricing')
        router.refresh()
      } else {
        const data = await res.json()
        setErrors({ submit: data.error || 'Failed to create price period' })
      }
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const marginPercent = (() => {
    const price = parseFloat(formData.cylinderPrice) || 0
    const margin = parseFloat(formData.margin) || 0
    return price > 0 ? ((margin / price) * 100).toFixed(1) : '0'
  })()

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/pricing" className="btn-ghost p-2"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-white">New Price Period</h1>
          <p className="text-slate-400 mt-1">Set cylinder selling price, cost, and margin</p>
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
          {/* Effective Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Effective From *</label>
            <input
              type="date"
              value={formData.effectiveFrom}
              onChange={(e) => handleChange('effectiveFrom', e.target.value)}
              className={cn('input-base', errors.effectiveFrom && 'input-error')}
            />
            {errors.effectiveFrom && <p className="mt-1 text-sm text-red-400">{errors.effectiveFrom}</p>}
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Selling Price (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.cylinderPrice}
                onChange={(e) => handleChange('cylinderPrice', e.target.value)}
                placeholder="917.00"
                className={cn('input-base pl-8', errors.cylinderPrice && 'input-error')}
              />
            </div>
            {errors.cylinderPrice && <p className="mt-1 text-sm text-red-400">{errors.cylinderPrice}</p>}
          </div>

          {/* Cost Price */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Cost Price (₹) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.costPrice}
                onChange={(e) => handleChange('costPrice', e.target.value)}
                placeholder="867.00"
                className={cn('input-base pl-8', errors.costPrice && 'input-error')}
              />
            </div>
            {errors.costPrice && <p className="mt-1 text-sm text-red-400">{errors.costPrice}</p>}
          </div>

          {/* Margin */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1 flex items-center gap-1">
              Margin per Cylinder (₹) *
              <Calculator className="w-4 h-4 text-slate-500" />
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.margin}
                onChange={(e) => handleChange('margin', e.target.value)}
                placeholder="50.00"
                className={cn('input-base pl-8', errors.margin && 'input-error')}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Margin: {marginPercent}% of selling price | Auto-calculated from price - cost
            </p>
            {errors.margin && <p className="mt-1 text-sm text-red-400">{errors.margin}</p>}
          </div>

          {/* Live Preview */}
          <div className="p-4 bg-gradient-to-r from-brand-500/10 to-emerald-500/10 rounded-xl border border-brand-500/20">
            <h4 className="text-sm font-medium text-slate-300 mb-2">Live Preview</h4>
            <div className="grid gap-2 sm:grid-cols-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Selling Price</span><span className="font-bold text-white">{formatCurrency(parseFloat(formData.cylinderPrice) * 100)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Cost Price</span><span className="font-bold text-white">{formatCurrency(parseFloat(formData.costPrice) * 100)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Margin</span><span className="font-bold text-emerald-400">{formatCurrency(parseFloat(formData.margin) * 100)} ({marginPercent}%)</span></div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={3}
              placeholder="Reason for price change, supplier notification, etc."
              className="input-base resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-8 pt-6 border-t border-slate-700/50">
          <Link href="/pricing" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving...</span>
            ) : (
              <span className="flex items-center gap-2"><DollarSign className="w-4 h-4" /> Create Price Period</span>
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