import { Suspense } from 'react'
import { ReportsDashboard } from './components/reports-dashboard'
import { PageHeader } from '@/components/page-header'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  // Get quick stats for the month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1)

  const [monthlyAllocations, weeklyAllocations] = await Promise.all([
    prisma.dailyAllocation.findMany({
      where: { date: { gte: startOfMonth } },
      include: { driver: { select: { id: true, code: true, name: true } }, payments: true },
    }),
    prisma.dailyAllocation.findMany({
      where: { date: { gte: startOfWeek } },
      include: { driver: { select: { id: true, code: true, name: true } }, payments: true },
    }),
  ])

  const monthlySold = monthlyAllocations.reduce((sum, a) => sum + a.fullCylindersSold, 0)
  const monthlyRevenue = monthlyAllocations.reduce((sum, a) => sum + a.expectedCash, 0)
  const monthlyCollected = monthlyAllocations.flatMap(a => a.payments).reduce((sum, p) => sum + p.amount, 0)
  const monthlyProfit = monthlySold * 5000 // ₹50 margin

  const weeklySold = weeklyAllocations.reduce((sum, a) => sum + a.fullCylindersSold, 0)
  const weeklyRevenue = weeklyAllocations.reduce((sum, a) => sum + a.expectedCash, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Reports & Analytics"
        description="Business insights and exportable reports"
        actions={
          <div className="flex gap-2">
            <button className="btn-secondary">Export PDF</button>
            <button className="btn-secondary">Export Excel</button>
          </div>
        }
      />

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="This Month" value={formatNumber(monthlySold)} subtitle="Cylinders Sold" icon={<Package className="w-5 h-5" />} iconBg="bg-brand-500/20" iconColor="text-brand-400" />
        <StatCard title="This Month" value={formatCurrency(monthlyRevenue)} subtitle="Revenue" icon={<DollarSign className="w-5 h-5" />} iconBg="bg-emerald-500/20" iconColor="text-emerald-400" />
        <StatCard title="This Month" value={formatCurrency(monthlyProfit)} subtitle="Profit (₹50/cyl)" icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-amber-500/20" iconColor="text-amber-400" />
        <StatCard title="Collection Rate" value={monthlyRevenue > 0 ? ((monthlyCollected / monthlyRevenue) * 100).toFixed(1) + '%' : '0%'} subtitle="Collected vs Expected" icon={<CheckCircle2 className="w-5 h-5" />} iconBg="bg-blue-500/20" iconColor="text-blue-400" />
      </div>

      <Suspense fallback={<ReportsDashboardSkeleton />}>
        <ReportsDashboard />
      </Suspense>
    </div>
  )
}

import { Package, DollarSign, TrendingUp, CheckCircle2, FileText, Download, BarChart3, Users, Cylinder } from 'lucide-react'
import { cn } from '@/lib/utils'

function StatCard({ title, value, subtitle, icon, iconBg, iconColor }: any) {
  return (
    <div className="glass p-5 rounded-2xl border border-slate-700/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>
        <div className={cn('p-3 rounded-xl', iconBg)}>
          <span className={cn('text-2xl', iconColor)}>{icon}</span>
        </div>
      </div>
    </div>
  )
}

function ReportsDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-slate-700/50 p-6">
        <div className="skeleton h-6 w-48 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="glass rounded-2xl border border-slate-700/50 p-6">
        <div className="skeleton h-6 w-48 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-14 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}