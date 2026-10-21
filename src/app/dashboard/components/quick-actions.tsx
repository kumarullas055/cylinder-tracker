"use client"

import Link from 'next/link'
import { Cylinder, Truck, Plus, DollarSign, Package, CreditCard, BarChart3, Settings, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuickAction {
  name: string
  description: string
  href: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  badge?: string
  badgeColor?: string
}

const actions: QuickAction[] = [
  {
    name: 'Morning Allocation',
    description: 'Issue cylinders to drivers for the day',
    href: '/allocations/new',
    icon: <Package className="w-5 h-5" />,
    iconBg: 'bg-brand-500/20',
    iconColor: 'text-brand-400',
    badge: 'Daily',
    badgeColor: 'bg-brand-500/20 text-brand-400',
  },
  {
    name: 'Evening Closeout',
    description: 'Record sales, returns & empties collected',
    href: '/allocations/close',
    icon: <Cylinder className="w-5 h-5" strokeWidth={2} />,
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    badge: 'Daily',
    badgeColor: 'bg-emerald-500/20 text-emerald-400',
  },
  {
    name: 'Record Payment',
    description: 'Log cash/UPI collected from drivers',
    href: '/payments/new',
    icon: <CreditCard className="w-5 h-5" />,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    badge: 'Multiple/day',
    badgeColor: 'bg-amber-500/20 text-amber-400',
  },
  {
    name: 'Add Driver',
    description: 'Register new delivery driver',
    href: '/drivers/new',
    icon: <Truck className="w-5 h-5" />,
    iconBg: 'bg-slate-700/50',
    iconColor: 'text-slate-300',
  },
  {
    name: 'Stock Update',
    description: 'Log refills received or adjustments',
    href: '/stock/update',
    icon: <Cylinder className="w-5 h-5" strokeWidth={2} />,
    iconBg: 'bg-brand-500/20',
    iconColor: 'text-brand-400',
  },
  {
    name: 'Set New Price',
    description: 'Update cylinder price & margin',
    href: '/pricing/new',
    icon: <DollarSign className="w-5 h-5" />,
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    name: 'View Reports',
    description: 'Daily, monthly & driver reports',
    href: '/reports',
    icon: <BarChart3 className="w-5 h-5" />,
    iconBg: 'bg-slate-700/50',
    iconColor: 'text-slate-300',
  },
  {
    name: 'Settings',
    description: 'Configure alerts, thresholds & more',
    href: '/settings',
    icon: <Settings className="w-5 h-5" />,
    iconBg: 'bg-slate-700/50',
    iconColor: 'text-slate-300',
  },
]

export function QuickActions() {
  return (
    <div className="glass rounded-2xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-lg bg-brand-500/20">
            <Plus className="w-5 h-5 text-brand-400" />
          </span>
          <h3 className="text-lg font-semibold text-white">Quick Actions</h3>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className={cn(
              'p-4 rounded-xl border border-slate-700/50',
              'hover:border-brand-500/30 hover:bg-slate-800/50',
              'transition-all duration-200 group',
              'flex flex-col gap-3'
            )}
          >
            <div className="flex items-center justify-between">
              <div className={cn('p-3 rounded-xl', action.iconBg)}>
                {action.icon}
              </div>
              {action.badge && (
                <span className={cn('badge text-xs', action.badgeColor)}>
                  {action.badge}
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-white group-hover:text-brand-300 transition-colors">
                {action.name}
              </p>
              <p className="text-sm text-slate-500 mt-1">{action.description}</p>
            </div>
            <div className="flex items-center gap-1 text-brand-400 text-sm font-medium group-hover:gap-2 transition-all">
              <span>Open</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}