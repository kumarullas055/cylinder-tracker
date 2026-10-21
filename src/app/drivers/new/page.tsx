"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Truck, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const vehicleTypes = ['TATA ACE', 'MAHINDRA MAXX', 'ASHOK LEYLAND', 'EICHER', 'OTHER']

export default function NewDriverPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    phone: '',
    vehicleNumber: '',
    vehicleType: '',
    licenseNumber: '',
    licenseExpiry: '',
    joiningDate: new Date().toISOString().split('T')[0],
    duesThreshold: '500000',
  })

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.code.trim()) newErrors.code = 'Driver code is required'
    if (!formData.name.trim()) newErrors.name = 'Driver name is required'
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required'
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Enter a valid 10-digit phone number'
    if (!formData.joiningDate) newErrors.joiningDate = 'Joining date is required'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const res = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          duesThreshold: parseInt(formData.duesThreshold),
        }),
      })
      if (res.ok) {
        router.push('/drivers')
        router.refresh()
      } else {
        const data = await res.json()
        setErrors({ submit: data.error || 'Failed to create driver' })
      }
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/drivers" className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Add New Driver</h1>
          <p className="text-slate-400 mt-1">Register a new delivery driver</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-2xl border border-slate-700/50 p-6 max-w-2xl">
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-300 text-sm">
            <Truck className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div>{errors.submit}</div>
          </div>
        )}

        <div className="space-y-5">
          {/* Basic Info Section */}
          <div className="pt-4 border-t border-slate-700/50">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-brand-400" />
              Basic Information
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-slate-300 mb-1">Driver Code *</label>
                <input
                  id="code"
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  placeholder="DRV-001"
                  className={cn('input-base', errors.code && 'input-error')}
                  maxLength={20}
                />
                {errors.code && <p className="mt-1 text-sm text-red-400">{errors.code}</p>}
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Rajesh Kumar"
                  className={cn('input-base', errors.name && 'input-error')}
                />
                {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-1">Phone Number *</label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value.replace(/\D/g, ''))}
                  placeholder="9876543210"
                  className={cn('input-base', errors.phone && 'input-error')}
                  maxLength={10}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="joiningDate" className="block text-sm font-medium text-slate-300 mb-1">Joining Date *</label>
                <input
                  id="joiningDate"
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => handleChange('joiningDate', e.target.value)}
                  className={cn('input-base', errors.joiningDate && 'input-error')}
                />
                {errors.joiningDate && <p className="mt-1 text-sm text-red-400">{errors.joiningDate}</p>}
              </div>
            </div>
          </div>

          {/* Vehicle Info Section */}
          <div className="pt-4 border-t border-slate-700/50">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-brand-400" />
              Vehicle Details
            </h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="vehicleType" className="block text-sm font-medium text-slate-300 mb-1">Vehicle Type</label>
                <select
                  id="vehicleType"
                  value={formData.vehicleType}
                  onChange={(e) => handleChange('vehicleType', e.target.value)}
                  className="input-base"
                >
                  <option value="">Select vehicle type</option>
                  {vehicleTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="vehicleNumber" className="block text-sm font-medium text-slate-300 mb-1">Vehicle Number</label>
                <input
                  id="vehicleNumber"
                  type="text"
                  value={formData.vehicleNumber}
                  onChange={(e) => handleChange('vehicleNumber', e.target.value.toUpperCase())}
                  placeholder="MH-12-AB-1234"
                  className="input-base"
                />
              </div>
            </div>
          </div>

          {/* License Info Section */}
          <div className="pt-4 border-t border-slate-700/50">
            <h3 className="text-lg font-medium text-white mb-4">License Information</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="licenseNumber" className="block text-sm font-medium text-slate-300 mb-1">License Number</label>
                <input
                  id="licenseNumber"
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => handleChange('licenseNumber', e.target.value)}
                  placeholder="DL-0120250123456"
                  className="input-base"
                />
              </div>
              <div>
                <label htmlFor="licenseExpiry" className="block text-sm font-medium text-slate-300 mb-1">License Expiry</label>
                <input
                  id="licenseExpiry"
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) => handleChange('licenseExpiry', e.target.value)}
                  className="input-base"
                />
              </div>
            </div>
          </div>

          {/* Financial Settings Section */}
          <div className="pt-4 border-t border-slate-700/50">
            <h3 className="text-lg font-medium text-white mb-4">Financial Settings</h3>
            
            <div>
              <label htmlFor="duesThreshold" className="block text-sm font-medium text-slate-300 mb-1">Dues Alert Threshold (₹)</label>
              <input
                id="duesThreshold"
                type="number"
                value={formData.duesThreshold}
                onChange={(e) => handleChange('duesThreshold', e.target.value)}
                min="0"
                step="10000"
                className="input-base"
              />
              <p className="text-xs text-slate-500 mt-1">Alert when driver's outstanding dues exceed this amount (default: ₹5,000 = 500000 paise)</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-8 pt-6 border-t border-slate-700/50">
          <Link href="/drivers" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={isLoading} className="btn-primary">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </span>
            ) : (
              'Create Driver'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}