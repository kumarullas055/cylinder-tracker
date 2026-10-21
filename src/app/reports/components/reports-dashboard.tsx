import { prisma } from '@/lib/prisma'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { FileText, Download, BarChart3, Users, Cylinder, DollarSign, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export async function ReportsDashboard() {
  // Get last 30 days data
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const [allocations, drivers] = await Promise.all([
    prisma.dailyAllocation.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      include: { driver: { select: { id: true, code: true, name: true } }, payments: true },
      orderBy: { date: 'asc' },
    }),
    prisma.driver.findMany({
      where: { isActive: true },
      include: {
        allocations: { where: { status: { in: ['CLOSED', 'FLAGGED'] } }, select: { expectedCash: true, fullCylindersSold: true } },
        payments: { select: { amount: true } },
      },
    }),
  ])

  // Daily chart data
  const dailyData = new Map()
  allocations.forEach(a => {
    const dateStr = a.date.toISOString().split('T')[0]
    if (!dailyData.has(dateStr)) dailyData.set(dateStr, { date: dateStr, sold: 0, expected: 0, collected: 0 })
    const d = dailyData.get(dateStr)
    d.sold += a.fullCylindersSold
    d.expected += a.expectedCash
    d.collected += a.payments.reduce((sum, p) => sum + p.amount, 0)
  })

  // Driver performance
  const driverPerformance = drivers.map(d => {
    const totalExpected = d.allocations.reduce((sum, a) => sum + a.expectedCash, 0)
    const totalCollected = d.payments.reduce((sum, p) => sum + p.amount, 0)
    const totalSold = d.allocations.reduce((sum, a) => sum + a.fullCylindersSold, 0)
    const outstanding = totalExpected - totalCollected
    return { ...d, totalExpected, totalCollected, totalSold, outstanding }
  }).sort((a, b) => b.totalSold - a.totalSold)

  return (
    <div className="space-y-6">
      {/* Daily Sales Chart */}
      <div className="glass rounded-2xl border border-slate-700/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-400" />
            <h3 className="text-lg font-semibold text-white">Daily Sales (Last 30 Days)</h3>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm">Export CSV</button>
            <button className="btn-secondary text-sm">Export PDF</button>
          </div>
        </div>
        <div className="h-64">
          <DailySalesChart data={Array.from(dailyData.values()).slice(-30)} />
        </div>
      </div>

      {/* Driver Performance Table */}
      <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-400" />
            <h3 className="text-lg font-semibold text-white">Driver Performance (This Month)</h3>
          </div>
          <a href="/drivers" className="btn-ghost text-sm">View All</a>
        </div>

        <div className="overflow-x-auto">
          <table className="table-base w-full">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Driver</th>
                <th className="text-right">Cylinders</th>
                <th className="text-right">Revenue</th>
                <th className="text-right">Collected</th>
                <th className="text-right">Outstanding</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {driverPerformance.slice(0, 10).map((d, i) => (
                <tr key={d.id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono text-brand-400">#{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
                        <Cylinder className="w-4 h-4 text-white" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="font-medium text-white">{d.name}</p>
                        <p className="text-xs text-slate-400">{d.code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-white">{formatNumber(d.totalSold)}</td>
                  <td className="px-4 py-3 text-right text-emerald-400">{formatCurrency(d.totalExpected)}</td>
                  <td className="px-4 py-3 text-right text-emerald-400">{formatCurrency(d.totalCollected)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn('font-medium', d.outstanding > 0 ? 'text-red-400' : 'text-emerald-400')}>
                      {d.outstanding > 0 ? formatCurrency(d.outstanding) : 'Clear'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn('badge', d.outstanding > 500000 ? 'badge-danger' : 'badge-success')}>
                      {d.outstanding > 500000 ? 'Dues Alert' : 'Good'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <ReportCard title="Monthly Summary" items={[
          { label: 'Total Cylinders Sold', value: formatNumber(allocations.reduce((s, a) => s + a.fullCylindersSold, 0)) },
          { label: 'Total Revenue', value: formatCurrency(allocations.reduce((s, a) => s + a.expectedCash, 0)) },
          { label: 'Total Collected', value: formatCurrency(allocations.flatMap(a => a.payments).reduce((s, p) => s + p.amount, 0)) },
          { label: 'Avg Daily Sales', value: formatNumber(Math.round(allocations.reduce((s, a) => s + a.fullCylindersSold, 0) / 30)) },
        ]} />
        <ReportCard title="Stock Movement" items={[
          { label: 'Full Issued', value: formatNumber(allocations.reduce((s, a) => s + a.fullCylindersIssued, 0)) },
          { label: 'Full Returned', value: formatNumber(allocations.reduce((s, a) => s + a.fullCylindersReturned, 0)) },
          { label: 'Empties Collected', value: formatNumber(allocations.reduce((s, a) => s + a.emptyCylindersCollected, 0)) },
          { label: 'Net Full Change', value: formatNumber(allocations.reduce((s, a) => s + a.fullCylindersReturned - a.fullCylindersIssued, 0)) },
        ]} />
        <ReportCard title="Financial Health" items={[
          { label: 'Gross Profit (₹50/cyl)', value: formatCurrency(allocations.reduce((s, a) => s + a.fullCylindersSold, 0) * 5000) },
          { label: 'Cash Shortfalls', value: formatCurrency(driverPerformance.reduce((s, d) => s + Math.max(0, d.outstanding), 0)) },
          { label: 'Drivers with Dues', value: formatNumber(driverPerformance.filter(d => d.outstanding > 0).length) },
          { label: 'Collection Rate', value: (() => { const exp = allocations.reduce((s, a) => s + a.expectedCash, 0); const col = allocations.flatMap(a => a.payments).reduce((s, p) => s + p.amount, 0); return exp > 0 ? ((col / exp) * 100).toFixed(1) + '%' : '0%'; })() },
        ]} />
      </div>
    </div>
  )
}

function DailySalesChart({ data }: { data: { date: string; sold: number; expected: number; collected: number }[] }) {
  return (
    <div className="relative h-full flex items-end justify-center gap-1 px-2">
      {data.map((d, i) => (
        <div key={d.date} className="flex-1 flex flex-col items-center justify-end min-h-0" style={{ minWidth: '24px' }}>
          <div className="flex flex-col items-center gap-1 h-full justify-end" style={{ height: '100%' }}>
            <div className="w-full bg-emerald-500/30 rounded-t transition-all hover:bg-emerald-500/50" style={{ height: `${Math.max(4, (d.sold / 50) * 100)}%`, minHeight: '4px' }} title={`${formatDate(d.date)}: ${d.sold} cyl`} />
            <div className="w-full bg-brand-500/30 rounded-t transition-all hover:bg-brand-500/50" style={{ height: `${Math.max(4, (d.collected / (d.expected || 1)) * 100)}%`, minHeight: '4px' }} title={`Collected: ${formatCurrency(d.collected)}`} />
          </div>
          <span className="text-xs text-slate-500 mt-1 whitespace-nowrap">{d.date.split('-').slice(1).join('-')}</span>
        </div>
      ))}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 text-xs text-slate-500 mt-4">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-emerald-500/50 rounded" /> Sold</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-brand-500/50 rounded" /> Collected</span>
      </div>
    </div>
  )
}

function ReportCard({ title, items }: { title: string; items: { label: string; value: string }[] }) {
  return (
    <div className="glass rounded-2xl border border-slate-700/50 p-5">
      <h4 className="text-sm font-medium text-slate-400 mb-3">{title}</h4>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex justify-between py-2 border-b border-slate-800/50 last:border-0">
            <span className="text-sm text-slate-300">{item.label}</span>
            <span className="font-medium text-white">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}