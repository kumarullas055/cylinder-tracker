import { Suspense } from 'react'
import { StockDashboard } from './components/stock-dashboard'
import { PageHeader } from '@/components/page-header'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function StockPage() {
  // Get current stock levels
  const stockMovements = await prisma.stockMovement.groupBy({
    by: ['type'],
    _sum: { quantity: true },
  })

  const fullStock = stockMovements.find(s => s.type === 'FULL')?._sum.quantity || 0
  const emptyStock = stockMovements.find(s => s.type === 'EMPTY')?._sum.quantity || 0

  // Today's movements
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayMovements = await prisma.stockMovement.findMany({
    where: { date: { gte: today, lt: new Date(today.getTime() + 24*60*60*1000) } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Godown Stock"
        description="Track full and empty cylinder inventory"
        actions={
          <a href="/stock/update" className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Update Stock
          </a>
        }
      />

      {/* Stock Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StockCard
          title="Full Cylinders"
          value={fullStock}
          subtitle={fullStock < 200 ? '⚠ Below reorder level (200)' : 'In stock'}
          icon={<Package className="w-5 h-5" />}
          iconBg={fullStock < 200 ? 'bg-red-500/20' : 'bg-emerald-500/20'}
          iconColor={fullStock < 200 ? 'text-red-400' : 'text-emerald-400'}
          alert={fullStock < 200}
        />
        <StockCard
          title="Empty Cylinders"
          value={emptyStock}
          subtitle={emptyStock < 100 ? '⚠ Low empties (100)' : 'Available for exchange'}
          icon={<Package className="w-5 h-5" />}
          iconBg={emptyStock < 100 ? 'bg-amber-500/20' : 'bg-blue-500/20'}
          iconColor={emptyStock < 100 ? 'text-amber-400' : 'text-blue-400'}
          alert={emptyStock < 100}
        />
        <StockCard
          title="Total in Circulation"
          value={fullStock + emptyStock}
          subtitle="Full + Empty"
          icon={<Package className="w-5 h-5" />}
          iconBg="bg-brand-500/20"
          iconColor="text-brand-400"
        />
        <StockCard
          title="Net Full Stock"
          value={fullStock - emptyStock}
          subtitle="After accounting for empties"
          icon={<Package className="w-5 h-5" />}
          iconBg="bg-slate-700/50"
          iconColor="text-slate-300"
        />
      </div>

      <Suspense fallback={<StockDashboardSkeleton />}>
        <StockDashboard date={today.toISOString().split('T')[0]} />
      </Suspense>
    </div>
  )
}

import { Package, AlertTriangle, TrendingUp, TrendingDown, Clock, Cylinder, Plus, Minus, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

function StockCard({ title, value, subtitle, icon, iconBg, iconColor, alert }: any) {
  return (
    <div className={cn('glass p-5 rounded-2xl border border-slate-700/50', alert && 'border-red-500/30 bg-red-500/5')}>
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

function StockDashboardSkeleton() {
  return (
    <div className="glass rounded-2xl border border-slate-700/50 p-6">
      <div className="skeleton h-6 w-48 rounded mb-4" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-14 rounded-xl" />
        ))}
      </div>
    </div>
  )
}