import { Suspense } from 'react'
import { PaymentsList } from './components/payments-list'
import { PageHeader } from '@/components/page-header'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayPayments = await prisma.payment.findMany({
    where: { date: { gte: today, lt: new Date(today.getTime() + 24*60*60*1000) } },
    include: { driver: { select: { id: true, code: true, name: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const totalToday = todayPayments.reduce((sum, p) => sum + p.amount, 0)
  const cashToday = todayPayments.filter(p => p.method === 'CASH').reduce((sum, p) => sum + p.amount, 0)
  const upiToday = todayPayments.filter(p => p.method === 'UPI').reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Payments"
        description="Record and track driver payments"
        actions={
          <a href="/payments/new" className="btn-primary">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Record Payment
          </a>
        }
      />

      {/* Today's Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        <SummaryCard title="Today's Total" value={formatCurrency(totalToday)} icon={<CreditCard className="w-5 h-5" />} iconBg="bg-brand-500/20" iconColor="text-brand-400" />
        <SummaryCard title="Cash" value={formatCurrency(cashToday)} subtitle={`${todayPayments.filter(p => p.method === 'CASH').length} transactions`} icon={<DollarSign className="w-5 h-5" />} iconBg="bg-emerald-500/20" iconColor="text-emerald-400" />
        <SummaryCard title="UPI/Online" value={formatCurrency(upiToday)} subtitle={`${todayPayments.filter(p => p.method !== 'CASH').length} transactions`} icon={<Smartphone className="w-5 h-5" />} iconBg="bg-blue-500/20" iconColor="text-blue-400" />
        <SummaryCard title="Transactions" value={todayPayments.length} subtitle="Today" icon={<Receipt className="w-5 h-5" />} iconBg="bg-slate-700/50" iconColor="text-slate-300" />
      </div>

      <Suspense fallback={<PaymentsListSkeleton />}>
        <PaymentsList date={today.toISOString().split('T')[0]} />
      </Suspense>
    </div>
  )
}

import { CreditCard, DollarSign, Smartphone, Receipt, AlertTriangle, CheckCircle2, Clock, Cylinder, ExternalLink } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { cn } from '@/lib/utils'

function SummaryCard({ title, value, subtitle, icon, iconBg, iconColor }: any) {
  return (
    <div className="glass p-5 rounded-2xl border border-slate-700/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className={cn('p-3 rounded-xl', iconBg)}>
          <span className={cn('text-2xl', iconColor)}>{icon}</span>
        </div>
      </div>
    </div>
  )
}

function PaymentsListSkeleton() {
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