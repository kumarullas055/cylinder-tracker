"use client"

import { formatCurrency, formatNumber } from '@/lib/utils'
import { Cylinder, DollarSign, Truck, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  trend?: 'up' | 'down' | 'neutral'
}

function StatCard({ title, value, change, changeLabel, icon, iconBg, iconColor, trend }: StatCardProps) {
  return (
    <div className="glass p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600/50 transition-colors animate-slide-up">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1 mt-2">
              {trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              ) : trend === 'down' ? (
                <TrendingDown className="w-4 h-4 text-red-400" />
              ) : null}
              <span className={cn(
                'text-sm font-medium',
                trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-slate-500'
              )}>
                {change >= 0 ? '+' : ''}{change}%
              </span>
              {changeLabel && (
                <span className="text-sm text-slate-500">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl', iconBg)}>
          <span className={cn('text-2xl', iconColor)}>{icon}</span>
        </div>
      </div>
    </div>
  )
}

export function DashboardStats() {
  // TODO: Fetch real data from API
  const stats = [
    {
      title: 'Expected Cash Today',
      value: formatCurrency(27510000), // ₹2,75,100
      change: 12,
      changeLabel: 'vs yesterday',
      trend: 'up' as const,
      icon: <DollarSign className="w-6 h-6" />,
      iconBg: 'bg-brand-500/20',
      iconColor: 'text-brand-400',
    },
    {
      title: 'Collected Today',
      value: formatCurrency(18340000), // ₹1,83,400
      change: 8,
      changeLabel: 'vs yesterday',
      trend: 'up' as const,
      icon: <DollarSign className="w-6 h-6" />,
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Outstanding Dues',
      value: formatCurrency(9170000), // ₹91,700
      change: -5,
      changeLabel: 'vs last week',
      trend: 'down' as const,
      icon: <AlertTriangle className="w-6 h-6" />,
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400',
    },
    {
      title: 'Active Drivers',
      value: '24',
      change: 2,
      changeLabel: 'this month',
      trend: 'up' as const,
      icon: <Truck className="w-6 h-6" />,
      iconBg: 'bg-slate-700/50',
      iconColor: 'text-slate-300',
    },
    {
      title: 'Full Cylinders in Stock',
      value: formatNumber(156),
      change: -8,
      changeLabel: 'vs last week',
      trend: 'down' as const,
      icon: <Cylinder className="w-6 h-6" strokeWidth={2} />,
      iconBg: 'bg-brand-500/20',
      iconColor: 'text-brand-400',
    },
    {
      title: 'Empty Cylinders in Stock',
      value: formatNumber(89),
      change: 15,
      changeLabel: 'vs last week',
      trend: 'up' as const,
      icon: <Cylinder className="w-6 h-6" strokeWidth={2} />,
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
    {
      title: 'Cylinders Sold Today',
      value: formatNumber(30),
      change: 3,
      changeLabel: 'vs avg',
      trend: 'up' as const,
      icon: <Cylinder className="w-6 h-6" strokeWidth={2} />,
      iconBg: 'bg-slate-700/50',
      iconColor: 'text-slate-300',
    },
    {
      title: "Today's Profit",
      value: formatCurrency(1500000), // ₹15,000
      change: 18,
      changeLabel: 'vs yesterday',
      trend: 'up' as const,
      icon: <TrendingUp className="w-6 h-6" />,
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}

import { cn } from '@/lib/utils'