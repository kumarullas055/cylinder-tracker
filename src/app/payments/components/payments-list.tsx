import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import { CreditCard, AlertTriangle, CheckCircle2, Clock, Cylinder, DollarSign, ExternalLink, Filter, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export async function PaymentsList({ date }: { date: string }) {
  const targetDate = new Date(date + 'T00:00:00.000Z')
  const endDate = new Date(targetDate.getTime() + 24*60*60*1000)

  const payments = await prisma.payment.findMany({
    where: { date: { gte: targetDate, lt: endDate } },
    include: {
      driver: { select: { id: true, code: true, name: true, phone: true } },
      allocation: { select: { expectedCash: true, fullCylindersSold: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Group by driver
  const byDriver = new Map()
  payments.forEach(p => {
    if (!byDriver.has(p.driverId)) byDriver.set(p.driverId, { driver: p.driver, payments: [], total: 0 })
    const d = byDriver.get(p.driverId)
    d.payments.push(p)
    d.total += p.amount
  })

  return (
    <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-400" />
          <h3 className="text-lg font-semibold text-white">Payments for {formatDate(targetDate)}</h3>
        </div>
        <div className="flex items-center gap-2">
          <select className="input-base w-auto py-2" defaultValue={date}>
            <option value={date}>Today</option>
          </select>
        </div>
      </div>

      <div className="divide-y divide-slate-800/50">
        {Array.from(byDriver.entries()).map(([driverId, data]) => (
          <div key={driverId} className="p-4 hover:bg-slate-800/30 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                  <Cylinder className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-medium text-white">{data.driver.name}</p>
                  <p className="text-sm text-slate-400">{data.driver.code} • {data.driver.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-emerald-400 text-lg">{formatCurrency(data.total)}</span>
                {data.allocation && (
                  <span className={cn('badge text-xs', data.total >= data.allocation.expectedCash ? 'badge-success' : 'badge-danger')}>
                    {data.total >= (data.allocation?.expectedCash || 0) ? 'Tallied' : `Short ${formatCurrency((data.allocation?.expectedCash || 0) - data.total)}`}
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-6 text-sm">
              {data.payments.map((p: any, i: number) => (
                <div key={`${driverId}-${i}`} className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="flex items-center justify-between mb-1">
                    <span className="badge badge-neutral">{p.method}</span>
                    <span className="font-medium text-emerald-400">{formatCurrency(p.amount)}</span>
                  </div>
                  <p className="text-xs text-slate-500">{formatDateTime(p.createdAt)}</p>
                  {p.notes && <p className="text-xs text-slate-400 line-clamp-1">{p.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {payments.length === 0 && (
        <div className="empty-state py-16">
          <CreditCard className="empty-state-icon" />
          <p className="empty-state-title">No payments today</p>
          <p className="empty-state-description">Record payments as drivers hand in cash</p>
        </div>
      )}
    </div>
  )
}