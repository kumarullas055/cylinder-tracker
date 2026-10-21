import { Package, DollarSign, AlertTriangle, Calendar, TrendingUp, CreditCard, ExternalLink, Truck } from 'lucide-react'
import { formatCurrency, formatNumber, formatDate } from '@/lib/utils'
import { prisma } from '@/lib/prisma'
import { cn } from '@/lib/utils'

export async function getDriverData(id: string) {
  const driver = await prisma.driver.findUnique({
    where: { id },
    include: {
      allocations: {
        where: { status: { in: ['CLOSED', 'FLAGGED'] } },
        orderBy: { date: 'desc' },
        take: 30,
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!driver) return null

  const totalExpected = driver.allocations.reduce((sum, a) => sum + a.expectedCash, 0)
  const totalCollected = driver.payments.reduce((sum, p) => sum + p.amount, 0)
  const outstanding = totalExpected - totalCollected
  const totalCylinders = driver.allocations.reduce((sum, a) => sum + a.fullCylindersSold, 0)
  const totalDays = driver.allocations.length
  const closedDays = driver.allocations.filter(a => a.status === 'CLOSED').length
  const flaggedDays = driver.allocations.filter(a => a.status === 'FLAGGED').length
  const reliabilityScore = totalDays > 0 ? Math.round((closedDays / totalDays) * 100) : 0

  return {
    ...driver,
    totalExpected,
    totalCollected,
    outstanding,
    totalCylinders,
    totalDays,
    closedDays,
    flaggedDays,
    reliabilityScore,
  }
}

export function DriverKPICard({ 
  title, 
  value, 
  color = 'text-white',
  icon, 
  iconBg, 
  iconColor 
}: { 
  title: string
  value: string
  color?: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="glass p-5 rounded-2xl border border-slate-700/50">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{title}</p>
          <p className={cn('text-2xl font-bold mt-1', color)}>{value}</p>
        </div>
        <div className={cn('p-2 rounded-xl', iconBg)}>
          <span className={cn('text-xl', iconColor)}>{icon}</span>
        </div>
      </div>
    </div>
  )
}

export function DriverProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-white font-medium mt-1">{value}</p>
    </div>
  )
}