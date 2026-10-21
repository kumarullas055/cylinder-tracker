"use client"

import { useState, useEffect } from 'react'
import { Loader2, Save, AlertCircle, CheckCircle2, SlidersHorizontal, Users, Package, DollarSign, Bell, CreditCard, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Setting {
  key: string
  value: string
  category: string
}

interface SettingsState {
  low_stock_threshold_full: string
  low_stock_threshold_empty: string
  default_dues_threshold: string
  default_cylinders_per_driver: string
  auto_close_time: string
  company_name: string
  company_phone: string
  company_address: string
}

const initialState: SettingsState = {
  low_stock_threshold_full: '200',
  low_stock_threshold_empty: '100',
  default_dues_threshold: '500000',
  default_cylinders_per_driver: '30',
  auto_close_time: '20:00',
  company_name: 'CylinTrack Gas Distribution',
  company_phone: '+91-22-12345678',
  company_address: 'Mumbai, Maharashtra',
}

const categories = [
  { key: 'STOCK', label: 'Stock Alerts', icon: Package, color: 'text-brand-400', bg: 'bg-brand-500/20' },
  { key: 'DRIVERS', label: 'Driver Settings', icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { key: 'ALLOCATIONS', label: 'Allocation Defaults', icon: Package, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  { key: 'GENERAL', label: 'Company Info', icon: SlidersHorizontal, color: 'text-slate-300', bg: 'bg-slate-700/50' },
]

const settingsConfig: Record<string, { label: string; type: 'number' | 'text' | 'time'; min?: number; max?: number; step?: number; category: keyof SettingsState }> = {
  low_stock_threshold_full: { label: 'Low Stock Alert (Full Cylinders)', type: 'number', min: 0, max: 10000, step: 10, category: 'STOCK' },
  low_stock_threshold_empty: { label: 'Low Stock Alert (Empty Cylinders)', type: 'number', min: 0, max: 10000, step: 10, category: 'STOCK' },
  default_dues_threshold: { label: 'Default Dues Alert Threshold (₹)', type: 'number', min: 0, max: 1000000, step: 10000, category: 'DRIVERS' },
  default_cylinders_per_driver: { label: 'Default Cylinders per Driver', type: 'number', min: 1, max: 100, step: 1, category: 'ALLOCATIONS' },
  auto_close_time: { label: 'Auto Close Time', type: 'time', category: 'ALLOCATIONS' },
  company_name: { label: 'Company Name', type: 'text', category: 'GENERAL' },
  company_phone: { label: 'Company Phone', type: 'text', category: 'GENERAL' },
  company_address: { label: 'Company Address', type: 'text', category: 'GENERAL' },
}

export function SettingsForm() {
  const [settings, setSettings] = useState<SettingsState>(initialState)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeCategory, setActiveCategory] = useState<keyof SettingsState>('STOCK')

  // Load settings from API
  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.settings) {
          const loaded: Partial<SettingsState> = {}
          data.settings.forEach((s: Setting) => {
            if (s.key in initialState) {
              loaded[s.key as keyof SettingsState] = s.value
            }
          })
          setSettings(prev => ({ ...prev, ...loaded }))
        }
      })
      .catch(() => setErrors({ fetch: 'Failed to load settings' }))
  }, [])

  const handleChange = (key: keyof SettingsState, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setErrors({})
    setSaved(false)

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      } else {
        const data = await res.json()
        setErrors({ submit: data.error || 'Failed to save settings' })
      }
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const formatCurrency = (paise: number | string) => {
    const num = typeof paise === 'string' ? parseInt(paise) || 0 : paise
    return `₹${(num / 100).toLocaleString('en-IN')}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="p-2 rounded-lg bg-brand-500/20">
          <SlidersHorizontal className="w-6 h-6 text-brand-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-slate-400 mt-1">Configure system preferences and defaults</p>
        </div>
      </div>

      {errors.submit && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-300 text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>{errors.submit}</div>
        </div>
      )}

      {saved && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div>Settings saved successfully!</div>
        </div>
      )}

      <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
        {/* Category Tabs */}
        <div className="border-b border-slate-700/50 p-4 flex flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = cat.icon
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key as keyof SettingsState)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
                  activeCategory === cat.key
                    ? `bg-${cat.bg} text-${cat.color} border border-${cat.color}/30`
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                )}
              >
                <Icon className={cn('w-4 h-4', cat.color)} />
                {cat.label}
              </button>
            )
          })}
        </div>

        {/* Settings Form */}
        <div className="p-6">
          {Object.entries(settingsConfig)
            .filter(([_, config]) => config.category === activeCategory)
            .map(([key, config]) => {
              const Icon = config.category === 'STOCK' ? Package : config.category === 'DRIVERS' ? Users : config.category === 'ALLOCATIONS' ? DollarSign : SlidersHorizontal
              return (
                <div key={key} className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-3 mb-3">
                    <Icon className={cn('w-5 h-5', config.category === 'STOCK' && 'text-brand-400', config.category === 'DRIVERS' && 'text-emerald-400', config.category === 'ALLOCATIONS' && 'text-amber-400', config.category === 'GENERAL' && 'text-slate-300')} />
                    <label className="text-lg font-medium text-white">{config.label}</label>
                  </div>
                  {config.type === 'number' && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={config.min}
                        max={config.max}
                        step={config.step}
                        value={settings[key as keyof SettingsState]}
                        onChange={(e) => handleChange(key as keyof SettingsState, e.target.value)}
                        className="input-base w-40"
                      />
                      {key === 'default_dues_threshold' && <span className="text-slate-400 text-sm">{formatCurrency(settings[key as keyof SettingsState])}</span>}
                    </div>
                  )}
                  {config.type === 'time' && (
                    <input
                      type="time"
                      value={settings[key as keyof SettingsState]}
                      onChange={(e) => handleChange(key as keyof SettingsState, e.target.value)}
                      className="input-base w-40"
                    />
                  )}
                  {config.type === 'text' && (
                    <input
                      type="text"
                      value={settings[key as keyof SettingsState]}
                      onChange={(e) => handleChange(key as keyof SettingsState, e.target.value)}
                      className="input-base w-full max-w-md"
                    />
                  )}
                  {errors[key as keyof SettingsState] && (
                    <p className="text-red-400 text-sm mt-1">{errors[key as keyof SettingsState]}</p>
                  )}
                </div>
              )
            })}
        </div>

        {/* Save Button */}
        <div className="border-t border-slate-700/50 p-6 flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Settings
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}