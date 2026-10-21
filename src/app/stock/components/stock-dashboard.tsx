import { prisma } from '@/lib/prisma'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { Cylinder, AlertTriangle, TrendingUp, TrendingDown, Clock, ArrowUp, ArrowDown, Plus, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export async function StockDashboard({ date }: { date: string }) {
  const targetDate = new Date(date + 'T00:00:00.000Z')
  const endDate = new Date(targetDate.getTime() + 24*60*60*1000)

  // Today's movements
  const movements = await prisma.stockMovement.findMany({
    where: { date: { gte: targetDate, lt: endDate } },
    orderBy: { createdAt: 'desc' },
  })

  // Separate full and empty
  const fullMovements = movements.filter(m => m.type === 'FULL')
  const emptyMovements = movements.filter(m => m.type === 'EMPTY')

  // Calculate daily summary
  const fullIssued = fullMovements.filter(m => m.movementType === 'ISSUED_TO_DRIVER').reduce((sum, m) => sum + m.quantity, 0)
  const fullReturned = fullMovements.filter(m => m.movementType === 'RETURNED_FROM_DRIVER').reduce((sum, m) => sum + m.quantity, 0)
  const fullRefills = fullMovements.filter(m => m.movementType === 'REFILL_RECEIVED').reduce((sum, m) => sum + m.quantity, 0)
  const fullAdjustments = fullMovements.filter(m => m.movementType === 'MANUAL_ADJUSTMENT' || m.movementType === 'DAMAGED_LOST').reduce((sum, m) => sum + m.quantity, 0)

  const emptyCollected = emptyMovements.filter(m => m.movementType === 'RETURNED_FROM_DRIVER').reduce((sum, m) => sum + m.quantity, 0)
  const emptyIssued = emptyMovements.filter(m => m.movementType === 'ISSUED_TO_DRIVER').reduce((sum, m) => sum + m.quantity, 0)
  const emptyAdjustments = emptyMovements.filter(m => m.movementType === 'MANUAL_ADJUSTMENT' || m.movementType === 'DAMAGED_LOST').reduce((sum, m) => sum + m.quantity, 0)

  // Get opening stock (all movements before today)
  const openingMovements = await prisma.stockMovement.groupBy({
    by: ['type'],
    where: { date: { lt: targetDate } },
    _sum: { quantity: true },
  })

  const fullOpening = openingMovements.find(m => m.type === 'FULL')?._sum.quantity || 0
  const emptyOpening = openingMovements.find(m => m.type === 'EMPTY')?._sum.quantity || 0

  const fullClosing = fullOpening - fullIssued + fullReturned + fullRefills + fullAdjustments
  const emptyClosing = emptyOpening - emptyIssued + emptyCollected + emptyAdjustments

  return (
    <div className="space-y-6">
      {/* Daily Stock Report */}
      <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Cylinder className="w-5 h-5 text-brand-400" />
            <h3 className="text-lg font-semibold text-white">Daily Stock Report - {formatDate(targetDate)}</h3>
          </div>
        </div>

        <div className="p-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StockMetric label="Opening Full" value={formatNumber(fullOpening)} icon={<Cylinder className="w-5 h-5 text-slate-400" />} />
          <StockMetric label="Issued" value={formatNumber(fullIssued)} icon={<ArrowUp className="w-5 h-5 text-red-400" />} color="text-red-400" />
          <StockMetric label="Returned" value={formatNumber(fullReturned)} icon={<ArrowDown className="w-5 h-5 text-emerald-400" />} color="text-emerald-400" />
          <StockMetric label="Refills" value={formatNumber(fullRefills)} icon={<Plus className="w-5 h-5 text-blue-400" />} color="text-blue-400" />
          <StockMetric label="Closing Full" value={formatNumber(fullClosing)} icon={<Cylinder className="w-5 h-5 text-brand-400" />} highlight />
          <StockMetric label="Opening Empty" value={formatNumber(emptyOpening)} icon={<Cylinder className="w-5 h-5 text-slate-400" />} />
          <StockMetric label="Issued (Exchange)" value={formatNumber(emptyIssued)} icon={<ArrowUp className="w-5 h-5 text-red-400" />} color="text-red-400" />
          <StockMetric label="Collected" value={formatNumber(emptyCollected)} icon={<ArrowDown className="w-5 h-5 text-emerald-400" />} color="text-emerald-400" />
          <StockMetric label="Closing Empty" value={formatNumber(emptyClosing)} icon={<Cylinder className="w-5 h-5 text-brand-400" />} highlight />
        </div>
      </div>

      {/* Today's Movements Log */}
      <div className="glass rounded-2xl border border-slate-700/50 overflow-hidden">
        <div className="p-4 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white">Today's Movements ({movements.length})</h3>
        </div>

        <div className="divide-y divide-slate-800/50 max-h-96 overflow-y-auto">
          {movements.map((movement) => (
            <StockMovementRow key={movement.id} movement={movement} />
          ))}
        </div>

        {movements.length === 0 && (
          <div className="empty-state py-16">
            <Cylinder className="empty-state-icon" strokeWidth={2} />
            <p className="empty-state-title">No movements today</p>
            <p className="empty-state-description">Stock movements will appear as allocations are created and closed</p>
          </div>
        )}
      </div>

      {/* Low Stock Alerts */}
      {(fullClosing < 200 || emptyClosing < 100) && (
        <div className="glass rounded-2xl border border-slate-700/50 p-4 bg-amber-500/5 border-l-4 border-amber-500">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <p className="font-medium text-white">Low Stock Alert</p>
              <p className="text-sm text-slate-400">
                {fullClosing < 200 && <span>Full cylinders: {fullClosing} (reorder at 200)</span>}
                {fullClosing < 200 && emptyClosing < 100 && <span className="mx-2">•</span>}
                {emptyClosing < 100 && <span>Empty cylinders: {emptyClosing} (reorder at 100)</span>}
              </p>
            </div>
            <a href="/stock/update" className="btn-primary text-sm ml-auto">Add Stock</a>
          </div>
        </div>
      )}
    </div>
  )
}

function StockMetric({ label, value, icon, color = 'text-white', highlight = false }: any) {
  return (
    <div className={cn('p-4 bg-slate-800/50 rounded-xl border border-slate-700/50', highlight && 'border-brand-500/30 bg-brand-500/5')}>
      <div className="flex items-center gap-2 mb-1">
        <span className={cn('text-xl', color)}>{icon}</span>
        <p className="text-xs font-medium text-slate-400">{label}</p>
      </div>
      <p className={cn('text-2xl font-bold', color, highlight && 'text-brand-400')}>{value}</p>
    </div>
  )
}

function StockMovementRow({ movement }: any) {
  const typeColors = {
    ISSUED_TO_DRIVER: { bg: 'bg-red-500/20', text: 'text-red-400', icon: <ArrowUp className="w-4 h-4" /> },
    RETURNED_FROM_DRIVER: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: <ArrowDown className="w-4 h-4" /> },
    REFILL_RECEIVED: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: <Plus className="w-4 h-4" /> },
    MANUAL_ADJUSTMENT: { bg: 'bg-amber-500/20', text: 'text-amber-400', icon: <Plus className="w-4 h-4" /> },
    DAMAGED_LOST: { bg: 'bg-red-500/20', text: 'text-red-400', icon: <Minus className="w-4 h-4" /> },
  }

  const config = typeColors[movement.movementType as keyof typeof typeColors] || { bg: 'bg-slate-700/50', text: 'text-slate-400', icon: <Cylinder className="w-4 h-4" /> }

  return (
    <div className="p-4 hover:bg-slate-800/30 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('p-2 rounded-lg', config.bg)}>{config.icon}</div>
          <div>
            <p className="font-medium text-white">{movement.movementType.replace(/_/g, ' ')}</p>
            <p className="text-xs text-slate-400">{movement.type} Cylinders • {movement.referenceType || 'Manual'}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-right">
          <span className={cn('font-medium', config.text)}>{movement.quantity > 0 ? '+' : ''}{movement.quantity}</span>
          <span className="text-xs text-slate-500">{new Date(movement.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>
      {movement.notes && <p className="text-sm text-slate-400 mt-1 ml-10">{movement.notes}</p>}
    </div>
  )
}