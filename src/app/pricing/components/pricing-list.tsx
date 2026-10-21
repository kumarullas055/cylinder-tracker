import { DollarSign, Calendar, CheckCircle2, AlertTriangle, TrendingUp, Edit, Trash2 } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface PricePeriod {
  id: string
  effectiveFrom: Date
  cylinderPrice: number
  costPrice: number
  margin: number
  notes: string | null
  isActive: boolean
}

export async function PricingList({ periods }: { periods: PricePeriod[] }) {
  return (
    <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
      <div className="p-4 border-b border-slate-700/50">
        <h3 className="text-lg font-semibold text-white">Price History</h3>
      </div>

      <div className="divide-y divide-slate-800/50">
        {periods.map((period) => (
          <div key={period.id} className="p-4 hover:bg-slate-800/30 transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={cn('p-3 rounded-xl', period.isActive ? 'bg-emerald-500/20' : 'bg-slate-700/50')}>
                  {period.isActive ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <DollarSign className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">{formatCurrency(period.cylinderPrice)}</p>
                    {period.isActive && <span className="badge badge-success">Active</span>}
                  </div>
                  <p className="text-sm text-slate-400">
                    Effective: {formatDate(period.effectiveFrom)} • Cost: {formatCurrency(period.costPrice)} • Margin: {formatCurrency(period.margin)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-sm text-slate-400">
                  <TrendingUp className="w-4 h-4" />
                  <span>Margin: {formatCurrency(period.margin)}</span>
                </div>
                <Link href={`/pricing/${period.id}/edit`} className="btn-ghost p-2">
                  <Edit className="w-4 h-4" />
                </Link>
              </div>
            </div>
            {period.notes && (
              <p className="text-sm text-slate-500 mt-2 ml-10">{period.notes}</p>
            )}
          </div>
        ))}
      </div>

      {periods.length === 0 && (
        <div className="empty-state py-16">
          <DollarSign className="empty-state-icon" />
          <p className="empty-state-title">No price periods</p>
          <p className="empty-state-description">Create your first price period to get started</p>
        </div>
      )}
    </div>
  )
}