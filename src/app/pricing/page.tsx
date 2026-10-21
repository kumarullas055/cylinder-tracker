import { Suspense } from 'react'
import { PricingList } from './components/pricing-list'
import { PageHeader } from '@/components/page-header'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const pricePeriods = await prisma.pricePeriod.findMany({
    orderBy: { effectiveFrom: 'desc' },
  })

  const activePeriod = pricePeriods.find(p => p.isActive)
  const currentPrice = activePeriod?.cylinderPrice || 91700
  const currentMargin = activePeriod?.margin || 5000

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Pricing & Margin"
        description="Manage cylinder price periods and margins"
        actions={
          <a href="/pricing/new" className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Price Period
          </a>
        }
      />

      {/* Current Price Card */}
      <div className="glass rounded-2xl border border-slate-700/50 p-6 bg-gradient-to-br from-brand-500/10 to-brand-600/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-sm text-slate-400 mb-1">Current Selling Price</p>
            <p className="text-4xl font-bold text-white">{formatCurrency(currentPrice)}</p>
            <p className="text-sm text-slate-500 mt-1">Effective from {activePeriod ? formatDate(activePeriod.effectiveFrom) : 'Not set'}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-500/20 rounded-xl">
              <p className="text-xs text-emerald-400">Margin per Cylinder</p>
              <p className="text-2xl font-bold text-emerald-400">{formatCurrency(currentMargin)}</p>
            </div>
            <div className="p-4 bg-blue-500/20 rounded-xl">
              <p className="text-xs text-blue-400">Cost Price</p>
              <p className="text-2xl font-bold text-blue-400">{formatCurrency((activePeriod?.costPrice || (currentPrice - currentMargin)))}</p>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<PricingListSkeleton />}>
        <PricingList periods={pricePeriods} />
      </Suspense>
    </div>
  )
}

import { DollarSign, Calendar, CheckCircle2, AlertTriangle, TrendingUp, Edit } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

function PricingListSkeleton() {
  return (
    <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50"><div className="skeleton h-6 w-48 rounded" /></div>
      <div className="divide-y divide-slate-800/50">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2"><div className="skeleton h-4 w-3/4 rounded" /><div className="skeleton h-3 w-1/2 rounded" /></div>
            <div className="skeleton h-8 w-24 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}