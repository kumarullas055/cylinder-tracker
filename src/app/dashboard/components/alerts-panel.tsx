"use client"

import { AlertTriangle, AlertCircle, Truck, Cylinder, DollarSign, Bell, Clock, User, TrendingUp } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Alert {
  id: string
  type: 'warning' | 'danger' | 'info' | 'success'
  title: string
  message: string
  time: string
  action?: { label: string; href: string }
  driver?: { name: string; code: string }
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'danger',
    title: 'Cash Shortfall - Suresh Singh (DRV-002)',
    message: `Shortfall of ${formatCurrency(92500)} on today's allocation. Driver has not deposited full amount.`,
    time: '2 hours ago',
    action: { label: 'View Details', href: '/allocations/2' },
    driver: { name: 'Suresh Singh', code: 'DRV-002' },
  },
  {
    id: '2',
    type: 'danger',
    title: 'Cash Shortfall - Dinesh Yadav (DRV-004)',
    message: `Shortfall of ${formatCurrency(184200)} on today's allocation. Driver dues now exceed threshold.`,
    time: '3 hours ago',
    action: { label: 'View Details', href: '/allocations/4' },
    driver: { name: 'Dinesh Yadav', code: 'DRV-004' },
  },
  {
    id: '3',
    type: 'warning',
    title: 'Low Stock Alert - Full Cylinders',
    message: 'Only 156 full cylinders remaining. Below reorder threshold of 200. Place order with supplier.',
    time: '4 hours ago',
    action: { label: 'View Stock', href: '/stock' },
  },
  {
    id: '4',
    type: 'warning',
    title: 'Pending Closeout - Mahesh Patel (DRV-003)',
    message: 'Driver has not completed evening closeout. 30 cylinders issued this morning remain unaccounted.',
    time: '1 hour ago',
    action: { label: 'Close Day', href: '/allocations/close?driver=3' },
    driver: { name: 'Mahesh Patel', code: 'DRV-003' },
  },
  {
    id: '5',
    type: 'info',
    title: 'Driver Dues Threshold Exceeded',
    message: '3 drivers have outstanding dues above ₹5,000 threshold. Review driver ledgers.',
    time: '6 hours ago',
    action: { label: 'View Ledgers', href: '/drivers?filter=dues' },
  },
  {
    id: '6',
    type: 'success',
    title: 'Daily Reconciliation Complete',
    message: '22 of 24 drivers have completed closeout. Cash collected: ₹1,83,400 vs Expected: ₹2,75,100',
    time: '30 min ago',
  },
  {
    id: '7',
    type: 'info',
    title: 'Price Change Effective Tomorrow',
    message: 'New cylinder price ₹925 (margin ₹50) takes effect tomorrow. Update allocations accordingly.',
    time: '1 day ago',
    action: { label: 'View Pricing', href: '/pricing' },
  },
]

function AlertIcon({ type }: { type: Alert['type'] }) {
  const icons = {
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    danger: <AlertCircle className="w-5 h-5 text-red-400" />,
    info: <Bell className="w-5 h-5 text-brand-400" />,
    success: <TrendingUp className="w-5 h-5 text-emerald-400" />,
  }
  const bgColors = {
    warning: 'bg-amber-500/20',
    danger: 'bg-red-500/20',
    info: 'bg-brand-500/20',
    success: 'bg-emerald-500/20',
  }
  return (
    <div className={cn('p-2 rounded-xl flex-shrink-0', bgColors[type])}>
      {icons[type]}
    </div>
  )
}

export function AlertsPanel() {
  const unreadCount = mockAlerts.filter(a => a.type === 'danger' || a.type === 'warning').length

  return (
    <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">Alerts & Notifications</h3>
        </div>
        {unreadCount > 0 && (
          <span className="badge badge-danger">{unreadCount} critical</span>
        )}
      </div>

      <div className="divide-y divide-slate-800/50 max-h-[500px] overflow-y-auto">
        {mockAlerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              'p-4 hover:bg-slate-800/30 transition-colors',
              alert.type === 'danger' && 'bg-red-500/5 border-l-4 border-red-500',
              alert.type === 'warning' && 'bg-amber-500/5 border-l-4 border-amber-500'
            )}
          >
            <div className="flex gap-3">
              <AlertIcon type={alert.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-white">{alert.title}</p>
                  <time className="text-xs text-slate-500 whitespace-nowrap">{alert.time}</time>
                </div>
                <p className="text-sm text-slate-300 mt-1">{alert.message}</p>
                {alert.driver && (
                  <div className="flex items-center gap-2 mt-2">
                    <User className="w-3 h-3 text-slate-500" />
                    <span className="text-xs text-slate-500">{alert.driver.name} ({alert.driver.code})</span>
                  </div>
                )}
                {alert.action && (
                  <a
                    href={alert.action.href}
                    className="inline-flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300 mt-2 font-medium"
                  >
                    {alert.action.label}
                    <TrendingUp className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {mockAlerts.length === 0 && (
        <div className="empty-state py-8">
          <Bell className="empty-state-icon" />
          <p className="empty-state-title">No alerts</p>
          <p className="empty-state-description">Everything looks good!</p>
        </div>
      )}
    </div>
  )
}